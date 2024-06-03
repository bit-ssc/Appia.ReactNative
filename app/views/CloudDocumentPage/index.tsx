import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Touchable from 'react-native-platform-touchable';
import { StackNavigationProp } from '@react-navigation/stack';

import { ChatsStackParamList, WebPageViewStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { CustomIcon } from '../../containers/CustomIcon';
import SafeAreaView from '../../containers/SafeAreaView';
import { IFileInfo } from '../../definitions/ICloudDisk';
import { Services } from '../../lib/services';

const CloudDocumentPage = (props: any) => {
	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'WebPageView'>>();

	const { route } = props;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { url, title, cloudFile } = route.params;
	const { colors } = useTheme();
	const wv: any = null;
	const temp = useRef({ wv, url, canGoBack: false });
	const [fileInfo, setFileInfo] = useState<IFileInfo>({});
	const [unEffect, setUnEffect] = useState(false);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [loading, setLoading] = useState(false);
	const [action, setAction] = useState(false);

	const backCloseUrls = useMemo(() => ['/approve/list', '/error', '/404', '/500', '/403'], []);

	useEffect(() => {
		(async () => {
			const res = await Services.getCloudDocInfo(cloudFile.fileId);
			setFileInfo(res.data);
			// 1, 2 文档被删除，表示文档无效; 0 正常文档
			setUnEffect(res.data.status !== '0');
		})();
	}, [cloudFile.fileId]);

	const onPress = () => {
		navigation.navigate('CloudDocActionsView', { cloudFile: fileInfo });
	};

	useEffect(() => {
		(async () => {
			const res = await Services.getCloudDocPermission(cloudFile.fileId);
			// 0没权限，1查看，2评论，3编辑，4管理
			if (res.data.type === 0) {
				setAction(false);
			} else {
				setAction(true);
			}
		})();
	}, []);

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

	useEffect(() => {
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: fileInfo.name || title,
			headerRight: () =>
				unEffect || !action ? null : (
					<Touchable onPress={onPress} style={{ marginRight: 12 }}>
						<CustomIcon name='meatballs' size={24} color={colors.headerTintColor} />
					</Touchable>
				)
		});
	}, [goBack, navigation, colors, title, fileInfo, unEffect]);

	const H5Event = (action: string) => {
		const data = JSON.parse(action);
		if (data.eventType === 'goback') {
			setTimeout(() => navigation.pop(), 500);
		}
	};

	const renderContent = () => (
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
				showsVerticalScrollIndicator={false}
				showsHorizontalScrollIndicator={false}
				javaScriptEnabled={true}
				saveFormDataDisabled={true}
				scalesPageToFit={false}
				contentInset={{ top: 0, left: 0, right: 0, bottom: 0 }}
				injectedJavaScript={`
                 const meta = document.createElement('meta');
                 meta.setAttribute('content', 'initial-scale=1.0,minimum-scale=1.0, maximum-scale=5.0,user-scalable=yes');
                 meta.setAttribute('name', 'viewport');
                 document.getElementsByTagName('head')[0].appendChild(meta);
      `}
				onMessage={event => H5Event(event.nativeEvent.data)}
			/>
		</>
	);

	return (
		<SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
			<StatusBar barStyle={'dark-content'} />
			{renderContent()}
		</SafeAreaView>
	);
};

export default CloudDocumentPage;
