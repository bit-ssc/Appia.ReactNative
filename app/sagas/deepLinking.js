import { all, delay, put, select, take, takeLatest } from 'redux-saga/effects';

import UserPreferences from '../lib/methods/userPreferences';
import * as types from '../actions/actionsTypes';
import { selectServerRequest, serverInitAdd } from '../actions/server';
import { inviteLinksRequest, inviteLinksSetToken } from '../actions/inviteLinks';
import database from '../lib/database';
import EventEmitter from '../lib/methods/helpers/events';
import { appInit, appStart } from '../actions/app';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { getUidDirectMessage } from '../lib/methods/helpers';
import { loginRequest } from '../actions/login';
import log from '../lib/methods/helpers/log';
import { RootEnum } from '../definitions';
import { CURRENT_SERVER, TOKEN_KEY } from '../lib/constants';
import { callJitsi, callJitsiWithoutServer, canOpenRoom } from '../lib/methods';
import { Services } from '../lib/services';
import { logInfo } from '../utils/log';

const roomTypes = {
	channel: 'c',
	direct: 'd',
	group: 'p',
	channels: 'l'
};

const handleInviteLink = function* handleInviteLink({ params, requireLogin = false }) {
	if (params.path && params.path.startsWith('invite/')) {
		const token = params.path.replace('invite/', '');
		if (requireLogin) {
			yield put(inviteLinksSetToken(token));
		} else {
			yield put(inviteLinksRequest(token));
		}
	}
};

const navigate = function* navigate({ params }) {
	yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
	const userInfo = yield select(state => state.login.user);

	logInfo(
		params.host ? params.host : '',
		'deep_link_open',
		'info',
		`fullPath:${params.fullURL}`,
		'navigate-1',
		userInfo?.id,
		userInfo?.username
	);
	if (params.path || params.rid) {
		let type;
		let name;
		let jumpToThreadId;
		if (params.path) {
			// Following this pattern: {channelType}/{channelName}/thread/{threadId}
			[type, name, , jumpToThreadId] = params.path.split('/');
		}
		if (type !== 'invite' || params.rid) {
			const room = yield canOpenRoom(params);
			if (room) {
				const item = {
					name,
					t: roomTypes[type],
					roomUserId: getUidDirectMessage(room),
					...room
				};

				const isMasterDetail = yield select(state => state.app.isMasterDetail);
				const jumpToMessageId = params.messageId;

				yield goRoom({ item, isMasterDetail, jumpToMessageId, jumpToThreadId, popToRoot: true, isDeepLink: true });
				if (params.isCall) {
					callJitsi(item);
				}
				logInfo(
					params.host ? params.host : '',
					'deep_link_open',
					'info',
					`fullPath:${params.fullURL} item=${item} isMasterDetail=${isMasterDetail} jumpToMessageId=${jumpToMessageId}`,
					'navigate-2',
					userInfo?.id,
					userInfo?.username
				);
			}
			logInfo(
				params.host ? params.host : '',
				'deep_link_open',
				'info',
				`fullPath:${params.fullURL} room=${room}`,
				'navigate-3',
				userInfo?.id,
				userInfo?.username
			);
		} else {
			yield handleInviteLink({ params });
		}
	}
};

const fallbackNavigation = function* fallbackNavigation() {
	const currentRoot = yield select(state => state.app.root);
	if (currentRoot) {
		return;
	}
	yield put(appInit());
};

const handleOAuth = function* handleOAuth({ params }) {
	const { credentialToken, credentialSecret } = params;
	try {
		yield Services.loginOAuthOrSso({ oauth: { credentialToken, credentialSecret } }, false);
	} catch (e) {
		log(e);
	}
};

