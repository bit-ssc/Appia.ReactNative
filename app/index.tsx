import React from 'react';
import { Dimensions, Linking, Text, TextInput } from 'react-native';
import { KeyCommandsEmitter } from 'react-native-keycommands';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import RNScreens from 'react-native-screens';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WatermarkView } from 'react-native-watermark-component';
import { rgba } from 'color2k';
import DeviceInfo from 'react-native-device-info';

import { appInit, appInitLocalSettings, setMasterDetail as setMasterDetailAction } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import AppContainer from './AppContainer';
import { KEY_COMMAND } from './commands';
import { ActionSheetProvider } from './containers/ActionSheet';
import InAppNotification from './containers/InAppNotification';
import Toast from './containers/Toast';
import TwoFactor from './containers/TwoFactor';
import Loading from './containers/Loading';
import { ICommand } from './definitions/ICommand';
import { IThemePreference } from './definitions/ITheme';
import { DimensionsContext } from './dimensions';
import { colors, isFDroidBuild, MIN_WIDTH_MASTER_DETAIL_LAYOUT, themes } from './lib/constants';
import { getAllowAnalyticsEvents, getAllowCrashReport, isIOS } from './lib/methods';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './lib/notifications';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { ThemeContext, TSupportedThemes } from './theme';
import { debounce, isTablet } from './lib/methods/helpers';
import EventEmitter from './lib/methods/helpers/events';
import { toggleAnalyticsEventsReport, toggleCrashErrorsReport } from './lib/methods/helpers/log';
import {
	getTheme,
	initialTheme,
	newThemeState,
	setNativeTheme,
	subscribeTheme,
	unsubscribeTheme
} from './lib/methods/helpers/theme';
import ChangePasscodeView from './views/ChangePasscodeView';
import ScreenLockedView from './views/ScreenLockedView';
import Feedback from './containers/Feedback';
import VoiceChatView from './containers/VoiceChatView';
import VoiceChatNotificationView from './containers/VoiceChatNotificationView';
import { IApplicationState } from './definitions';
import { TalkingDataSDK } from './TalkingDataSDK';

RNScreens.enableScreens();
initStore(store);

interface IDimensions {
	width: number;
	height: number;
	scale: number;
	fontScale: number;
}

interface IState {
	theme: TSupportedThemes;
	themePreferences: IThemePreference;
	width: number;
	height: number;
	scale: number;
	fontScale: number;
}

