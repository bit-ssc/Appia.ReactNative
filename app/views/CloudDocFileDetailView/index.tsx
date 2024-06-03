import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import FileIcon from '../../containers/FileIcon';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { ICloudFile } from '../CloudStorageView';
import { Services } from '../../lib/services';
import { ChatsStackParamList } from '../../stacks/types';
import * as HeaderButton from '../../containers/HeaderButton';

const CloudDocFileDetailView = props => {
	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'CloudDocFileDetailView'>>();

	const { fileId, callBack, isFromReycleView, folderId } = props.route.params;
	const [fileData, setFileData] = useState<ICloudFile>({});

	useLayoutEffect(() => {
		// eslint-disable-next-line no-undef
		navigation.setOptions({
			title: I18n.t('Cloud_Doc_Bottom_Details'),
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
		(() => {
			loadData();
		})();
	}, [fileId]);

	const loadData = async () => {
		console.info('fileId = ', fileId, folderId);
		if (fileId) {
			const res = await Services.getCloudDocInfo(fileId);
			const { data } = res;
			console.info('data = ', data);
			setFileData(data as ICloudFile);
			return;
		}
		if (folderId) {
			const res = await Services.getCloudFolderInfo(folderId);
			const { data } = res;
			console.info('data = ', data);
			const { folderSizeStr, ownerName } = data;
			data.fileSizeStr = folderSizeStr;
			data.creatorName = ownerName;
			data.type = 'folder';
			setFileData(data as ICloudFile);
		}
	};

	const fileTitleView = () => (
		<View style={styles.fileContainer}>
			<FileIcon
				fontSize={24}
				fileName={fileData.format ? fileData.format : fileData.type}
				isCloud={fileData.downloadUrl !== ''}
			/>
			<View style={{ height: 24, paddingTop: 3, paddingLeft: 8 }}>
				<Text style={{ fontSize: 16, fontWeight: '400' }}>{fileData.name}</Text>
			</View>
		</View>
	);

	const fileItemView = (title: string, content: string) => (
		<View style={{ width: '100%', paddingTop: 12, flexDirection: 'column' }}>
			<Text style={{ fontSize: 14, color: '#999999', fontWeight: '400' }}>{title}</Text>
			<Text style={{ fontSize: 16, color: '#333', fontWeight: '400', paddingTop: 4 }}>{content}</Text>
		</View>
	);

	const onPress = () => {
		if (callBack) {
			callBack();
		}
		navigation.pop();
	};

	const backBtn = () => (
		<TouchableOpacity style={styles.bottomButton} onPress={() => onPress()}>
			<Text style={{ fontSize: 18, color: '#FFF', fontWeight: '400' }}>还原</Text>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView
			testID='cloud-doc-view'
			style={{ backgroundColor: '#FAFAFA', flexDirection: 'column', justifyContent: 'space-between' }}
		>
			<StatusBar />
			<View style={styles.container}>
				{fileData.name ? fileTitleView() : null}
				{!isFromReycleView && fileData.creatorName ? fileItemView(I18n.t('Cloud_Doc_File_Creator'), fileData.creatorName) : null}
				{!isFromReycleView && fileData.createdAt ? fileItemView(I18n.t('Cloud_Doc_File_Creat_Time'), fileData.createdAt) : null}
				{fileData.fileSizeStr
					? fileItemView(I18n.t('Cloud_Doc_File_Size'), fileData.size > 0 ? fileData.fileSizeStr : '未知')
					: null}
				{isFromReycleView && fileData.updateAt ? fileItemView(I18n.t('Cloud_Doc_File_Delete_Time'), fileData.updateAt) : null}
				{isFromReycleView && fileData.creatorName
					? fileItemView(I18n.t('Cloud_Doc_File_Delete_Operator'), fileData.creatorName)
					: null}
				{fileData.pwd ? fileItemView(I18n.t('Cloud_Doc_File_Delete_Location'), fileData.pwd) : null}
				{!isFromReycleView && fileData.views
					? fileItemView(I18n.t('Cloud_Doc_File_Creat_Views'), fileData.views?.toString())
					: null}
			</View>
			{isFromReycleView ? backBtn() : null}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		display: 'flex',
		padding: 12,
		flexDirection: 'column',
		alignItems: 'flex-start',
		backgroundColor: '#FFF',
		marginLeft: 12,
		marginRight: 12,
		marginTop: 12
	},
	fileContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		height: 36
	},
	bottomButton: {
		height: 49,
		marginRight: 16,
		marginLeft: 16,
		backgroundColor: '#1B5BFF',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4,
		...Platform.select({
			ios: {
				marginBottom: 32
			},
			android: {
				marginBottom: 12
			}
		})
	}
});

export default CloudDocFileDetailView;
