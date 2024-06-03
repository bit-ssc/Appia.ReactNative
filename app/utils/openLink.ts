import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import parse from 'url-parse';

import { MEETING_REG, themes } from '../lib/constants';
import { TSupportedThemes } from '../theme';
import UserPreferences from '../lib/methods/userPreferences';
import Navigation from '../lib/navigation/appNavigation';
import store from '../lib/store';

export const DEFAULT_BROWSER_KEY = 'DEFAULT_BROWSER_KEY';

const scheme = {
	chrome: 'googlechrome:',
	chromeSecure: 'googlechromes:',
	firefox: 'firefox:',
	brave: 'brave:'
};

const appSchemeURL = (url: string, browser: string): string => {
	let schemeUrl = url;
	const parsedUrl = parse(url, true);
	const { protocol } = parsedUrl;
	const isSecure = ['https:'].includes(protocol);

	if (browser === 'googlechrome') {
		if (!isSecure) {
			schemeUrl = url.replace(protocol, scheme.chrome);
		} else {
			schemeUrl = url.replace(protocol, scheme.chromeSecure);
		}
	} else if (browser === 'firefox') {
		schemeUrl = `${scheme.firefox}//open-url?url=${url}`;
	} else if (browser === 'brave') {
		schemeUrl = `${scheme.brave}//open-url?url=${url}`;
	}

	return schemeUrl;
};

const openLink = async (url: string, theme: TSupportedThemes = 'light'): Promise<void> => {
	try {
		const browser = UserPreferences.getString(DEFAULT_BROWSER_KEY);
		const { server } = store.getState().server;

		/* 		if (url.includes('lexiangla.com')) {
			const params = {
				needAuth: true,
				source: 'LEXIANG'
			};
			openWebview(encodeURIComponent(url), params);
			return;
		} */

		if (url.startsWith(server) || url.includes('shimo-web') || url.includes('mail.google.com')) {
			openWebview(url, { title: ' ' });
		} else if (browser === 'inApp') {
			await WebBrowser.openBrowserAsync(url, {
				toolbarColor: themes[theme].headerBackground,
				controlsColor: themes[theme].headerTintColor,
				// https://github.com/expo/expo/pull/4923
				enableBarCollapsing: true,
				showTitle: true
			});
		} else {
			const schemeUrl = appSchemeURL(url, browser!.replace(':', ''));
			await Linking.openURL(schemeUrl);
		}
	} catch {
		try {
			await Linking.openURL(url);
		} catch {
			// do nothing
		}
	}
};

export default openLink;

interface IOpenWebviewParams {
	title: string;
	needAuth: boolean;
	source: string;
	urlType: number;
}

export const openWebview = async (
	url: string,
	params: Partial<IOpenWebviewParams> = {},
	theme: TSupportedThemes = 'light'
): Promise<void> => {
	if (MEETING_REG.test(url)) {
		try {
			await WebBrowser.openBrowserAsync(url.trim(), {
				toolbarColor: themes[theme].headerBackground,
				controlsColor: themes[theme].headerTintColor,
				enableBarCollapsing: true,
				showTitle: true
			});
		} catch (e) {
			console.error(e);
		}
		return;
	}

	await Navigation.navigate('WebPageView', {
		...params,
		url
	});
};
