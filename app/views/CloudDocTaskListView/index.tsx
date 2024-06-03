import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import I18n from '../../i18n';
import { PauseIcon } from './SvgIcon';
import { CloudDocFileItem, CloudDocFileManager } from '../CloudDocUploadView/CloudDocFileManager';
import { showConfirmationAlert } from '../../lib/methods';
import RenderItem from './RenderItem';
import * as HeaderButton from '../../containers/HeaderButton';

const CloudDocTaskListView = () => {
	// @ts-ignore
	const fileManager: CloudDocFileManager = CloudDocFileManager.getInstance();
	let rightList = fileManager.getDownloadTask();
	let leftList = fileManager.getUploadTask();

	console.info(leftList);
	console.info(rightList);

	const navigation = useNavigation();
	const [isLeftSelected, setIsLeftSelected] = useState(true);
	const [dataList, setDataList] = useState(leftList);
	const [taskNum, setTaskNum] = useState(0);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Cloud_Doc_File_Transmit'),
			headerTitleAlign: 'center',
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
		updateAllState(true);
	}, []);

	const updateAllState = (isLeft: boolean) => {
		if (isLeft) {
			setDataList([...leftList]);
			let num = 0;
			for (let i = 0; i < leftList.length; i++) {
				if (leftList[i].isPause || leftList[i].isFailed) continue;
				num += 1;
			}
			setTaskNum(num);
		} else {
			setDataList([...rightList]);
			let num = 0;
			for (let i = 0; i < rightList.length; i++) {
				if (rightList[i].isPause || rightList[i].isFailed) continue;
				num += 1;
			}
			setTaskNum(num);
		}
	};

	const leftBarOnpress = () => {
		setIsLeftSelected(true);
		updateAllState(true);
	};

	const rightBarOnpress = () => {
		setIsLeftSelected(false);
		updateAllState(false);
	};

	const topBar = () => (
		<View style={styles.topBarContainer}>
			<TouchableOpacity style={styles.topBarItem} onPress={() => leftBarOnpress()}>
				<Text style={isLeftSelected ? styles.topBarItemTextHighLight : styles.topBarItemTextDefualt}>
					{I18n.t('Cloud_Doc_File_Transmit_Upload_List')}
				</Text>
				<View style={isLeftSelected ? styles.topBarUnderline : {}} />
			</TouchableOpacity>
			<TouchableOpacity style={styles.topBarItem} onPress={() => rightBarOnpress()}>
				<Text style={!isLeftSelected ? styles.topBarItemTextHighLight : styles.topBarItemTextDefualt}>
					{I18n.t('Cloud_Doc_File_Transmit_Download_List')}
				</Text>
				<View style={!isLeftSelected ? styles.topBarUnderline : {}} />
			</TouchableOpacity>
		</View>
	);

	const replayOnpress = (item: CloudDocFileItem) => {
		if (item.isFailed) {
			item.isFailed = false;
			item.isPause = false;
		} else {
			item.isFailed = false;
			item.isPause = false;
		}
		if (isLeftSelected) {
			fileManager.resumeUploadTask(item);
		} else {
			fileManager.resumeDownloadTask(item);
		}
		updateAllState(isLeftSelected);
		if (isLeftSelected) {
			setDataList([...leftList]);
		} else {
			setDataList([...rightList]);
		}
	};

	const closeOnpress = (item: CloudDocFileItem) => {
		console.info('删除');
		showConfirmationAlert({
			message: I18n.t('Cloud_Doc_File_Transmit_Delete_Title'),
			confirmationText: I18n.t('Yes_action_it'),
			onPress: () => {
				if (isLeftSelected) {
					fileManager.closeUploadTask(item);
					updateAllState(isLeftSelected);
					setDataList([...leftList]);
				} else {
					fileManager.closeDownloadTask(item);
					updateAllState(isLeftSelected);
					setDataList([...rightList]);
				}
			}
		});
	};

	const pauseOnPress = (item: CloudDocFileItem) => {
		console.info('暂停');
		if (item.isUpload) {
			fileManager.pauseUploadTask(item);
		} else {
			fileManager.pauseDownloadTask(item);
		}
		item.isPause = true;
		updateAllState(isLeftSelected);
		if (isLeftSelected) {
			setDataList([...leftList]);
		} else {
			setDataList([...rightList]);
		}
	};

	const taskSuccess = () => {
		if (isLeftSelected) {
			console.info('任务剩余数量= ', leftList.length);
			leftList = fileManager.getUploadTask();
			updateAllState(isLeftSelected);
			setDataList([...leftList]);
		} else {
			rightList = fileManager.getDownloadTask();
			updateAllState(isLeftSelected);
			setDataList([...rightList]);
		}
	};

	const taskFailed = () => {
		if (isLeftSelected) {
			updateAllState(isLeftSelected);
			setDataList([...leftList]);
		} else {
			updateAllState(isLeftSelected);
			setDataList([...rightList]);
		}
	};

	const itemSeparator = () => <View style={{ height: 8, width: '100%', backgroundColor: '#F5F5F5' }} />;

	const listHeaderOnpress = () => {
		if (isLeftSelected) {
			if (taskNum === 0) {
				fileManager.resumeAllUploadTask();
			} else {
				fileManager.pauseAllUploadTask();
			}
			leftList.map((item: CloudDocFileItem) => {
				item.isPause = !(taskNum === 0);
				if (taskNum === 0) {
					item.isFailed = false;
				}
				return item;
			});
			setDataList([...leftList]);
		} else {
			if (taskNum === 0) {
				fileManager.resumeAllDownloadTask();
			} else {
				fileManager.pauseAllDownloadTask();
			}
			rightList.map((item: CloudDocFileItem) => {
				item.isPause = !(taskNum === 0);
				if (taskNum === 0) {
					item.isFailed = false;
				}
				return item;
			});
			setDataList([...rightList]);
		}
		updateAllState(isLeftSelected);
	};
	const listHeader = () => (
		<View style={styles.listHeader}>
			<Text style={{ fontSize: 15, fontWeight: '400', color: '#999' }}>
				{isLeftSelected
					? I18n.t('Cloud_Doc_File_Transmit_Upload', { taskNum })
					: I18n.t('Cloud_Doc_File_Transmit_Download', { taskNum })}
			</Text>
			<TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => listHeaderOnpress()}>
				<PauseIcon />
				<Text style={{ fontSize: 15, fontWeight: '400', color: '#1B5BFF' }}>
					{taskNum === 0 ? I18n.t('Cloud_Doc_File_Transmit_All_Start') : I18n.t('Cloud_Doc_File_Transmit_All_Pause')}
				</Text>
			</TouchableOpacity>
		</View>
	);

	const emptyView = () => (
		<View style={{ height: '100%', width: '100%' }}>
			<View style={{ marginTop: 140, width: '100%', flexDirection: 'column', alignItems: 'center' }}>
				<Image source={require('./empty.png')} style={{ width: '80%', height: 213 }} />
				<Text style={{ fontSize: 14, fontWeight: '400', color: '#000', opacity: 0.26 }}>暂无传输任务</Text>
			</View>
		</View>
	);

	const listView = () => (
		<FlatList
			data={dataList}
			// keyExtractor={item => item.value}
			// contentContainerStyle={List.styles.contentContainerStyleFlatList}
			renderItem={({ item }) => (
				<RenderItem
					item={item}
					replayOnpress={item => replayOnpress(item)}
					closeOnpress={item => closeOnpress(item)}
					pauseOnPress={item => pauseOnPress(item)}
					taskSuccess={() => taskSuccess()}
					taskFailed={() => taskFailed()}
				/>
			)}
			ListHeaderComponent={() => listHeader()}
			// ListFooterComponent={() => footerComponent()}
			ItemSeparatorComponent={() => itemSeparator()}
		/>
	);

	return (
		<SafeAreaView testID='cloud-doc-view'>
			<StatusBar />
			<View style={{ flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#F5F5F5' }}>
				<View style={{ height: 16, width: '100%', backgroundColor: '#F5F5F5' }} />
				{topBar()}
				{listView()}
				{dataList && dataList.length > 0 ? null : emptyView()}
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	topBarContainer: {
		paddingHorizontal: 4,
		paddingVertical: 6,
		width: '100%',
		flexDirection: 'row',
		backgroundColor: '#F5F5F5',
		alignItems: 'flex-start'
	},
	topBarItemTextHighLight: {
		fontSize: 15,
		fontStyle: 'normal',
		fontWeight: '500',
		color: '#333'
	},
	topBarItemTextDefualt: {
		fontSize: 15,
		fontStyle: 'normal',
		fontWeight: '400',
		color: '#333'
	},
	topBarItem: {
		alignItems: 'center',
		paddingHorizontal: 12
	},
	topBarUnderline: {
		width: '97%',
		height: 2,
		backgroundColor: '#1B5BFF',
		borderRadius: 1,
		marginTop: 4
	},
	listHeader: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	}
});

export default CloudDocTaskListView;
