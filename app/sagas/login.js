import { call, delay, fork, put, select, take, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';
import { NativeModules } from 'react-native';

import { notEq } from '@nozbe/watermelondb/QueryDescription';
import * as types from '../actions/actionsTypes';
import { appStart } from '../actions/app';
import {
	selectServerRequest,
	serverFinishAdd,
	serverRequest,
	serverRequestBySwitch,
	serverRequestBySwitchRestore
} from '../actions/server';
import {
	loginFailure,
	loginRequest,
	loginSuccess,
	logout as logoutAction,
	logoutSwitching,
	setUser,
	switchLogin,
	loginEndBySwitch,
	loginSuccessRestore,
	restorePreviousUser
} from '../actions/login';
import { roomsRequest, updateMessageUnread, updateChannelUnread } from '../actions/rooms';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import I18n, { setLanguage } from '../i18n';
import database from '../lib/database';
import EventEmitter from '../lib/methods/helpers/events';
import { inviteLinksRequest } from '../actions/inviteLinks';
import { showErrorAlert } from '../lib/methods/helpers/info';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';
import { encryptionInit, encryptionStop } from '../actions/encryption';
import UserPreferences from '../lib/methods/userPreferences';
import { inquiryRequest, inquiryReset } from '../ee/omnichannel/actions/inquiry';
import { isOmnichannelStatusAvailable } from '../ee/omnichannel/lib';
import { RootEnum } from '../definitions';
import sdk from '../lib/services/sdk';
import { CURRENT_SERVER, LOGIN_RECORD_ANTALPHA, TOKEN_KEY, ENTERPRISE } from '../lib/constants';
import {
	getCustomEmojis,
	getEnterpriseModules,
	getPermissions,
	getRoles,
	getSlashCommands,
	getUserPresence,
	isOmnichannelModuleAvailable,
	logout,
	logoutLocal,
	logoutAfterServerChange,
	removeServerData,
	removeServerDatabase,
	subscribeSettings,
	subscribeUsersPresence
} from '../lib/methods';
import { SERVER } from '../actions/actionsTypes';
import { Services } from '../lib/services';

import { toggleCompanies } from '../actions/company';
import { resetContacts } from '../actions/contacts';
import { updateChannelBadge, updateMessageBadge } from '../actions/tab';
import store from '../lib/store';
import { logInfo } from '../utils/log';
import { resetWorkspace } from '../actions/workspace';
import { endNetworkTimer, initNetworkTimer } from '../lib/methods/networkTimer';
import { showToast } from '../lib/methods/helpers/showToast';
import { getDeviceToken } from '../lib/notifications';

const getServer = state => state.server.server;
const getPreviousServer = state => state.server.previousServer;
const loginWithPasswordCall = args => Services.loginWithPassword(args);
const loginCall = (credentials, isFromWebView) => Services.login(credentials, isFromWebView);
const logoutCall = args => logout(args);
const logoutLocalCall = args => logoutLocal(args);
const logoutAfterServerChangeCall = args => logoutAfterServerChange(args);

const handleLoginRequest = function* handleLoginRequest({
	credentials,
	logoutOnError = false,
	isFromWebView = false,
	registerCustomFields
}) {
	logEvent(events.LOGIN_DEFAULT_LOGIN);
	try {
		let result;
		if (credentials.resume) {
			result = yield loginCall(credentials, isFromWebView);
		} else {
			result = yield call(loginWithPasswordCall, credentials);
		}

		if (!result.username) {
			yield put(serverFinishAdd());
			yield put(setUser(result));
			yield put(appStart({ root: RootEnum.ROOT_SET_USERNAME }));
		} else {
			const server = yield select(getServer);
			yield localAuthenticate(server);
			// Saves username on server history
			const serversDB = database.servers;
			const serversHistoryCollection = serversDB.get('servers_history');
			yield serversDB.action(async () => {
				try {
					const serversHistory = await serversHistoryCollection.query(Q.where('url', server)).fetch();
					if (serversHistory?.length) {
						const serverHistoryRecord = serversHistory[0];
						// this is updating on every login just to save `updated_at`
						// keeping this server as the most recent on autocomplete order
						await serverHistoryRecord.update(s => {
							s.username = result.username;
						});
					}
				} catch (e) {
					log(e);
				}
			});
			yield put(loginSuccess(result));
			if (registerCustomFields) {
				console.info('registerCustomFields11111');
				const updatedUser = yield call(Services.saveUserProfile, {}, { ...registerCustomFields });
				yield put(setUser({ ...result, ...updatedUser.user }));
			}
		}
	} catch (e) {
		console.info('handleLoginRequest333-error', e);
		yield put(switchLogin(false));
		if (e?.data?.message && /you've been logged out by the server/i.test(e.data.message)) {
			yield put(logoutAction(true, 'Logged_out_by_server'));
		} else if (e?.data?.message && /your session has expired/i.test(e.data.message)) {
			yield put(logoutAction(true, 'Token_expired'));
		} else {
			logEvent(events.LOGIN_DEFAULT_LOGIN_F);
			yield put(loginFailure(e));
		}
	}
};

const subscribeSettingsFork = function* subscribeSettingsFork() {
	yield subscribeSettings();
};

const fetchPermissionsFork = function* fetchPermissionsFork() {
	yield getPermissions();
};

const fetchCustomEmojisFork = function* fetchCustomEmojisFork() {
	yield getCustomEmojis();
};

const fetchRolesFork = function* fetchRolesFork() {
	sdk.subscribe('stream-roles', 'roles');
	yield getRoles();
};

const fetchSlashCommandsFork = function* fetchSlashCommandsFork() {
	yield getSlashCommands();
};

const registerPushTokenFork = function* registerPushTokenFork() {
	yield Services.registerPushToken();
};

const fetchUsersPresenceFork = function* fetchUsersPresenceFork() {
	subscribeUsersPresence();
};

const fetchEnterpriseModulesFork = function* fetchEnterpriseModulesFork({ user }) {
	yield getEnterpriseModules();

	if (isOmnichannelStatusAvailable(user) && isOmnichannelModuleAvailable()) {
		yield put(inquiryRequest());
	}
};

const fetchRoomsFork = function* fetchRoomsFork() {
	yield put(roomsRequest());
};

let messageSubscribe;
let channelSubscribe;

const fetchTabBadge = function* fetchTabBadge() {
	const db = database.active;
	const messageDefaultWhereClause = [
		Q.where('archived', false),
		Q.where('open', true),
		Q.where('hide_unread_status', notEq('1')),
		Q.where('t', notEq('c'))
	];
	const channelDefaultWhereClause = [Q.where('open', true), Q.where('hide_unread_status', notEq('1')), Q.where('t', 'c')];
	let messageBadge;
	let channelBadge;
	let messageUnread;
	let channelUnread;
	const messageObservable = db
		.get('subscriptions')
		.query(...messageDefaultWhereClause)
		.observeWithColumns(['todoCount', 'unread', 'alert']);
	const channelObservable = db
		.get('subscriptions')
		.query(...channelDefaultWhereClause)
		.observeWithColumns(['on_hold', 'f', 'todoCount', 'unread', 'alert']);
	if (messageSubscribe) {
		messageSubscribe.unsubscribe();
	}
	messageSubscribe = messageObservable.subscribe(data => {
		messageBadge = 0;
		messageUnread = 0;
		data.forEach(item => {
			if (!item.hideUnreadStatus) {
				messageUnread += item.unread;
			}
			messageBadge += item.todoCount;
		});
		store.dispatch(updateMessageBadge(messageBadge));
		store.dispatch(updateMessageUnread(messageUnread));
	});
	if (channelSubscribe) {
		channelSubscribe.unsubscribe();
	}
	channelSubscribe = channelObservable.subscribe(data => {
		channelBadge = 0;
		channelUnread = 0;
		data.forEach(item => {
			if (!item.hideUnreadStatus) {
				channelUnread += item.unread;
			}
			channelBadge += item.todoCount;
		});
		store.dispatch(updateChannelBadge(channelBadge));
		store.dispatch(updateChannelUnread(channelUnread));
	});
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	try {
		getUserPresence(user.id);
		const server = yield select(getServer);
		// 如果是切换账号，则上传日志
		const switchStartTime = UserPreferences.getString('switchStartTime');
		if (switchStartTime) {
			const periodTime = new Date().getTime() - parseInt(switchStartTime);
			const JSToNativeManager = NativeModules?.JSToNativeManager;
			JSToNativeManager.checkVPNIsOpen((error, event) => {
				if (error) {
					console.info(error);
				} else {
					logInfo(server, `switchServerSuccess-vpn: ${event}`, 'info', `${periodTime}`, 'switchServer', user.id, user.username);
				}
			});
			UserPreferences.removeItem('switchStartTime');
		}

		yield put(loginEndBySwitch(true));

		yield fork(fetchRoomsFork);
		yield fork(fetchPermissionsFork);
		yield fork(fetchCustomEmojisFork);
		yield fork(fetchRolesFork);
		yield fork(fetchSlashCommandsFork);
		yield fork(registerPushTokenFork);
		yield fork(fetchUsersPresenceFork);
		yield fork(fetchEnterpriseModulesFork, { user });
		yield fork(subscribeSettingsFork);
		yield put(encryptionInit());
		// setLanguage(user?.language);

		const serversDB = database.servers;
		const usersCollection = serversDB.get('users');
		const u = {
			token: user.token,
			username: user.username,
			name: user.name,
			language: I18n.currentLocale(),
			status: user.status,
			statusText: user.statusText,
			roles: user.roles,
			isFromWebView: user.isFromWebView,
			showMessageInMainThread: user.showMessageInMainThread,
			avatarETag: user.avatarETag
		};
		yield serversDB.action(async () => {
			try {
				const userRecord = await usersCollection.find(user.id);
				await userRecord.update(record => {
					record._raw = sanitizedRaw({ id: user.id, ...record._raw }, usersCollection.schema);
					Object.assign(record, u);
				});
			} catch (e) {
				await usersCollection.create(record => {
					record._raw = sanitizedRaw({ id: user.id }, usersCollection.schema);
					Object.assign(record, u);
				});
			}
		});

		UserPreferences.setString(`${TOKEN_KEY}-${server}`, user.id);
		UserPreferences.setString(`${TOKEN_KEY}-${user.id}`, user.token);
		UserPreferences.setString(CURRENT_SERVER, server);
		const nu = { ...user, language: I18n.currentLocale() };
		yield put(setUser(nu));
		EventEmitter.emit('connected');

		const inviteLinkToken = yield select(state => state.inviteLinks.token);
		if (inviteLinkToken) {
			yield put(inviteLinksRequest(inviteLinkToken));
		}

		const appiaFanweiMobileUrl = yield select(state => state.settings.Appia_Fanwei_Mobile_Url || 'https://m.appia.vip');
		UserPreferences.setString('Appia_Fanwei_Mobile_Url', appiaFanweiMobileUrl);
		const webViewProxy = store.getState().settings.Appia_Webview_Global_Proxy;
		if (webViewProxy) {
			UserPreferences.setString('Appia_Webview_Global_Proxy', webViewProxy);
		}

		const switching = yield select(state => state.login.switching);
		if (switching) {
			yield put(switchLogin(false));
		}
		yield fork(fetchTabBadge);

		yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
		endNetworkTimer();
	} catch (e) {
		log(e);
		console.info('handleLoginSuccess-error', e);
		yield put(switchLogin(false));
		yield put(loginEndBySwitch(false));
	}
};

const handleLogout = function* handleLogout({ forcedByServer, message, bySwitch }) {
	yield put(encryptionStop());
	yield put(resetContacts());
	yield put(resetWorkspace());
	const appRoot = yield select(state => state.app.root);
	if (appRoot !== RootEnum.ROOT_LOADING) {
		yield put(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Logging_out') }));
	}
	const server = yield select(getServer);
	if (server) {
		try {
			messageSubscribe && messageSubscribe.unsubscribe();
			channelSubscribe && channelSubscribe.unsubscribe();

			if (!bySwitch) {
				yield call(logoutCall, { server });
				yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
				yield put(serverRequest(server));
			} else {
				yield logout({ server });
			}
			// if the user was logged out by the server
			if (forcedByServer) {
				// yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
				if (message) {
					showErrorAlert(I18n.t(message), I18n.t('Oops'));
				}
				yield delay(300);
				EventEmitter.emit('NewServer', { server });
			}
			yield put(logoutSwitching());
		} catch (e) {
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			log(e);
		}
	}
};

const handleSetUser = function* handleSetUser({ user }) {
	if ('avatarETag' in user) {
		const userId = yield select(state => state.login.user.id);
		const serversDB = database.servers;
		const userCollections = serversDB.get('users');
		yield serversDB.write(async () => {
			try {
				const userRecord = await userCollections.find(userId);
				await userRecord.update(record => {
					record.avatarETag = user.avatarETag;
				});
			} catch {
				//
			}
		});
	}

	setLanguage(user?.language);

	if (user?.statusLivechat && isOmnichannelModuleAvailable()) {
		if (isOmnichannelStatusAvailable(user)) {
			yield put(inquiryRequest());
		} else {
			yield put(inquiryReset());
		}
	}
};

const handleDeleteAccount = function* handleDeleteAccount() {
	yield put(encryptionStop());
	yield put(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Deleting_account') }));
	const server = yield select(getServer);
	if (server) {
		try {
			yield call(removeServerData, { server });
			yield call(removeServerDatabase, { server });
			const serversDB = database.servers;
			// all servers
			const serversCollection = serversDB.get('servers');
			const servers = yield serversCollection.query().fetch();

			// see if there're other logged in servers and selects first one
			if (servers.length > 0) {
				for (let i = 0; i < servers.length; i += 1) {
					const newServer = servers[i].id;
					const token = UserPreferences.getString(`${TOKEN_KEY}-${newServer}`);
					if (token) {
						yield put(selectServerRequest(newServer));
						return;
					}
				}
			}
			// if there's no servers, go outside
			sdk.disconnect();
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		} catch (e) {
			sdk.disconnect();
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			log(e);
		}
	}
};

const handleLoginWithServer = function* ({ server, credentials }) {
	const stateServer = yield select(getServer);

	if (stateServer !== server || !sdk.current) {
		yield put(serverRequest(server));
		yield take(SERVER.SELECT_SUCCESS);
	}
	yield put(loginRequest(credentials));
};

const handleLoginBySwitch = function* ({ data }) {
	const previousServer = yield select(getServer);
	const deviceToken = yield getDeviceToken();
	const previousUser = yield select(state => state.login.user);
	const { id, token } = previousUser;

	const nextServer = data.appiaUrl;

	const timeStart = new Date().getTime();
	UserPreferences.setString('switchStartTime', `${timeStart}`);

	initNetworkTimer(previousServer, previousUser);

	yield put(serverRequestBySwitch(nextServer));
	console.info('start==========-1');
	yield take(SERVER.SELECT_SUCCESS);

	console.info('start===========0', nextServer);
	const user = yield Services.handleLoginBySwitchRequest(nextServer, previousServer, previousUser);
	if (user) {
		yield call(logoutLocalCall, { server: previousServer });
		yield call(logoutAfterServerChangeCall, { server: previousServer, deviceToken, authToken: token, userId: id });
		// 登录成功后收起抽屉
		yield put(toggleCompanies(false));

		yield put(loginSuccess(user));

		UserPreferences.setString(ENTERPRISE, nextServer);
		// yield take(LOGIN.LOGIN_END_BY_SWITCH);
		console.info('登录成功，开始删除previous数据=======================');
	} else {
		yield put(serverRequestBySwitchRestore(previousServer));
		yield put(restorePreviousUser(previousUser));
		yield put(loginSuccessRestore());
	}
};

/* const handleLoginWithToken = function* ({ data }) {
	const stateServer = yield select(getServer);

	const server = data.appiaUrl;
	const { appiaToken } = yield Services.generateSwitchLoginToken(data);

	if (!appiaToken) {
		return;
	}

	UserPreferences.setString(ENTERPRISE, server);
	if (stateServer !== server) {
		yield put(logoutBySwitch());

		yield put(switchLogin(true));
		yield put(serverRequest(server));
		yield take(SERVER.SELECT_SUCCESS);
	} else {
		yield put(switchLogin(true));
	}
	yield put(toggleCompanies(false));
	yield put(loginRequest({ appiaToken }));
}; */

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGIN.LOGIN_WITH_SERVER, handleLoginWithServer);
	yield takeLatest(types.LOGIN.LOGIN_WITH_TOKEN, handleLoginBySwitch);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.USER.SET, handleSetUser);
	yield takeLatest(types.DELETE_ACCOUNT, handleDeleteAccount);
	while (true) {
		const params = yield take(types.LOGIN.SUCCESS);
		const loginSuccessTask = yield fork(handleLoginSuccess, params);
		// if (store.getState().app.root !== RootEnum.ROOT_LOADING) {
		// 	yield race({
		// 		selectRequest: take(types.SERVER.SELECT_REQUEST),
		// 		timeout: delay(2000)
		// 	});
		// 	yield cancel(loginSuccessTask);
		// }
	}
};
export default root;
