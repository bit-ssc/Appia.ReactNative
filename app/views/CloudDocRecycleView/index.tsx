import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlatList, Text, StyleSheet, View, TouchableOpacity, RefreshControl } from 'react-native';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { DrawerMenu } from '../../containers/DrawerMenu';
import { isIOS } from '../../utils/deviceInfo';
import { showConfirmationAlert } from '../../lib/methods';
import { HeaderRightIcon, RecycleImteIcon } from './SvgIcon';
import { Services } from '../../lib/services';
import { ICloudFile } from '../CloudStorageView';
import FileIcon from '../../containers/FileIcon';
import Navigation from '../../lib/navigation/appNavigation';
import { showToast } from '../../lib/methods/helpers/showToast';
import * as HeaderButton from '../../containers/HeaderButton';

const CloudDocRecycleView = props => {
	// const [setIsFileMoreShow] = useState(false)
	const [isHeaderMoreShow, setIsHeaderMoreShow] = useState(false);
	const [dataList, setDataList] = useState<ICloudFile[]>([]);
	const [isFileMoreShow, setIsFileMoreShow] = useState(false);
	const navigation = useNavigation();
	const [currentFile, setCurrentFile] = useState<ICloudFile>();
	const { callBack } = props.route.params;
	const [currentPage, setCurrentPage] = useState(1);
	const [onRefreshing, setOnRefreshing] = useState(false);
	const [totalPage, setTotalPage] = useState(0);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Cloud_Doc_Recycle'),
			headerTitleAlign: 'center',
			headerRight,
			headerLeft: () => (
				<HeaderButton.BackButton
					onPress={() => {
						navigation.pop();
					}}
				/>
			)
		});
	}, [navigation]);

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		if ((currentPage === 1 && onRefreshing) || currentPage > 1) {
			loadData();
		}
	}, [currentPage, onRefreshing]);

	const loadData = async () => {
		try {
			const res = await Services.getRecycleList(currentPage);
			const { list, pages } = res.data;
			if (currentPage === 1 || onRefreshing) {
				setDataList(list);
			} else {
				setDataList([...dataList, ...list]);
			}
			setTotalPage(pages);
			setOnRefreshing(false);
		} catch (err) {
			setOnRefreshing(false);
		}
	};

	const item = (title: string, onPress: any) => (
		<TouchableOpacity style={styles.bottomItem} onPress={onPress}>
			<Text style={styles.bottomItemText}>{title}</Text>
		</TouchableOpacity>
	);

	const recoverFileOrFolder = async () => {
		if (currentFile?.type.match('folder')) {
			console.info('恢复文件夹 = ', currentFile);
			const res = await Services.recoverFolders([currentFile?.folderId as string]);
			console.info('恢复文件夹成功 = ', res);
			if (res) {
				setCurrentPage(1);
				loadData();
				if (callBack) {
					callBack();
				}
			}
		} else {
			console.info('恢复文件 = ', currentFile);
			const res = await Services.recoverFiles([currentFile?.fileId as string]);
			if (res) {
				console.info('恢复文件夹成功 = ', res);
				setCurrentPage(1);
				loadData();
				if (callBack) {
					callBack();
				}
			}
		}
	};

	const deleteFileOrFolder = async () => {
		if (currentFile?.type.match('folder')) {
			console.info('彻底删除文件夹 = ', currentFile);
			const res = await Services.completeDeleteFolders([currentFile?.folderId as string]);
			console.info('彻底删除文件夹 = ', res);
			if (res) {
				setCurrentPage(1);
				loadData();
			}
		} else {
			console.info('彻底删除文件 = ', currentFile);
			const res = await Services.completeDeleteFiles([currentFile?.fileId as string]);
			console.info('彻底删除文件 = ', res);
			if (res) {
				setCurrentPage(1);
				loadData();
			}
		}
	};

	const deleteAllFilesAndFolders = async () => {
		const fileIds: string[] = [];
		const folderIds: string[] = [];
		for (let i = 0; i < dataList.length; i++) {
			if (dataList[i].type.match('folder')) {
				folderIds.push(dataList[i].folderId as string);
			} else {
				fileIds.push(dataList[i].fileId);
			}
		}
		const res1 = await Services.completeDeleteFolders(folderIds);
		const res2 = await Services.completeDeleteFiles(fileIds);
		if (res1 && res2) {
			setCurrentPage(1);
			loadData();
			showToast('清理成功');
		}
	};

	const fileMore = () => (
		<DrawerMenu
			visible={isFileMoreShow}
			hideModal={() => {
				setIsFileMoreShow(false);
			}}
			menuPosition='bottom'
			Height={isIOS ? 256 : 236}
			children={
				<View style={styles.companies}>
					{item(I18n.t('Cloud_Doc_Bottom_Put_Back'), () => {
						setIsFileMoreShow(false);
						recoverFileOrFolder();
					})}
					<View style={{ width: '100%', height: 1, backgroundColor: '#EEE' }} />
					{item(I18n.t('Cloud_Doc_Bottom_Delete'), () => {
						showConfirmationAlert({
							title: I18n.t('Cloud_Doc_Bottom_Delete'),
							message: I18n.t('Cloud_Doc_Bottom_Delete_Content'),
							confirmationText: I18n.t('Yes_action_it'),
							onPress: () => {
								deleteFileOrFolder();
							}
						});
						setIsFileMoreShow(false);
					})}
					<View style={{ width: '100%', height: 1, backgroundColor: '#EEE' }} />
					{item(I18n.t('Cloud_Doc_Bottom_Details'), () => {
						Navigation.navigate('CloudDocFileDetailView', {
							fileId: currentFile?.fileId,
							folderId: currentFile?.folderId,
							isFromReycleView: true,
							callBack: () => {
								recoverFileOrFolder();
							}
						});
						setIsFileMoreShow(false);
					})}

					<View style={{ height: 8, backgroundColor: '#F5F5F5', width: '100%' }}></View>
					{item(I18n.t('Cloud_Doc_Bottom_Cancel'), () => {
						setIsFileMoreShow(false);
					})}
				</View>
			}
		/>
	);

	const headerMore = () => (
		<DrawerMenu
			visible={isHeaderMoreShow}
			hideModal={() => {
				setIsHeaderMoreShow(false);
			}}
			menuPosition='bottom'
			Height={isIOS ? 142 : 122}
			children={
				<View style={styles.companies}>
					{item(I18n.t('Cloud_Doc_Bottom_Clean'), () => {
						setIsHeaderMoreShow(false);
						showConfirmationAlert({
							message: I18n.t('Cloud_Doc_Bottom_Clean_Content'),
							confirmationText: I18n.t('Yes_action_it'),
							onPress: () => {
								deleteAllFilesAndFolders();
							}
						});
					})}
					<View style={{ height: 8, backgroundColor: '#F5F5F5', width: '100%' }}></View>
					{item(I18n.t('Cloud_Doc_Bottom_Cancel'), () => {
						setIsHeaderMoreShow(false);
					})}
				</View>
			}
		/>
	);

	const headerRight = () => (
		<TouchableOpacity
			onPress={() => {
				setIsHeaderMoreShow(true);
			}}
			style={{ paddingRight: 12 }}
		>
			<HeaderRightIcon />
		</TouchableOpacity>
	);

	const onRefresh = () => {
		setOnRefreshing(true);
		setCurrentPage(1);
	};

	const onEndReached = () => {
		if (!onRefreshing) {
			if (totalPage <= currentPage) {
				showToast('已加载全部数据');
				return;
			}
			setCurrentPage(prev => prev + 1);
			setOnRefreshing(false);
		} else {
			setTimeout(() => {
				onEndReached();
			}, 50);
		}
	};

	const renderItem = (item: ICloudFile) => (
		<View style={styles.containertView}>
			<FileIcon fileName={item.format ? item.format : item.type} fontSize={40} isCloud={item.downloadUrl !== ''} />
			<View style={styles.centerContainerView}>
				<Text style={styles.itemTitle}>{item.name}</Text>
				<Text style={styles.subtitle}>
					{item.sizeStr} | {item.createdAt} {item.creatorName} 删除
				</Text>
			</View>
			<TouchableOpacity
				onPress={() => {
					setCurrentFile(item);
					setIsFileMoreShow(true);
				}}
			>
				<RecycleImteIcon />
			</TouchableOpacity>
		</View>
	);

	return (
		<SafeAreaView testID='cloud-doc-view'>
			<StatusBar />
			<FlatList
				data={dataList}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				renderItem={({ item }) => renderItem(item)}
				ListHeaderComponent={
					<View style={styles.titleView}>
						<Text style={styles.title}>文件仅保留30天</Text>
					</View>
				}
				refreshControl={<RefreshControl refreshing={onRefreshing} onRefresh={onRefresh} />}
				onEndReached={onEndReached}
			/>
			{headerMore()}
			{fileMore()}
		</SafeAreaView>
	);
};

export default CloudDocRecycleView;

const styles = StyleSheet.create({
	title: {
		fontSize: 12,
		fontWeight: '400',
		fontStyle: 'normal',
		color: '#999'
	},
	titleView: {
		alignItems: 'center'
	},
	containertView: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		flexDirection: 'row',
		alignItems: 'center',
		display: 'flex'
	},
	centerContainerView: {
		marginLeft: 12,
		marginRight: 12,
		flexDirection: 'column',
		flex: 1
	},
	itemTitle: {
		fontFamily: 'PingFang SC',
		fontSize: 16,
		fontStyle: 'normal',
		fontWeight: '400',
		color: '#333',
		marginLeft: 0
	},
	subtitle: {
		fontFamily: 'PingFang SC',
		fontSize: 13,
		fontStyle: 'normal',
		fontWeight: '400',
		color: '#999'
	},
	companies: {
		height: 189,
		flexDirection: 'column',
		alignItems: 'flex-start'
	},
	bottomItem: {
		height: 57,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'column'
	},
	bottomItemText: {
		fontSize: 18,
		fontWeight: '400'
	}
});