const handleOpen = function* handleOpen({ params }) {
	try {
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		const userInfo = yield select(state => state.login.user);

		logInfo(
			params.host ? params.host : '',
			'deep_link_open',
			'info',
			`fullPath:${params.fullURL}`,
			'handleOpen-1',
			userInfo?.id,
			userInfo?.username
		);

		let { host } = params;
		if (params.isCall && !host) {
			const servers = yield serversCollection.query().fetch();
			// search from which server is that call
			servers.forEach(({ uniqueID, id }) => {
				if (params.path.includes(uniqueID)) {
					host = id;
				}
			});

			if (!host && params.fullURL) {
				callJitsiWithoutServer(params.fullURL);
				return;
			}
		}

		if (params.type === 'oauth') {
			yield handleOAuth({ params });
			return;
		}

		// If there's no host on the deep link params and the app is opened, just call appInit()
		if (!host) {
			yield fallbackNavigation();
			return;
		}

		// If there's host, continue
		if (!/^(http|https)/.test(host)) {
			if (/^localhost(:\d+)?/.test(host)) {
				host = `http://${host}`;
			} else {
				host = `https://${host}`;
			}
		} else {
			// Notification should always come from https
			host = host.replace('http://', 'https://');
		}
		// remove last "/" from host
		if (host.slice(-1) === '/') {
			host = host.slice(0, host.length - 1);
		}

		const [server, user] = yield all([
			UserPreferences.getString(CURRENT_SERVER),
			UserPreferences.getString(`${TOKEN_KEY}-${host}`)
		]);

		// TODO: needs better test
		// if deep link is from same server
		if (server === host && user) {
			const connected = yield select(state => state.server.connected);
			if (!connected) {
				yield localAuthenticate(host);
				yield put(selectServerRequest(host));
				yield take(types.LOGIN.SUCCESS);
			}
			const userInfo2 = yield select(state => state.login.user);
			logInfo(
				params.host ? params.host : '',
				'deep_link_open',
				'info',
				`fullPath:${params.fullURL}   connected=${connected}`,
				'handleOpen-2',
				userInfo2?.id,
				userInfo2?.username
			);
			yield navigate({ params });
		} else {
			// search if deep link's server already exists
			try {
				const hostServerRecord = yield serversCollection.find(host);
				if (hostServerRecord && user) {
					yield localAuthenticate(host);
					yield put(selectServerRequest(host, hostServerRecord.version, true, true));
					yield take(types.LOGIN.SUCCESS);
					yield navigate({ params });
					logInfo(
						params.host ? params.host : '',
						'deep_link_open',
						'info',
						`fullPath:${params.fullURL} server=${server}  host=${host} user=${user} hostServerRecord=${hostServerRecord}`,
						'handleOpen-3',
						userInfo?.id,
						userInfo?.username
					);
					return;
				}
				logInfo(
					params.host ? params.host : '',
					'deep_link_open',
					'info',
					`fullPath:${params.fullURL} server=${server}  host=${host} user=${user} hostServerRecord=${hostServerRecord}`,
					'handleOpen-4',
					userInfo?.id,
					userInfo?.username
				);
			} catch (e) {
				logInfo(
					params.host ? params.host : '',
					'deep_link_open',
					'error',
					`fullPath:${params.fullURL} server=${server}  host=${host} user=${user} error=${e}`,
					'handleOpen-5',
					userInfo?.id,
					userInfo?.username
				);
			}
			// if deep link is from a different server
			const result = yield Services.getServerInfo(host);
			if (!result.success) {
				// Fallback to prevent the app from being stuck on splash screen
				yield fallbackNavigation();
				logInfo(
					params.host ? params.host : '',
					'deep_link_open',
					'info',
					`fullPath:${params.fullURL} server=${server}  host=${host} user=${user}`,
					'handleOpen-6',
					userInfo?.id,
					userInfo?.username
				);
				return;
			}
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			yield put(serverInitAdd(server));
			yield delay(1000);
			EventEmitter.emit('NewServer', { server: host });

			if (params.token) {
				yield take(types.SERVER.SELECT_SUCCESS);
				yield put(loginRequest({ resume: params.token }, true));
				yield take(types.LOGIN.SUCCESS);
				yield navigate({ params });
			} else {
				yield handleInviteLink({ params, requireLogin: true });
			}
		}
	} catch (error) {
		const userInfo = yield select(state => state.login.user);
		logInfo(
			params.host ? params.host : '',
			'deep_link_open',
			'error',
			`fullPath:${params.fullURL} error=${error}`,
			'handleOpen-7',
			userInfo?.id,
			userInfo?.username
		);
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