const parseDeepLinking = (url: string) => {
	if (url) {
		let fullURL = url;
		url = url.replace(/appia:\/\/|https:\/\/\*\.appia\.cn\//, '');
		const regex = /^(room|auth|invite)\?/;
		if (url.match(regex)) {
			url = url.replace(regex, '').trim();
			if (url) {
				return { fullURL, ...parseQuery(url) };
			}
		}
		const call = /^(https:\/\/)?jitsi.rocket.chat\//;
		fullURL = url;

		if (url.match(call)) {
			url = url.replace(call, '').trim();
			if (url) {
				return { path: url, isCall: true, fullURL };
			}
		}
	}
	return null;
};

export default class Root extends React.Component<{}, IState> {
	private listenerTimeout!: any;

	private onKeyCommands: any;

	constructor(props: any) {
		super(props);

		/* eslint-disable */
		if (Text.defaultProps == null && props.default_font_setting !== 'Follow_System_Setting') {
			Text.defaultProps = {};
			Text.defaultProps.allowFontScaling = false;
			TextInput.defaultProps = TextInput.defaultProps || {};
			TextInput.defaultProps.allowFontScaling = false;
		}
		/* eslint-disable */

		this.init();
		if (!isFDroidBuild) {
			this.initCrashReport();
		}
		const { width, height, scale, fontScale } = Dimensions.get('window');
		const theme = initialTheme();
		this.state = {
			theme: getTheme(theme),
			themePreferences: theme,
			width,
			height,
			scale,
			fontScale
		};
		if (isTablet) {
			this.initTablet();
		}
		setNativeTheme(theme);
	}

	componentDidMount() {
		this.listenerTimeout = setTimeout(() => {
			Linking.addEventListener('url', ({ url }) => {
				const parsedDeepLinkingURL = parseDeepLinking(url);
				if (parsedDeepLinkingURL) {
					store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
				}
			});
		}, 5000);
		Dimensions.addEventListener('change', this.onDimensionsChange);

		TalkingDataSDK.init(
			'',
			isIOS ? 'AppStore' : DeviceInfo.getBrand(),
			(store.getState() as IApplicationState).login.user.username ?? ''
		);
	}

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);
		Dimensions.removeEventListener('change', this.onDimensionsChange);

		unsubscribeTheme();

		if (this.onKeyCommands && this.onKeyCommands.remove) {
			this.onKeyCommands.remove();
		}
	}

	init = async () => {
		store.dispatch(appInitLocalSettings());

		// Open app from push notification
		const notification = await initializePushNotifications();
		if (notification) {
			onNotification(notification);
			return;
		}

		// Open app from deep linking
		const deepLinking = await Linking.getInitialURL();
		const parsedDeepLinkingURL = parseDeepLinking(deepLinking!);
		if (parsedDeepLinkingURL) {
			store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
			return;
		}

		// Open app from app icon
		store.dispatch(appInit());
	};

	getMasterDetail = (width: number) => {
		if (!isTablet) {
			return false;
		}
		return width > MIN_WIDTH_MASTER_DETAIL_LAYOUT;
	};

	setMasterDetail = (width: number) => {
		const isMasterDetail = this.getMasterDetail(width);
		store.dispatch(setMasterDetailAction(isMasterDetail));
	};

	// Dimensions update fires twice
	onDimensionsChange = debounce(({ window: { width, height, scale, fontScale } }: { window: IDimensions }) => {
		this.setDimensions({
			width,
			height,
			scale,
			fontScale
		});
		this.setMasterDetail(width);
	});

	setTheme = (newTheme = {}) => {
		// change theme state
		this.setState(
			prevState => newThemeState(prevState, newTheme as IThemePreference),
			() => {
				const { themePreferences } = this.state;
				// subscribe to Appearance changes
				subscribeTheme(themePreferences, this.setTheme);
			}
		);
	};

	setDimensions = ({ width, height, scale, fontScale }: IDimensions) => {
		this.setState({ width, height, scale, fontScale });
	};

	initTablet = () => {
		const { width } = this.state;
		this.setMasterDetail(width);
		this.onKeyCommands = KeyCommandsEmitter.addListener('onKeyCommand', (command: ICommand) => {
			EventEmitter.emit(KEY_COMMAND, { event: command });
		});
	};

	initCrashReport = () => {
		getAllowCrashReport().then(allowCrashReport => {
			toggleCrashErrorsReport(allowCrashReport);
		});
		getAllowAnalyticsEvents().then(allowAnalyticsEvents => {
			toggleAnalyticsEventsReport(allowAnalyticsEvents);
		});
	};

	render() {
		const { themePreferences, theme, width, height, scale, fontScale } = this.state;
		return (
			<SafeAreaProvider
				initialMetrics={initialWindowMetrics}
				style={{ backgroundColor: themes[this.state.theme].backgroundColor }}
			>
				<Provider store={store}>
					<ThemeContext.Provider
						value={{
							theme,
							themePreferences,
							setTheme: this.setTheme,
							colors: colors[theme]
						}}
					>
						<DimensionsContext.Provider
							value={{
								width,
								height,
								scale,
								fontScale,
								setDimensions: this.setDimensions
							}}
						>
							<GestureHandlerRootView style={{ flex: 1 }}>
								<ActionSheetProvider>
									<WatermarkView
										foreground
										watermark={(store.getState() as IApplicationState).login.user.username}
										itemWidth={width / 3}
										itemHeight={120}
										rotateZ={-30}
										watermarkTextStyle={{ color: rgba(210, 210, 210, 0.02) }}
									>
										<AppContainer />
									</WatermarkView>
									<TwoFactor />
									<ScreenLockedView />
									<ChangePasscodeView />
									<InAppNotification />
									<Toast />
									<Feedback />
									<Loading />
									<VoiceChatView />
									<VoiceChatNotificationView />
								</ActionSheetProvider>
							</GestureHandlerRootView>
						</DimensionsContext.Provider>
					</ThemeContext.Provider>
				</Provider>
			</SafeAreaProvider>
		);
	}
}
