import { select, takeLatest, put } from 'redux-saga/effects';

import log from '../lib/methods/helpers/log';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../lib/methods/helpers/localAuthentication';
import { APP_STATE } from '../actions/actionsTypes';
import { RootEnum } from '../definitions';
import { Services } from '../lib/services';
import { logInfo } from '../utils/log';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === RootEnum.ROOT_OUTSIDE) {
		return;
	}
	const login = yield select(state => state.login);
	const server = yield select(state => state.server);
	if (!login.isAuthenticated || login.isFetching || server.connecting || server.loading || server.changingServer) {
		return;
	}
	logInfo(server.server, 'ComeBackToForeground', 'info', 'ComeBackToForeground', 'sagas', login.username, login.id);
	try {
		console.info('appHasComeBackToForeground1');
		yield localAuthenticate(server.server);
		console.info('appHasComeBackToForeground2');
		Services.checkAndReopen();
		console.info('appHasComeBackToForeground3');
		return yield Services.setUserPresenceOnline();
	} catch (e) {
		console.info('appHasComeBackToForeground4', e);
		log(e);
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === RootEnum.ROOT_OUTSIDE) {
		return;
	}
	try {
		const server = yield select(state => state.server.server);
		yield saveLastLocalAuthenticationSession(server);

		yield Services.setUserPresenceAway();
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(APP_STATE.FOREGROUND, appHasComeBackToForeground);
	yield takeLatest(APP_STATE.BACKGROUND, appHasComeBackToBackground);
};

export default root;
