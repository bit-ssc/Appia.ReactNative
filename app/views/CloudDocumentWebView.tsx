import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Touchable from 'react-native-platform-touchable';
import { StackNavigationProp } from '@react-navigation/stack';

import SafeAreaView from '../containers/SafeAreaView';
import { CustomIcon } from '../containers/CustomIcon';
import { WebPageViewStackParamList } from '../stacks/types';
import { fileDownload, fileDownloadAndPreview } from '../utils/fileDownload';
import ActivityIndicator from '../containers/ActivityIndicator';
import { useTheme } from '../theme';
import { themes } from '../lib/constants';
import { isAndroid } from '../utils/deviceInfo';
import { showToast } from '../lib/methods/helpers/showToast';
import { maxWidth } from '../containers/RoomHeader/RoomHeader';
import sharedStyles from './Styles';

const CloudDocumentWebView = (props: any) => {
	const navigation = useNavigation<StackNavigationProp<WebPageViewStackParamList, 'WebPageView'>>();

	const { route } = props;
	const { url, downloadUrl, title } = route.params;
	const { theme } = useTheme();
	const wv: any = null;
	const temp = useRef({ wv, url, canGoBack: false });

	const [loading, setLoading] = useState(false);

	const backCloseUrls = useMemo(() => ['/approve/list', '/error', '/404', '/500', '/403'], []);

	const goBack = useCallback(
		(navigation: StackNavigationProp<WebPageViewStackParamList, 'WebPageView'>) => {
			if (backCloseUrls.some(path => temp.current.url.indexOf(path) > 0)) {
				navigation?.pop();
			} else if (temp.current.canGoBack) {
				temp.current.wv?.goBack();
			} else {
				navigation?.pop();
			}
		},
		[backCloseUrls]
	);

	const loadFile = () => {
		setLoading(true);
		try {
			if (isAndroid) {
				showToast('开始下载');
				fileDownload(downloadUrl, { title }).finally(() => {
					showToast('下载完成');
					setLoading(false);
				});
			} else {
				fileDownloadAndPreview(downloadUrl, { title }).finally(() => {
					setLoading(false);
				});
			}
		} catch (e) {
			showToast('下载文件失败');
			console.info('下载文件失败', e);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		navigation.setOptions({
			headerTitleAlign: 'center',
			headerTitle: () => (
				<Text
					numberOfLines={1}
					style={{
						maxWidth,
						flexShrink: 1,
						fontSize: 16,
						color: '#0C0D0F',
						...sharedStyles.textSemibold
					}}
				>
					{title || 'Appia'}
				</Text>
			),
			headerRight: () => (
				<Touchable onPress={loadFile} style={{ marginRight: 12 }}>
					<CustomIcon name='download' size={24} color={themes[theme].headerTintColor} />
				</Touchable>
			)
		});
	}, [goBack, navigation, theme, title]);

	const renderContent = () => {
		console.info(url);

		return (
			<>
				{loading ? <ActivityIndicator absolute size='large' /> : null}
				<WebView
					ignoresViewportScaleLimits={true}
					style={{ flex: 1, height: '100%', width: '100%' }}
					containerStyle={{ marginBottom: 1 }}
					source={{
						uri: url
					}}
					automaticallyAdjustContentInsets={true}
					startInLoadingState={true}
					javaScriptEnabled={true}
					saveFormDataDisabled={true}
					scalesPageToFit={false}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					contentInset={{ top: 0, left: 0, right: 0, bottom: 0 }}
					injectedJavaScript={`
                 const meta = document.createElement('meta');
                 meta.setAttribute('content', 'initial-scale=1.0,minimum-scale=1.0, maximum-scale=5.0,user-scalable=yes');
                 meta.setAttribute('name', 'viewport');
                 document.getElementsByTagName('head')[0].appendChild(meta);
      `}
				/>
			</>
		);
	};

	return (
		<SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
			<StatusBar barStyle={'dark-content'} />
			{renderContent()}
		</SafeAreaView>
	);
};

export default CloudDocumentWebView;
