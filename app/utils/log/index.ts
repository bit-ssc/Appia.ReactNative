import firebaseAnalytics from '@react-native-firebase/analytics';
import DeviceInfo from 'react-native-device-info';
import moment from 'moment/moment';

import { isFDroidBuild } from '../../lib/constants';
import events from './events';
import { isAndroid } from '../deviceInfo';
import sdk from '../../lib/services/sdk';

const analytics = firebaseAnalytics || '';
let bugsnag: any = '';
let reportCrashErrors = true;
let crashlytics: any;
let reportAnalyticsEvents = true;

export const getReportCrashErrorsValue = (): boolean => reportCrashErrors;
export const getReportAnalyticsEventsValue = (): boolean => reportAnalyticsEvents;

if (!isFDroidBuild) {
	bugsnag = require('@bugsnag/react-native').default;

	bugsnag.start({
		onBreadcrumb() {
			return reportAnalyticsEvents;
		},
		onError(error: { breadcrumbs: string[] }) {
			if (!reportAnalyticsEvents) {
				error.breadcrumbs = [];
			}
			return reportCrashErrors;
		}
	});
	crashlytics = require('@react-native-firebase/crashlytics').default;
}

export { analytics };
export const loggerConfig = bugsnag.config;
export { events };

let metadata = {};

export const logServerVersion = (serverVersion: string): void => {
	metadata = {
		serverVersion
	};
};

export const logEvent = (eventName: string, payload?: { [key: string]: any }): void => {
	try {
		if (!isFDroidBuild) {
			analytics().logEvent(eventName, payload);
			bugsnag.leaveBreadcrumb(eventName, payload);
		}
	} catch {
		// Do nothing
	}
};

export const setCurrentScreen = (currentScreen: string): void => {
	if (!isFDroidBuild) {
		analytics().setCurrentScreen(currentScreen);
		bugsnag.leaveBreadcrumb(currentScreen, { type: 'navigation' });
	}
};

export const toggleCrashErrorsReport = (value: boolean): boolean => {
	crashlytics().setCrashlyticsCollectionEnabled(value);
	return (reportCrashErrors = value);
};

export const toggleAnalyticsEventsReport = (value: boolean): boolean => {
	analytics().setAnalyticsCollectionEnabled(value);
	return (reportAnalyticsEvents = value);
};

export default (e: any): void => {
	if (e instanceof Error && bugsnag && e.message !== 'Aborted' && !__DEV__) {
		bugsnag.notify(e, (event: { addMetadata: (arg0: string, arg1: {}) => void }) => {
			event.addMetadata('details', { ...metadata });
		});
		if (!isFDroidBuild) {
			crashlytics().recordError(e);
		}
	} else {
		console.error(e);
	}
};

interface ILogInterface {
	name: string;
	level: string;
	content: {
		time: string;
		action: string;
		appiaVersion: string;
		brand: string;
		server: string;
		osVersion: string;
		isLandscape: boolean;
		model: string;
	};
	platform: string;
	module: string;
	tag: string;
	user_info: {
		user_id: string;
		user_name: string;
	};
}

export const logInfo = (
	server: string,
	name: string,
	level: string,
	action: string,
	module: string,
	userId?: string,
	userName?: string
): void => {
	const logInfo = {
		name,
		level,
		content: {
			time: moment().format('YYYY-MM-DD HH:mm:ss'),
			action,
			appiaVersion: DeviceInfo.getVersion(),
			brand: DeviceInfo.getBrand(),
			server,
			osVersion: DeviceInfo.getSystemVersion(),
			isLandscape: DeviceInfo.isLandscapeSync(),
			model: DeviceInfo.getModel()
		},
		platform: isAndroid ? `android-${DeviceInfo.getBrand()}` : 'ios',
		module,
		tag: '',
		user_info: {
			user_id: userId,
			// eslint-disable-next-line no-undef
			user_name: userName
		}
	} as ILogInterface;

	console.info(`${server}/api/vi/log.save`);

	// @ts-ignore
	sdk.post('log.save', logInfo).then(res => {
		res.success ? console.info(`${action} upload log success`) : console.info('upload log fail');
	});
};
