import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Modal, ScrollView, Text, View, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Progress from 'react-native-progress';
import { rgba } from 'color2k';
import moment from 'moment';
import { useDispatch } from 'react-redux';

import styles from './styles';
import FileIcon from '../../containers/FileIcon';
import { ChatsStackParamList } from '../../stacks/types';
import { showToast } from '../../lib/methods/helpers/showToast';
import { Services } from '../../lib/services';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import EmptyFolderIcon from '../../containers/Icon/EmptyFolder';
import Avatar from '../../containers/Avatar';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks';
import database from '../../lib/database';
import { formatMemorySize } from '../../containers/message/Reply';
import { IFileInfo } from '../../definitions/ICloudDisk';
import { setPageNumber } from '../../actions/cloudDisk';
import * as HeaderButton from '../../containers/HeaderButton';
import DialogInput from '../../containers/DialogInput';
import { useTheme } from '../../theme';
import * as List from '../../containers/List';

export enum TYPE {
	COPY = 'COPY',
	CONVERSATION = 'CONVERSATION'
}

interface IProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'CloudDiskView'>;
	route: RouteProp<ChatsStackParamList, 'CloudDiskView'>;
}

interface IRoomInfo {
	type: string;
	name?: string;
	fname?: string;
}

const CloudDiskView = ({ navigation, route }: IProps): React.ReactElement => {
	const { colors } = useTheme();
	const [fileInfoList, setFileInfolist] = useState([]);
	const [folderInfoList, setFolderInfolist] = useState([]);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(true);
	const { setOptions } = useNavigation();
	const { title, folderId = 'fo_0', type, copyIds } = route.params;
	const [showModal, setShowModal] = useState(false);
	const [showDialog, setShowDialog] = useState(false);
	const { subscribedRoom } = useAppSelector(state => state.room);
	const [roomInfo, setRoomInfo] = useState<IRoomInfo>({ name: '', type: '', fname: '' });
	// const [sendList, setSendList] = useState(new Set)
	const [item, setItem] = useState<IFileInfo>();
	const [refreshing, setRefreshing] = useState(false);
	const { pageNumber } = useAppSelector(state => state.cloudDisk);
	const dispatch = useDispatch();

	useEffect(() => {
		type === TYPE.CONVERSATION
			? (async () => {
					try {
						const db = database.active;
						const collection = db.get('subscriptions');
						const record = await collection.find(subscribedRoom);
						setRoomInfo({ name: record.name, type: record.t, fname: record.fname });
					} catch (e) {
						console.info('查询房间信息失败', e);
						showToast('获取房间信息失败');
					}
			  })()
			: null;
	}, [subscribedRoom]);

	const load = async () => {
		try {
			setLoading(true);
			const res = await Services.getCloudDisk(folderId, '');
			const { fileInfoList = [], folderInfoList = [] } = res.data;
			setFileInfolist(fileInfoList);
			setFolderInfolist(folderInfoList);
			setSuccess(true);
		} catch (e) {
			showToast('云盘文件获取失败');
			console.info('云盘文件获取失败', e);
			setLoading(false);
			setSuccess(false);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		(async () => {
			await load();
		})();
	}, []);

	useLayoutEffect(() => {
		setOptions({
			title: title || '我的空间',
			headerTitleAlign: 'center',
			headerLeft: () => (
				<HeaderButton.BackButton
					onPress={() => {
						dispatch(setPageNumber(pageNumber - 1));
						navigation.pop();
					}}
				/>
			)
		});
	});

	const onPress = (item: any) => {
		if ('pid' in item) {
			navigation.push('CloudDiskView', { title: item.name, folderId: item.folderId, type, copyIds });
			dispatch(setPageNumber(pageNumber + 1));
		} else {
			setItem(item);
			setShowModal(true);
		}
	};

	const renderItem = (item: any) => {
		if (!item) return null;
		const isFolder = 'pid' in item;
		return (
			<TouchableOpacity
				style={styles.itemContainer}
				disabled={type === TYPE.COPY && !('pid' in item)}
				onPress={() => {
					onPress(item);
				}}
			>
				<FileIcon fileName={isFolder ? 'folder' : item.format || item?.type} fontSize={46} />
				<View style={styles.contentContainer}>
					<Text style={styles.title} numberOfLines={1}>
						{item.name}
					</Text>
					<Text style={styles.info} numberOfLines={1}>{`${formatMemorySize(item.fileSize)} | ${moment(item.createdAt).format(
						'YYYY-MM-DD HH:mm:ss'
					)} ${item.pid ? '创建' : '更新'}`}</Text>
				</View>
				{isFolder ? <List.Icon name='chevron-right' style={styles.actionIndicator} /> : null}
			</TouchableOpacity>
		);
	};

	const renderEmpty = () => (
		<View style={styles.loadingContainer}>
			<EmptyFolderIcon />
			<View style={styles.failContent}>
				<Text style={[styles.failText, { color: rgba(0, 0, 0, 0.3) }]}>暂无文件</Text>
			</View>
		</View>
	);

	const renderFile = () => (
		<ScrollView
			style={styles.container}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.auxiliaryText} />}
		>
			{folderInfoList.map(folder => renderItem(folder))}
			{fileInfoList.map(file => renderItem(file))}
		</ScrollView>
	);

	const renderContent = () => {
		if ((fileInfoList === null || fileInfoList.length === 0) && (folderInfoList === null || folderInfoList.length === 0)) {
			return renderEmpty();
		}
		return renderFile();
	};

	const renderLoading = () => (
		<View style={styles.loadingContainer}>
			<Progress.CircleSnail size={100} />
		</View>
	);

	const sendFiles = () => {
		try {
			navigation.pop(pageNumber);
			Services.sendCloudFiles([item?.fileId || ''], subscribedRoom);
		} catch (e) {
			console.info('发送云文档失败', e);
			showToast('发送云文档失败');
		}
	};

	const renderModal = () => (
		<Modal animationType={'slide'} transparent={true}>
			<View style={styles.modalView}>
				<View style={styles.modalContent}>
					<View style={styles.contentTop}>
						<View>
							<Text style={[{ fontSize: 18, color: '#000' }]}>发送至：</Text>
							<View style={styles.contentTitle}>
								<Avatar text={roomInfo.name || roomInfo.fname} size={36} type={roomInfo.type} rid={subscribedRoom} />
								<Text style={[{ fontSize: 16, marginStart: 10, color: '#000' }]}>{roomInfo.fname || roomInfo.name}</Text>
							</View>
						</View>
					</View>
					<View style={styles.contentBottom}>
						<Button
							onPress={() => setShowModal(false)}
							title={I18n.t('Cancel')}
							type={''}
							style={styles.button}
							color={'#1B5BFF'}
						/>
						<Button onPress={sendFiles} title={I18n.t('Confirm')} type={''} style={styles.button} color={'#1B5BFF'} />
					</View>
				</View>
			</View>
		</Modal>
	);

	const renderFail = () => (
		<View style={styles.loadingContainer}>
			<Image source={require('../../static/images/cloud_disk_fail.png')} style={[{ width: 200, height: 200 }]} />
			<View style={styles.failContent}>
				<Text style={[styles.failText, { color: rgba(0, 0, 0, 0.3) }]}>加载失败，</Text>
				<TouchableOpacity onPress={load}>
					<Text style={[styles.failText, { color: rgba(69, 128, 255, 0.8) }]}>点击重试</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	const createFolder = () => setShowDialog(true);

	const moveHere = async () => {
		try {
			console.info('moveHere', copyIds, folderId);
			await Services.copyDocToFolder(copyIds, [], '', folderId);
			showToast('复制成功');
			await load();
			navigation.pop();
		} catch (e) {
			console.info('创建副本失败', e);
			showToast('创建副本失败');
		}
	};

	const renderFooter = () => (
		<View style={styles.buttonContainer}>
			<Button
				title={I18n.t('Create_New_Folder')}
				onPress={createFolder}
				style={[styles.button, { borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' }]}
				backgroundColor={'#fff'}
				color={'#000'}
			/>
			<Button title={I18n.t('Copy_Here')} onPress={moveHere} style={[styles.button, { borderRadius: 8, marginStart: 16 }]} />
		</View>
	);

	const renderResult = () => (success ? renderContent() : renderFail());

	const closeDialog = () => setShowDialog(false);

	const submit = async (text: string) => {
		try {
			if (!text) {
				showToast('请输入文件夹名称');
				return;
			}
			await Services.createFolder(text, folderId);
			setShowDialog(false);
			load();
		} catch (e) {
			console.info('创建文件夹失败', e);
			showToast('创建文件夹失败');
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await load();
		setRefreshing(false);
	};

	return (
		<SafeAreaView testID='add-channel-team-view' style={[{ backgroundColor: '#fff' }]}>
			<StatusBar />
			{loading ? renderLoading() : renderResult()}
			{showModal ? renderModal() : null}
			<DialogInput
				isDialogVisible={showDialog}
				submitInput={(text: string) => submit(text)}
				closeDialog={closeDialog}
				title={I18n.t('Create_New_Folder')}
				hintInput={I18n.t('Create_Folder_Hint')}
				placeholderTextColor={'#CCCCCC'}
				cancelText={I18n.t('Cancel')}
				submitText={I18n.t('Confirm')}
			/>
			{type === TYPE.COPY && !loading ? renderFooter() : null}
		</SafeAreaView>
	);
};
export default CloudDiskView;
