import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Touchable from 'react-native-platform-touchable';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import SafeAreaView from '../../containers/SafeAreaView';
import { CustomIcon } from '../../containers/CustomIcon';
import { ChatsStackParamList, WebPageViewStackParamList } from '../../stacks/types';
import { fileDownloadAndPreview } from '../../utils/fileDownload';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { DrawerMenu } from '../../containers/DrawerMenu';
import * as List from '../../containers/List';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import { SubscriptionType, TSubscriptionModel } from '../../definitions';
import getThreadName from '../../lib/methods/getThreadName';
import database from '../../lib/database';
import getRoomInfo from '../../lib/methods/getRoomInfo';
import { showToast } from '../../lib/methods/helpers/showToast';
import Navigation from '../../lib/navigation/appNavigation';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { Services } from '../../lib/services';
import { setMessageMultiSelect } from '../../actions/app';
import { openCloudFile } from '../../lib/methods/openFile';
import { maxWidth } from '../../containers/RoomHeader/RoomHeader';
import sharedStyles from '../Styles';

const CloudDocumentView = (props: any) => {
	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'WebPageView'>>();

	const { route } = props;
	const { url, downloadUrl, title, messageId, titleLink } = route.params;
	const { theme } = useTheme();
	const wv: any = null;
	const temp = useRef({ wv, url, canGoBack: false });
	const [showModal, setShowModal] = useState(false);
	const [rid, setRid] = useState('');
	const [tmid, setTmid] = useState('');
	const [room, setRoom] = useState<TSubscriptionModel>();
	const dispatch = useDispatch();

	const [loading, setLoading] = useState(false);

	const backCloseUrls = useMemo(() => ['/approve/list', '/error', '/404', '/500', '/403'], []);

	useEffect(() => {
		getRoomInfos();
	}, []);

	const getRoomInfos = async () => {
		try {
			const db = database.active;
			const msgCollection = db.get('messages');
			const msgRecord = await msgCollection.find(messageId);
			setRid(msgRecord.rid);
			setTmid(msgRecord.tmid || '');
			const room = ((await getRoomInfo(msgRecord.rid || msgRecord._raw.id)) as TSubscriptionModel) || undefined;
			setRoom(room);
		} catch (e) {
			showToast('获取房间信息失败');
			console.info('获取房间信息失败', e);
		}
	};

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
				<Touchable
					onPress={() => {
						setShowModal(true);
					}}
					style={{ marginRight: 12 }}
				>
					<CustomIcon name='meatballs' size={24} color={themes[theme].headerTintColor} />
				</Touchable>
			)
		});
	}, [goBack, navigation, theme, title]);

	const hideModal = () => {
		setShowModal(false);
	};

	const openInCloudPage = async () => {
		// 1.创建同样的云文档
		// 2.打开云文档

		try {
			hideModal();
			const res = await Services.openInCloud(titleLink, title);
			showToast('已转换为云文档');
			// @ts-ignore
			openCloudFile(res.data);
		} catch (e) {
			console.info('转换云文档失败', e);
			showToast('转换云文档失败');
		}
	};

	const download = () => {
		setLoading(true);
		hideModal();
		fileDownloadAndPreview(downloadUrl, { title }).finally(() => {
			setLoading(false);
		});
	};

	const forward = () => {
		hideModal();
		Navigation.navigate('SelectedUsersView', {
			msgIds: [messageId],
			title: I18n.t('Forward_to'),
			buttonText: I18n.t('Confirm'),
			hasRooms: true,
			maxUsers: 10,
			nextAction: async (navigation: any, list: ISelectedUser[]) => {
				await Services.forwardMessage({
					// @ts-ignore
					forwardUsers: list.filter(a => a?.isUser || !a.rid).map(a => a._id),
					forwardRooms: list.filter(a => !a?.isUser && !!a.rid).map(a => a.rid as string),
					forwardMessageIds: [messageId],
					isForwardMessage: true,
					isForwardMerged: false
				});
				navigation?.pop();
				dispatch(setMessageMultiSelect(false));
			}
		});
	};
	const jumpToSession = async () => {
		hideModal();
		if (!messageId) {
			showToast('会话中不存在该消息');
			return;
		}
		let params: {
			rid: string;
			jumpToMessageId: string;
			t: SubscriptionType;
			room: TSubscriptionModel | undefined;
			tmid?: string;
			name?: string;
		} = {
			rid,
			jumpToMessageId: messageId,
			t: (room?.t || 'c') as SubscriptionType,
			room: room as TSubscriptionModel
		};
		if (tmid) {
			navigation.pop();
			params = {
				...params,
				tmid,
				name: await getThreadName(rid, tmid as string, messageId),
				t: SubscriptionType.THREAD
			};
			navigation.push('RoomView', params);
		} else {
			navigation.navigate('RoomView', params);
		}
	};

	const renderDrawer = () => (
		<DrawerMenu
			hideModal={hideModal}
			visible={showModal}
			Height={messageId ? 300 : 240}
			children={
				<List.Container>
					<Button
						title={I18n.t('Open_In_Cloud_Doc')}
						onPress={openInCloudPage}
						style={[{ backgroundColor: '#fff', marginTop: 10 }]}
						styleText={[{ color: '#000', fontSize: 18 }]}
					/>
					<List.Separator />
					<Button
						title={I18n.t('Download')}
						onPress={download}
						style={[{ backgroundColor: '#fff' }]}
						styleText={[{ color: '#000', fontSize: 18 }]}
					/>
					<List.Separator />
					<Button
						title={I18n.t('Forward')}
						onPress={forward}
						style={[{ backgroundColor: '#fff' }]}
						styleText={[{ color: '#000', fontSize: 18 }]}
					/>
					{messageId ? (
						<>
							<List.Separator />
							<Button
								title={I18n.t('Jump_To_Session')}
								onPress={jumpToSession}
								style={[{ backgroundColor: '#fff' }]}
								styleText={[{ color: '#000', fontSize: 18 }]}
							/>
						</>
					) : null}
					<List.Separator style={{ height: 5 }} />
					<Button
						title={I18n.t('Cancel')}
						onPress={hideModal}
						style={[{ backgroundColor: '#fff' }]}
						styleText={[{ color: '#000', fontSize: 18 }]}
					/>
				</List.Container>
			}
		/>
	);

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
                 meta.setAttribute('content', 'initial-scale=0,minimum-scale=0, maximum-scale=5.0,user-scalable=yes');
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
			{renderDrawer()}
		</SafeAreaView>
	);
};

export default CloudDocumentView;
