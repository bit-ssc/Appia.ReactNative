import qs from 'querystring';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Text,
	View,
	StyleSheet,
	StatusBar,
	NativeModules,
	PermissionsAndroid,
	Alert,
	DeviceEventEmitter,
	Dimensions,
	Keyboard
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useSelector, useDispatch } from 'react-redux';
import Touchable from 'react-native-platform-touchable';
import { StackNavigationProp } from '@react-navigation/stack';
import URLParse from 'url-parse';
import CameraRoll from '@react-native-community/cameraroll';
import * as mime from 'react-native-mime-types';
import RNFetchBlob from 'react-native-blob-util';
import { sha256 } from 'js-sha256';
import { getStatusBarHeight } from 'react-native-safearea-height';
import { WatermarkView } from 'react-native-watermark-component';
import { rgba } from 'color2k';

import { LISTENER } from '../containers/Toast';
import Button from '../containers/Button';
import EventEmitter from '../utils/events';
import SafeAreaView from '../containers/SafeAreaView';
import { CustomIcon } from '../containers/CustomIcon';
import ActivityIndicator from '../containers/ActivityIndicator';
import { getUserSelector } from '../selectors/login';
import { WebPageViewStackParamList } from '../stacks/types';
import Navigation from '../lib/navigation/appNavigation';
import { attachmentToPhoto, IApplicationState, IAttachment, SubscriptionType } from '../definitions';
import { useTheme } from '../theme';
import { MEETING_REG, MEETING_SCHEME_REG, themes } from '../lib/constants';
import { getAuthCode } from '../lib/services/restApi';
import { fileDownloadAndPreview } from '../utils/fileDownload';
import { isAndroid, isIOS } from '../utils/deviceInfo';
import I18n from '../i18n';
import { showToast } from '../lib/methods/helpers/showToast';
import FanweiOA from './FanweiOA';
import { logout } from '../actions/login';

const styles = StyleSheet.create({
	loadError: {
		flex: 1,
		marginTop: 200,
		alignContent: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff'
	},
	loadText: {
		textAlign: 'center',
		fontSize: 16
	}
});

interface IAuthResult {
	accessUrl?: string;
	token?: string;
	success: boolean;
}

