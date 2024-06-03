import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StatusBar, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import I18n from 'i18n-js';
import Touchable from 'react-native-platform-touchable';
import { useDispatch } from 'react-redux';

import SafeAreaView from '../../containers/SafeAreaView';
import { CloudStorageStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import * as HeaderButton from '../../containers/HeaderButton';
import AddDocIcon from '../../containers/Icon/AddDoc';
import FileIcon from '../../containers/FileIcon';
import MoreIcon from '../../containers/Icon/More';
import { debounce, isIOS } from '../../lib/methods';
import { DrawerMenu } from '../../containers/DrawerMenu';
import EditFileIcon from '../../containers/Icon/EditFile';
import ErrorCircleIcon from '../../containers/Icon/ErrorCircle';
import DeleteFileIcon from '../../containers/Icon/DeleteFile';
import { CustomIcon } from '../../containers/CustomIcon';
import styles from './styles';
import Navigation from '../../lib/navigation/appNavigation';
import CloudDocUploadView from '../CloudDocUploadView';
import { showToast } from '../../lib/methods/helpers/showToast';
import DialogInput from '../../containers/DialogInput';
import { Services } from '../../lib/services';
import LockOnIcon from '../../containers/Icon/LockOn';
import { UploadIcon, DrawerItemRightIcon } from './SvgIcon';
import { useAppSelector } from '../../lib/hooks';
import { openCloudFile, OpenFile } from '../../lib/methods/openFile';
import DownloadIcon from '../../containers/Icon/DownloadIcon';
import { CloudDocFileManager } from '../CloudDocUploadView/CloudDocFileManager';
import { FormTextInput } from '../../containers/TextInput';
import { setIsUploadNumShow } from '../../actions/cloudDisk';

export interface ICloudFileBase {
	createdAt: string;
	id: number;
	name: string;
	ownerId: string;
	status: string;
	updateAt: string;
	folderId?: string;
	pwd: string;
	type: string;
	operatorAction?: string; // 文件最近操作(搜索功能使用)
	operatorName?: string; // 文件最近操作者姓名(搜索功能使用)
	operatorTime?: string; // 文件最近操作时间(搜索功能使用)
	size: number;
	sizeStr: string;
	updatedAt: string;
}

export interface ICloudFile extends ICloudFileBase {
	creatorId: string;
	creatorName: string;
	downloadUrl: string;
	extraPermission: string;
	fileId: string;
	format: string;
	progress: number;
	source: string;
	taskId: string;
	views: number;
	fileSize: number;
	fileSizeStr: string;
}

export interface ICloudFolder extends ICloudFileBase {
	folderSize: number;
	pid?: number;
}

export type ICloudFiles = ICloudFile & ICloudFolder;

const CloudStorageView = () => {
	const navigation = useNavigation<StackNavigationProp<CloudStorageStackParamList, 'CloudStorageView'>>();

	const { theme } = useTheme();
	const dispatch = useDispatch();
	const [datas, setDatas] = useState<ICloudFiles[]>();
	const [showModal, setShowModal] = useState(false);
	const [showHeaderMore, setShowHeaderMore] = useState(false);
	const [currentFile, setCurrentFile] = useState<ICloudFiles>();
	const [showRenameModal, setShowRenameModal] = useState(false);
	const [totalPage, setTotalPage] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [isUploadViewShow, setIsUploadViewShow] = useState(false);
	const [onRefreshing, setOnRefreshing] = useState(false);
	const [navStackList, setNavStackList] = useState<any[]>([]);
	const searchRef = useRef(null);
	const [searchText, setSearchText] = useState('');
	const uploadTaskNum = useAppSelector(state => state.cloudDisk.uploadTaskNum);
	const isUploadNumShow = useAppSelector(state => state.cloudDisk.isUploadNumShow);
	const downloadTaskNum = useAppSelector(state => state.cloudDisk.downloadTaskNum);
	const [downloadNum, setDownloadNum] = useState(0);

	useEffect(() => {
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: navStackList.length === 0 ? I18n.t('CloudStorage') : navStackList[navStackList.length - 1].name,
			headerLeft: () => <HeaderButton.BackButton onPress={() => navigation.pop()} />,
			headerRight: () => (
				<View style={{ flexDirection: 'row' }}>
					<Touchable
						onPress={() => {
							dispatch(setIsUploadNumShow(false));
							Navigation.navigate('CloudDocTaskListView');
						}}
						style={{ marginRight: 12, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}
					>
						<View style={{ width: 24, height: 24 }}>
							<UploadIcon />
							{isUploadNumShow ? (
								<View style={styles.uploadNum}>
									<Text style={{ fontSize: 9, fontWeight: '400', color: '#FFF' }}>{uploadTaskNum}</Text>
								</View>
							) : null}
						</View>
					</Touchable>
					<Touchable
						onPress={() => {
							setShowHeaderMore(true);
						}}
						style={{ marginRight: 10, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}
					>
						<MoreIcon width={24} height={24} color='#000000' />
					</Touchable>
				</View>
			)
		});
	}, [navigation, theme, navStackList, isUploadNumShow, uploadTaskNum]);

	useEffect(() => {
		loadData(true);
	}, [currentPage]);

	useEffect(() => {
		loadData(false);
	}, [navStackList, uploadTaskNum]);

	useEffect(() => {
		if (downloadNum > 0 && downloadTaskNum === 0) {
			showToast('下载完成');
		}
		setDownloadNum(downloadTaskNum);
	}, [downloadTaskNum]);

	const onRefresh = () => {
		if (currentPage === 1) {
			loadData(true);
		} else {
			setCurrentPage(1);
		}
	};

	const onEndReached = () => {
		if (totalPage <= currentPage) {
			showToast('已加载全部数据');
			return;
		}
		setCurrentPage(prev => prev + 1);
		setOnRefreshing(false);
	};

	const loadData = async (isRefresh: boolean) => {
		if (isRefresh) {
			setOnRefreshing(true);
		}

		let folderId = '';
		if (navStackList.length > 0) folderId = navStackList[navStackList.length - 1].folderId;
		try {
			const res = await Services.getCloudDiskWithPage(currentPage, 20, folderId);
			console.info('res = ', res);
			const { list, pages } = res.data;
			if (currentPage === 1) {
				setDatas(list);
			} else {
				// @ts-ignore
				setDatas([...datas, ...list]);
			}
			setTotalPage(pages);
			setOnRefreshing(false);
		} catch (error) {
			setOnRefreshing(false);
		}
	};

	const renderSearchBar = () => (
		<FormTextInput
			autoCapitalize='none'
			autoCorrect={false}
			blurOnSubmit
			placeholder={I18n.t('Cloud_Doc_File_Search_PlaceHolder')}
			returnKeyType='search'
			underlineColorAndroid='transparent'
			containerStyle={{ margin: 16, marginBottom: 16 }}
			onChangeText={text => internalOnChangeText(text)}
			onClearInput={() => internalOnChangeText('')}
			iconRight={'search'}
			value={searchText}
			inputRef={searchRef}
		/>
	);

	const internalOnChangeText = useCallback(value => {
		setSearchText(value);
		onSearchChangeText?.(value);
	}, []);

	const onSearchChangeText = debounce(async (text: string) => {
		const title = text.trim();
		if (title === '') {
			loadData(false);
		} else {
			const folderId = navStackList.length > 0 ? navStackList[navStackList.length - 1].folderId : null;
			const res = await Services.searchCloudDisk(title, 1, 30, null, null, null, null, null, folderId);
			console.info('res', res);
			const { list } = res.data;
			setDatas(list);
		}
	}, 1000);

	const closeModal = () => {
		setShowModal(false);
	};

	const deleteFileOrFolder = async () => {
		if (currentFile?.type.match('folder')) {
			const res = await Services.deleteFolders([currentFile?.folderId as string]);
			if (res) {
				setCurrentPage(1);
				loadData(false);
				showToast('删除成功');
			}
		} else {
			console.info('删除文件 = ', currentFile);
			const res = await Services.deleteFiles([currentFile?.fileId as string]);
			if (res) {
				setCurrentPage(1);
				loadData(false);
				showToast('删除成功');
			}
		}
	};

	const drawerItem = (leftIcon: any, title: string, onPress: () => void, underlineHeight = 0.5) => (
		<View style={{ width: '100%', flexDirection: 'column' }}>
			<Touchable onPress={() => onPress()}>
				<View
					style={{
						width: '100%',
						paddingVertical: 16,
						paddingLeft: 12,
						paddingRight: 4,
						alignItems: 'center',
						flexDirection: 'row'
					}}
				>
					{leftIcon}
					<Text style={{ color: '#333', fontSize: 16, fontWeight: '400', flex: 1, marginLeft: 12 }}>{title}</Text>
					<DrawerItemRightIcon width={24} height={24} />
				</View>
			</Touchable>
			<View style={{ width: '100%', height: underlineHeight, backgroundColor: '#F5F5F5' }} />
		</View>
	);

	// const copyUrl = async () => {
	// 	// @ts-ignore
	// 	if (currentFile.downloadUrl === '') {
	// 		closeModal();
	// 		// @ts-ignore
	// 		await Services.requestFileEport(currentFile.fileId).then(res => {
	// 			const { data } = res;
	// 			// @ts-ignore
	// 			const fileManager: CloudDocFileManager = CloudDocFileManager.getInstance();
	// 			fileManager.requestFileEportProgress(data.fileId, data.taskId).then(res => {
	// 				const { data } = res;
	// 				Clipboard.setString(data.downloadUrl);
	// 				showToast(I18n.t('Copied_to_clipboard'));
	// 			});
	// 		});
	// 	} else {
	// 		Clipboard.setString(currentFile.downloadUrl);
	// 		closeModal();
	// 		showToast(I18n.t('Copied_to_clipboard'));
	// 	}
	// };

	const closeMoreDrawer = () => {
		setShowHeaderMore(false);
	};
	const renderMoreDrawer = () => (
		<DrawerMenu
			hideModal={closeMoreDrawer}
			Height={isIOS ? 142 : 122}
			visible={showHeaderMore}
			children={
				<View style={{ width: '100%', height: '100%' }}>
					<Touchable
						style={{ alignItems: 'center', height: 57, justifyContent: 'center' }}
						onPress={() => {
							setShowHeaderMore(false);
							Navigation.navigate('CloudDocRecycleView', {
								callBack: () => {
									setCurrentPage(1);
									loadData(false);
								}
							});
						}}
					>
						<Text style={{ fontSize: 18, color: '#333333' }}>{I18n.t('Cloud_Doc_Recycle')}</Text>
					</Touchable>
					<View style={{ backgroundColor: '#F5F5F5', height: 8, width: '100%' }}></View>
					<Touchable
						style={{ alignItems: 'center', height: 57, justifyContent: 'center' }}
						onPress={() => {
							setShowHeaderMore(false);
						}}
					>
						<Text style={{ fontSize: 18, color: '#333333' }}>{I18n.t('Cancel')}</Text>
					</Touchable>
				</View>
			}
		/>
	);

	const renderDrawer = () =>
		currentFile ? (
			<DrawerMenu
				hideModal={closeModal}
				visible={showModal}
				Height={currentFile.type !== 'folder' ? 440 : 440 - 56 * 3}
				children={
					<View style={{ width: '100%' }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8 }}>
							{renderHeader(currentFile, false)}
							<Touchable
								style={{ marginRight: 10 }}
								onPress={() => {
									closeModal();
								}}
							>
								<CustomIcon size={20} name='close' color='#999999' />
							</Touchable>
						</View>

						{currentFile.type !== 'folder' ? (
							<>
								{drawerItem(
									<DownloadIcon width={24} height={24} />,
									I18n.t('Download'),
									() => {
										closeModal();
										// @ts-ignore
										const fileManager: CloudDocFileManager = CloudDocFileManager.getInstance();
										fileManager.downloadFile(
											currentFile?.fileId,
											currentFile?.name,
											currentFile?.size,
											currentFile?.type,
											currentFile?.format,
											currentFile?.downloadUrl
										);
									},
									0.5
								)}

								{/* {drawerItem(<CopyLinkIcon width={24} height={24} />, I18n.t('CopyLink'), () => {*/}
								{/*	copyUrl();*/}
								{/* })}*/}
								{drawerItem(<LockOnIcon width={24} height={24} />, I18n.t('PermissionManage'), () => {
									closeModal();
									Navigation.navigate('CloudPermissionManageView', { fileId: currentFile.fileId });
								})}
							</>
						) : null}
						{drawerItem(
							<EditFileIcon width={24} height={24} />,
							I18n.t('Rename'),
							() => {
								closeModal();
								// Navigation.navigate('CloudPermissionManageView', { fileId: currentFile.fileId });
								setShowRenameModal(true);
							},
							8
						)}

						{drawerItem(<ErrorCircleIcon width={24} height={24} />, I18n.t('DetailInfo'), () => {
							Navigation.navigate('CloudDocFileDetailView', {
								fileId: currentFile?.fileId,
								folderId: currentFile?.folderId
							});
							closeModal();
						})}

						{drawerItem(
							<DeleteFileIcon width={24} height={24} />,
							I18n.t('delete'),
							() => {
								Alert.alert(
									'确认删除',
									'文件将移至回收站，30天后过期',
									[
										{
											text: I18n.t('Confirm'),
											style: 'destructive',
											onPress: () => {
												closeModal();
												deleteFileOrFolder();
											}
										},
										{
											text: I18n.t('Cancel'),
											style: 'cancel'
										}
									],
									{ cancelable: false }
								);
							},
							0
						)}
					</View>
				}
			></DrawerMenu>
		) : null;
	const renderListItem = ({ item }: { item: ICloudFiles }) => renderHeader(item);

	const openFile = async (item: ICloudFile) => {
		// setSaving(true);
		console.info('item', item);
		if (item.downloadUrl) {
			const attachment = {
				title: item.name.trim(),
				title_link: item.downloadUrl.trim(),
				type: item.format.trim(),
				externalMedia: true
			};
			console.info('attachment=', attachment);
			await OpenFile(attachment);
		} else {
			await openCloudFile({ fileId: item.fileId });
		}
	};

	const updateName = async (text: string) => {
		if (currentFile?.fileId) {
			const res = await Services.updateFileName(currentFile?.fileId as string, text);
			if (res) {
				showToast('修改成功');
				loadData(false);
			}
		} else {
			console.info('res = ', text);
			const res = await Services.updateFolderName(currentFile?.folderId as string, text);

			if (res) {
				showToast('修改成功');
				loadData(false);
			}
		}
	};

	const renderHeader = (item: ICloudFiles, showMore = true) => (
		<View style={{ flexDirection: 'row', height: 64, alignItems: 'center', marginHorizontal: 10, flex: 1 }}>
			<Touchable
				style={{ flexDirection: 'row', flex: 1 }}
				onPress={() => {
					if (item.type.match('folder')) {
						const data = navStackList;
						data.push({ folderId: item.folderId as string, name: item.name });
						setNavStackList([...data]);
						setCurrentPage(1);
						// @ts-ignore
						searchRef.current.clear();
					} else {
						openFile(item);
					}
				}}
			>
				<View style={{ flexDirection: 'row', flex: 1 }}>
					<FileIcon fileName={item.format ? item.format : item.type} fontSize={46} />
					<View style={{ flex: 1, marginLeft: 16 }}>
						<Text style={styles.itemFileName}>{item.name}</Text>
						{item.size === 0 ? (
							<Text style={styles.itemFileInfo}>{`${item.updatedAt}更新`}</Text>
						) : (
							<Text style={styles.itemFileInfo}>{`${item.sizeStr} | ${item.updatedAt}更新`}</Text>
						)}
					</View>
				</View>
			</Touchable>
			{showMore && (
				<Touchable
					onPress={() => {
						setShowModal(true);
						setCurrentFile(item);
					}}
					style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
				>
					<MoreIcon width={20} height={20} />
				</Touchable>
			)}
			{showRenameModal && (
				<DialogInput
					title={'提示'}
					message='请输入名称'
					isDialogVisible={showRenameModal}
					submitText='确定'
					cancelText='取消'
					submitInput={(text: string) => {
						setShowRenameModal(false);
						updateName(text);
					}}
					closeDialog={() => {
						setShowRenameModal(false);
					}}
				/>
			)}
		</View>
	);

	return (
		<SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
			<StatusBar />
			{renderSearchBar()}
			<FlatList
				data={datas}
				renderItem={renderListItem}
				// ListHeaderComponent={renderSearchBar}
				refreshControl={<RefreshControl refreshing={onRefreshing} onRefresh={onRefresh} />}
				onEndReached={onEndReached}
			/>
			<Touchable
				style={styles.floatAddBtn}
				onPress={() => {
					setIsUploadViewShow(true);
				}}
			>
				<AddDocIcon />
			</Touchable>
			{showModal ? renderDrawer() : null}
			{showHeaderMore ? renderMoreDrawer() : null}
			<CloudDocUploadView
				hideModal={() => {
					setIsUploadViewShow(false);
				}}
				visible={isUploadViewShow}
				folderId={navStackList.length > 0 ? navStackList[navStackList.length - 1].folderId : ''}
			/>
		</SafeAreaView>
	);
};

export default CloudStorageView;
