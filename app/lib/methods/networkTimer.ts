// import BackgroundTimer from 'react-native-background-timer';

import { NativeModules } from 'react-native';

import { appStart } from '../../actions/app';
import { showToast } from './helpers/showToast';
import { store as reduxStore } from '../store/auxStore';
import { RootEnum } from '../../definitions';
import I18n from '../../i18n';
import { loginEndBySwitch, loginSuccessRestore, restorePreviousUser } from '../../actions/login';
import { serverRequestBySwitchRestore } from '../../actions/server';
import { logInfo } from '../../utils/log';
import UserPreferences from './userPreferences';
import sdk from '../services/sdk';

let interval: any = null;

let secondsElapsed = 0;

export const initNetworkTimer = (previousServer: string, previousUser: any) => {
	if (interval) {
		clearInterval(interval);
		secondsElapsed = 0;
		interval = null;
	}

	interval = setInterval(() => {
		secondsElapsed += 1;
		console.info(`==================第${secondsElapsed}秒=====================`);
		if (secondsElapsed === 3) {
			reduxStore.dispatch(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('LoadTimeLong') }));
		}
		if (secondsElapsed === 15) {
			sdk.current.abort();
			sdk.current.abortController = new AbortController();

			reduxStore.dispatch(serverRequestBySwitchRestore(previousServer));
			reduxStore.dispatch(restorePreviousUser(previousUser));
			reduxStore.dispatch(loginSuccessRestore());

			reduxStore.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));

			const { server } = reduxStore.getState().server;
			const { id, username } = reduxStore.getState().login.user;

			const JSToNativeManager = NativeModules?.JSToNativeManager;
			JSToNativeManager.checkVPNIsOpen((error: any, event: any) => {
				if (error) {
					console.info(error);
				} else {
					logInfo(server, 'timerout15', 'error', `vpn: ${event}`, 'switchServer', id, username);
				}
			});

			showToast(I18n.t('NetworkError'));
			endNetworkTimer();
		}
	}, 1000);
};

export const endNetworkTimer = () => {
	reduxStore.dispatch(loginEndBySwitch(false));
	UserPreferences.removeItem('switchStartTime');
	if (interval) {
		clearInterval(interval);
		interval = null;
		secondsElapsed = 0;
	}
};