const WebPageView = (props: any) => {
	const navigation = useNavigation<StackNavigationProp<WebPageViewStackParamList, 'WebPageView'>>();
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const enterpriseId = useSelector((state: IApplicationState) => state.settings.Enterprise_ID);
	const [authResult, setAuthResult] = useState<IAuthResult | null>(null);
	const server = useSelector((state: IApplicationState) => state.server.server);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState(false);
	// const [isApproval, setIsApproval] = useState(false); // 是否为文件审批
	const [approvalTitle, setApprovalTitle] = useState('文件名');
	const [approvalUrl, setApprovalUrl] = useState('');
	const [showApprovalFile, setShowApprovalFile] = useState(false); // 显示全屏的审批文件
	const [approvalFileNavHeight, setApprovalFileNavHeight] = useState(0); // 自定义nav的初始高度
	const fanweiMobileUrl = useSelector(
		(state: IApplicationState) => state.settings.Appia_Fanwei_Mobile_Url || 'https://m.appia.vip'
	) as string;

	const { route } = props;
	const { url, needAuth, source, urlType } = route.params;
	const { theme } = useTheme();
	const wv: any = null;
	const temp = useRef({ wv, url, canGoBack: false });

	const [title, setTitle] = useState<string>(route.params.title);
	const [uri, setUri] = useState<string>('');
	const [webviewKey, setWebviewKey] = useState(0);

	const dispatch = useDispatch();

	const injectedJavaScript = useMemo(() => {
		if (url?.startsWith(server)) {
			let script = `
;(function(){
	const localStorage = window.localStorage
	const loginToken = localStorage.getItem('Meteor.loginToken');
	const userId = localStorage.getItem('Meteor.userId');
  const source = localStorage.getItem('source');
  const org = localStorage.getItem('org');

	if (loginToken !== '${user.token}') {
		localStorage.setItem('Meteor.loginToken', '${user.token}');
	}

	if (userId !== '${user.id}') {
		localStorage.setItem('Meteor.userId', '${user.id}');
	}

  if (source !== 'appia') {
		localStorage.setItem('source', 'appia');
	}

  if (org !== '${enterpriseId}') {
		localStorage.setItem('org', '${enterpriseId}');
	}


})();
`;
			if (isAndroid) {
				script += `  function wrap(fn) {
      return function wrapper() {
        var res = fn.apply(this, arguments);
        window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'navigationStateChange',url:window.location.href}));
        return res;
      }
    }
  
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'navigationStateChange',url:window.location.href}));    // web端向APP端发送消息
    });`;
			}
			return script;
		}
		if (source === 'RECRUITMENT') {
			const styleStr = `.mobile-recruit-paas-interviewer-replay__page-head,.recruit-paas-mobile-head-tabs__container-left,.drawer-animation-wrap-header-return,.fixed-header{display: none;}`;
			return `
		;(function(){
			setTimeout(() => {
					const head = document.getElementsByTagName('head')[0];
					const styleEle = document.createElement('style');
					styleEle.innerHTML = '${styleStr}';
					head.appendChild(styleEle);
			}, 500)
		})();
		`;
		}
		return '';
	}, [url, server, source, user.token, user.id, enterpriseId]);

	const backCloseUrls = useMemo(() => ['/approve/list', '/error', '/404', '/500', '/403'], []);

	const goBack = useCallback(
		(navigation: StackNavigationProp<WebPageViewStackParamList, 'WebPageView'>) => {
			if (backCloseUrls.some(path => temp.current.url.indexOf(path) > 0)) {
				navigation?.pop();
			} else if (temp.current.url.startsWith(fanweiMobileUrl)) {
				navigation.pop();
			} else if (temp.current.canGoBack) {
				temp.current.wv?.goBack();
			} else {
				navigation?.pop();
			}
		},
		[backCloseUrls, fanweiMobileUrl]
	);

	const onJsCallNative = useCallback((dataStr: string) => {
		if (dataStr) {
			const data = JSON.parse(dataStr);
			switch (data.eventType) {
				case 'UserProfile':
					const params = { rid: data.username, t: SubscriptionType.DIRECT };
					Navigation.navigate('ChatsStackNavigator', { screen: 'RoomInfoView', params });
					break;

				case 'PreviewDocs':
					setLoading(true);
					fileDownloadAndPreview(data.url, {
						title: data.title
					}).finally(() => {
						setLoading(false);
					});
					break;

				case 'ImageViewer':
					if (isIOS) {
						Keyboard.dismiss();
					}
					const attachment: IAttachment = {
						image_url: data.url
					};
					const photo = attachmentToPhoto(attachment);
					const JSToNativeManager = NativeModules?.JSToNativeManager;
					JSToNativeManager.showPhoto(photo);
					break;

				case 'SetTitle':
					setTitle(data.title);
					break;
				case 'DownloadPhoto':
					downloadPhoto(data.url);
					break;
				case 'OpenFileUrl':
					openUrlByBrowser(data.url, data.title);
					break;
				case 'SetApprovalInfo':
					changeApprovalInfo(data.url);
					break;
				case 'navigationStateChange':
					temp.current.canGoBack = true;
					temp.current.url = data.url;
					break;
				case 'onResetPasswordSuccess':
					resetPwdLogout();
					break;
				case 'iOSDownload':
					showToast(I18n.t('Webview_Download_iOS'));
					break;
			}
		}
	}, []);

	const resetPwdLogout = () => {
		console.info('logout');
		dispatch(logout());
	};

	const downloadPhoto = async (imageUrl: string) => {
		if (isAndroid) {
			const rationale = {
				title: I18n.t('Write_External_Permission'),
				message: I18n.t('Write_External_Permission_Message'),
				buttonPositive: 'Ok'
			};
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, rationale);
			if (!(result || result === PermissionsAndroid.RESULTS.GRANTED)) {
				return;
			}
		}

		setLoading(true);
		try {
			const extension = `.${mime.extension('png') || 'jpg'}`;
			// The return of mime.extension('video/quicktime') is .qt,
			// this format the iOS isn't recognize and can't save on gallery
			const documentDir = `${RNFetchBlob.fs.dirs.DocumentDir}/`;
			const path = `${documentDir + sha256(url!) + extension}`;
			const file = await RNFetchBlob.config({ path }).fetch('GET', imageUrl);
			await CameraRoll.save(path, { album: 'Appia' });
			await file.flush();
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
		} catch (e) {
			// if (!isAndroid) {
			if (e.code === 'E_PHOTO_LIBRARY_AUTH_DENIED') {
				Alert.alert(
					I18n.t('Alert_Permission'),
					I18n.t('Alert_Open_Gallary_Permission'),
					[
						{
							text: I18n.t('Confirm'),
							onPress: () => {
								const JSToNativeManager = NativeModules?.JSToNativeManager;
								JSToNativeManager.jumpToSystemSetting();
							}
						}
					],
					{ cancelable: false }
				);
			}
			// } else {
			// 	EventEmitter.emit(LISTENER, { message: I18n.t(image_url ? 'error-save-image' : 'error-save-video') });
			// }
		}
		setLoading(false);
	};

	const openUrlByBrowser = (url: string, title: string) => {
		const screen = Dimensions.get('window');
		const { width, height } = screen;
		if (width > height) {
			setApprovalFileNavHeight(0);
		} else {
			setApprovalFileNavHeight(getStatusBarHeight());
		}
		setShowApprovalFile(true);
		setApprovalUrl(url);
		setApprovalTitle(title);
		Dimensions.addEventListener('change', onScreenChange);
	};

	const changeApprovalInfo = (url: string) => {
		setApprovalUrl(url);
	};

	const onScreenChange = () => {
		const screen = Dimensions.get('window');
		const { width, height } = screen;
		if (width > height) {
			setApprovalFileNavHeight(0);
		} else {
			setApprovalFileNavHeight(getStatusBarHeight());
		}
	};

	useEffect(() => {
		const subscription = DeviceEventEmitter.addListener('picture_download', getPictureUrl);
		return () => {
			console.info('WebView-Remove');
			subscription.remove();
		};
	}, []);

	const getPictureUrl = (e: string) => {
		e && downloadPhoto(e);
	};

	useEffect(() => {
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: title || 'Appia',
			headerLeft: () => (
				<Touchable onPress={() => (source === 'chat-gpt' ? navigation?.pop() : goBack(navigation))} style={{ marginLeft: 12 }}>
					<CustomIcon name='chevron-left-big' size={24} color={themes[theme].headerTintColor} />
				</Touchable>
			),
			headerRight: () =>
				source === 'chat-gpt' ? null : (
					<Touchable onPress={() => navigation?.pop()} style={{ marginRight: 12 }}>
						<CustomIcon name='close' size={24} color={themes[theme].headerTintColor} />
					</Touchable>
				),
			headerShown: !showApprovalFile
		});
	}, [goBack, navigation, theme, title, showApprovalFile]);

	useEffect(() => {
		const getData = async () => {
			try {
				const data = (await getAuthCode(url, source)) as IAuthResult;
				if (data && !data.accessUrl && !data.token) {
					setLoadError(true);
				}
				setAuthResult(data);
			} catch (e) {
				setLoadError(true);
			}
		};

		if (needAuth) {
			getData();
		}

		return () => {
			Dimensions.removeEventListener('change', onScreenChange);
			if (isIOS) {
				const JSToNativeManager = NativeModules?.JSToNativeManager;
				JSToNativeManager?.resetStatusBar();
			}
		};

		// eslint-disable-next-line
	}, []);

	const getUrl = useCallback(
		(auth: IAuthResult | null) => {
			if (uri.startsWith(fanweiMobileUrl)) {
				return uri;
			}
			if (!needAuth) {
				return url;
			}

			if (auth?.accessUrl) {
				return auth.accessUrl;
			}

			const parsedUrl = new URLParse(url);
			const params = {
				from: 'appia',
				code: auth?.token,
				userId: user.id,
				username: user.username,
				enterpriseId
			};
			// 后续会更改，不使用长期的token
			if (source === 'chat-gpt') {
				params.code = user.token;
			}

			if (urlType === 1) {
				const { hash } = parsedUrl;

				parsedUrl.set('hash', `${hash}${hash.indexOf('?') < 0 ? '?' : '&'}${qs.stringify(params)}`);

				return parsedUrl.toString();
			}

			const query = qs.parse((parsedUrl.query || '').replace(/^\?/, '')) as Record<string, any>;

			Object.assign(query, params);
			parsedUrl.set('query', qs.stringify(query));

			return parsedUrl.toString();
		},
		[uri, fanweiMobileUrl, needAuth, urlType, url, user.id, user.username]
	);

	const closeApprovalFile = () => {
		setShowApprovalFile(false);
	};

	const checkFileUrl = (res: string) => {
		if (res.includes('shimo-web') && !(res.includes('token') || res.includes('userId'))) {
			res = `${res}&org=${enterpriseId?.toLocaleString()}&source=appia&userId=${user.id}&token=${user.token}`;
		}
		return res;
	};

	const renderContent = () => {
		if (loadError) {
			return (
				<View style={styles.loadError}>
					<Text style={[styles.loadText, { color: themes[theme].titleText }]}>加载失败...</Text>
				</View>
			);
		}

		if (needAuth && !authResult) {
			return <ActivityIndicator />;
		}

		let linkUrl = getUrl(authResult);
		console.info('linkUrl', linkUrl);
		linkUrl = checkFileUrl(linkUrl);

		return (
			<WatermarkView
				foreground
				watermark={user.username}
				itemWidth={Dimensions.get('window').width / 2}
				itemHeight={160}
				rotateZ={-30}
				watermarkTextStyle={{ color: rgba(0, 0, 0, 0.04) }}
				style={[{ zIndex: 1, flexDirection: 'column' }, showApprovalFile ? null : { flex: 1 }]}
			>
				{/* <View > */}
				{loading ? <ActivityIndicator absolute size='large' /> : null}
				{isAndroid && uri.startsWith(fanweiMobileUrl) ? (
					<FanweiOA uri={uri} approved={fanweiApproved} />
				) : (
					<WebView
						ref={e => (temp.current.wv = e)}
						style={{ flex: 0, height: '99%' }}
						containerStyle={{ marginBottom: 1 }}
						key={webviewKey}
						source={{
							uri: linkUrl,
							headers: {
								iosUrlScheme: uri.startsWith(fanweiMobileUrl) ? '1' : '0'
							}
						}}
						startInLoadingState={true}
						showsHorizontalScrollIndicator={false}
						showsVerticalScrollIndicator={false}
						originWhitelist={['http://*', 'https://*', 'wemeet://*']}
						renderLoading={() => <ActivityIndicator />}
						injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
						onNavigationStateChange={navState => {
							// console.log('WebViewUrl:', navState.url);
							temp.current.canGoBack = navState.canGoBack;
							temp.current.url = navState.url;
							setUri(navState.url);
							if (navState.url.startsWith(fanweiMobileUrl) && webviewKey === 0) {
								setWebviewKey(1);
							}
						}}
						// injectedJavaScript={`Meteor.loginWithToken('${token}', function() { })`}
						onMessage={event => {
							onJsCallNative(event.nativeEvent.data);
						}}
						allowsLinkPreview={true}
						onShouldStartLoadWithRequest={request => {
							const { url } = request;

							if (MEETING_REG.test(url)) {
								WebBrowser.openBrowserAsync(url, {
									toolbarColor: themes[theme].headerBackground,
									controlsColor: themes[theme].headerTintColor,
									enableBarCollapsing: true,
									showTitle: true
								});

								return false;
							}

							if (MEETING_SCHEME_REG.test(url)) {
								return false;
							}

							// 泛微流程中自建流程提交后进行拦截
							if (url.includes('static4mobile') && url.includes('#/center/doing')) {
								setLoading(true);
								setTimeout(() => {
									goBack(navigation);
									setLoading(false);
									showToast('提交成功');
								}, 1500);
								setTimeout(() => {
									const ww: WebView = temp.current.wv;
									ww?.injectJavaScript(getInjectableJSMessage({ type: 'refreshApproveList' }));
								}, 2500);
								return false;
							}

							return true;
						}}
					/>
				)}
				{/* </View> */}
			</WatermarkView>
		);
	};

	// 泛微流程批准后，回到主流程列表然后刷新
	const getInjectableJSMessage = (message: any) =>
		`
      (function() {
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify(message)}
        }));
      })();
    `;

	const fanweiApproved = () => {
		setLoading(true);
		setTimeout(() => {
			goBack(navigation);
			setLoading(false);
			showToast('提交成功');
		}, 1500);
		setTimeout(() => {
			const ww: WebView = temp.current.wv;
			ww?.injectJavaScript(getInjectableJSMessage({ type: 'refreshApproveList' }));
		}, 2500);
		return false;
	};

	const renderApprovalFile = () =>
		approvalUrl.length > 0 ? (
			<View style={{ flex: showApprovalFile ? 1 : 0, zIndex: 99, height: showApprovalFile ? '100%' : 0 }}>
				<View
					style={{
						marginTop: approvalFileNavHeight,
						height: 40,
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'row'
					}}
				>
					<Text style={{ color: 'black' }}>{approvalTitle}</Text>
					<Button
						style={{ right: 0, position: 'absolute' }}
						type='secondary'
						title='退出全屏'
						fontSize={12}
						onPress={closeApprovalFile}
					></Button>
				</View>
				<View style={{ backgroundColor: '#dddddd', height: 0.5 }} />
				<WebView
					ignoresViewportScaleLimits={true}
					style={{ width: '100%', height: '100%', opacity: 0.99 }}
					source={{
						uri: approvalUrl
					}}
					domStorageEnabled={true}
					automaticallyAdjustContentInsets={true}
					javaScriptEnabled={true}
					saveFormDataDisabled={true}
					scalesPageToFit={false}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					contentInset={{ top: 0, left: 0, right: 0, bottom: 0 }}
					injectedJavaScript={`
                 const meta = document.createElement('meta');
                 meta.setAttribute('content', 'initial-scale=0,minimum-scale=0, maximum-scale=5.0,user-scalable=yes');
                 meta.setAttribute('name', 'viewport');
                 document.getElementsByTagName('head')[0].appendChild(meta);
      `}
				/>
			</View>
		) : null;

	return (
		<SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
			<StatusBar barStyle={'dark-content'} />
			{renderContent()}
			{renderApprovalFile()}
		</SafeAreaView>
	);
};

export default WebPageView;
