import React, { useEffect, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dimensions, Text, View } from 'react-native';

import { ChatsStackParamList } from '../../stacks/types';
import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import styles from './styles';
import Touch from '../../utils/touch';
import { useTheme } from '../../theme';
import { events, logEvent } from '../../utils/log';
import FileIcon from '../../containers/FileIcon';
import { themes } from '../../lib/constants';
import { MarkdownPreview } from '../../containers/markdown';
import Avatar from '../../containers/Avatar';
// import Add from '../../containers/Icon/Add';
import { TYPE } from '../CloudDiskView';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { Services } from '../../lib/services';
import { showToast } from '../../lib/methods/helpers/showToast';
import { ICollaborators } from '../../definitions/ICloudDisk';

interface IOnPressTouch {
	<T extends keyof ChatsStackParamList>(item: { route?: T; params?: ChatsStackParamList[T]; event?: Function }): void;
}

const avatarSize = (Dimensions.get('window').width - 6 * 16 - 5 * 16) / 6;

interface IProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'CloudDocActionsView'>;
	route: RouteProp<ChatsStackParamList, 'CloudDocActionsView'>;
}

const CloudDocActionsView = ({ navigation, route }: IProps): React.ReactElement => {
	const { cloudFile } = route.params;
	const { theme } = useTheme();
	const [collaborators, setCollaborators] = useState<ICollaborators[]>([]);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Actions'),
			headerTitleAlign: 'center'
		});
	}, []);

	useEffect(() => {
		(async () => {
			try {
				const res = await Services.getCollaborator(cloudFile.fileId || '');
				setCollaborators(res.data);
			} catch (e) {
				console.info('获取协作成员信息失败', e);
				showToast('获取协作成员信息失败');
			}
		})();
	}, [cloudFile.fileId]);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const onPressTouchable: IOnPressTouch = (item: {
		route?: keyof ChatsStackParamList;
		params?: ChatsStackParamList[keyof ChatsStackParamList];
		event?: Function;
	}) => {
		const { route, event, params } = item;
		if (route) {
			// @ts-ignore
			logEvent(events[`RA_GO_${route.replace('View', '').toUpperCase()}${params.name ? params.name.toUpperCase() : ''}`]);
			navigation.navigate(route, params);
		}
		if (event) {
			return event();
		}
	};

	const renderDocInfo = () => (
		<List.Section style={[styles.fileInfoContainer, { marginTop: 16 }]}>
			<Touch
				style={[{ paddingVertical: 16 }]}
				theme={theme}
				onPress={() => {
					onPressTouchable({
						route: 'CloudDocFileDetailView',
						params: {
							fileId: cloudFile.fileId
						}
					});
				}}
				enabled={true}
			>
				<View style={styles.fileInfoView}>
					<FileIcon fileName={'doc'} fontSize={46} />
					<View style={styles.fileNameContainer}>
						<Text style={[styles.fileName, { color: themes[theme].titleText }]} numberOfLines={1}>
							{cloudFile.name}
						</Text>

						<MarkdownPreview
							msg={`创建人: ${cloudFile.creatorName}`}
							style={[styles.fileDescription, { color: themes[theme].auxiliaryText }]}
						/>
					</View>
					<List.Icon name='chevron-right' style={styles.actionIndicator} />
				</View>
			</Touch>

			<>
				<View style={styles.membersTitle}>
					<Text style={styles.text}>协作成员</Text>
					<Text style={styles.membersCount}> {`${collaborators.length}/人`}</Text>
					{/* <List.Icon name='chevron-right' style={styles.actionIndicator} />*/}
				</View>
				<View style={styles.avatarContainer}>
					{collaborators?.map(item => (
						<Avatar text={item.userId || item.name} size={avatarSize} style={styles.avatar} />
					))}
					{/* <TouchableOpacity style={[{ width: avatarSize, height: avatarSize }, styles.avatar]} onPress={() => {}}>*/}
					{/*	<Add color={'#ccc'}/>*/}
					{/* </TouchableOpacity>*/}
				</View>
			</>
		</List.Section>
	);

	// const onPressSetting = () => navigation.navigate('CloudDocSettingView', {});

	const shareCloudDoc = () => {
		navigation.navigate('SelectedUsersView', {
			title: I18n.t('Choose_Contacts'),
			buttonText: I18n.t('Confirm'),
			maxUsers: 10,
			nextAction: async (navigation: any, list: ISelectedUser[]) => {
				for (const item of list) {
					// eslint-disable-next-line no-await-in-loop
					await Services.sendCloudFiles([cloudFile.fileId || ''], item.rid, item.name);
				}
				navigation?.pop();
			}
		});
	};

	const renderShare = () => (
		<List.Container style={styles.fileInfoContainer}>
			<Touch theme={theme} onPress={shareCloudDoc} style={styles.touch}>
				<Text style={styles.text}>分享</Text>
				<List.Icon name='chevron-right' style={styles.actionIndicator} />
			</Touch>
			{/* <List.Separator />*/}
			{/* <Touch theme={theme} onPress={onPressSetting} style={styles.touch}>*/}
			{/*	<Text style={styles.text}>安全设置</Text>*/}
			{/*	<List.Icon name='chevron-right' style={styles.actionIndicator} />*/}
			{/* </Touch>*/}
		</List.Container>
	);

	const renderActions = () => (
		<List.Container style={styles.fileInfoContainer}>
			{/* <Touch theme={theme} onPress={() => {}} style={styles.touch}>*/}
			{/*	<Text style={styles.text}>查找替换</Text>*/}
			{/*	<List.Icon name='chevron-right' style={styles.actionIndicator} />*/}
			{/* </Touch>*/}
			{/* <List.Separator />*/}
			<Touch
				theme={theme}
				onPress={() => {
					onPressTouchable({
						route: 'CloudDiskView',
						params: {
							type: TYPE.COPY,
							copyIds: [cloudFile.fileId || '']
						}
					});
				}}
				style={styles.touch}
			>
				<Text style={styles.text}>创建副本</Text>
				<List.Icon name='chevron-right' style={styles.actionIndicator} />
			</Touch>
			{/* <List.Separator />*/}
			{/* <Touch theme={theme} onPress={() => {}} style={styles.touch}>*/}
			{/*	<Text style={styles.text}>查看历史</Text>*/}
			{/*	<List.Icon name='chevron-right' style={styles.actionIndicator} />*/}
			{/* </Touch>*/}
		</List.Container>
	);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const renderSave = () => (
		<List.Container style={styles.fileInfoContainer}>
			<Touch theme={theme} onPress={() => {}} style={styles.touch}>
				<Text style={styles.text}>保存模版</Text>
			</Touch>
			<List.Separator />
			<Touch theme={theme} onPress={() => {}} style={styles.touch}>
				<Text style={styles.text}>保存版本</Text>
			</Touch>
		</List.Container>
	);

	const deleteCloudDoc = async () => {
		try {
			await Services.deleteCloudDOC([cloudFile.fileId || '']);
			navigation.pop(2);
		} catch (e) {
			console.info('删除文件失败', e);
			showToast('删除文件失败');
		}
	};

	const renderDelete = () => (
		<List.Container style={styles.fileInfoContainer}>
			<Touch theme={theme} onPress={deleteCloudDoc} style={styles.touch}>
				<Text style={[styles.text, { color: '#FF3141', textAlign: 'center' }]}>{I18n.t('Delete_Cloud_Doc')}</Text>
			</Touch>
		</List.Container>
	);

	return (
		<SafeAreaView style={{ backgroundColor: '#F2F2F2' }}>
			<StatusBar />
			<List.Container>
				{renderDocInfo()}
				{renderShare()}
				{renderActions()}
				{/* {renderSave()}*/}
				{renderDelete()}
			</List.Container>
		</SafeAreaView>
	);
};

export default CloudDocActionsView;
