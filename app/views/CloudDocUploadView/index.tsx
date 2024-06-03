import React from 'react';
import { Alert, NativeModules, Text, TouchableOpacity, View } from 'react-native';
import ImagePicker, { ImageOrVideo, Options } from 'react-native-image-crop-picker';
import DocumentPicker from 'react-native-document-picker';

import { isAndroid, isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import { AlbumIcon, FoldIcon, VideoIcon } from '../CloudDocRecycleView/SvgIcon';
import { DrawerMenu } from '../../containers/DrawerMenu';
import log, { events, logEvent } from '../../utils/log';
import { forceJpgExtension } from '../../containers/MessageBox/forceJpgExtension';
import { showToast } from '../../lib/methods/helpers/showToast';
import { CloudDocFileItem, CloudDocFileManager } from './CloudDocFileManager';

const CloudDocUploadView: React.FC<{ hideModal: Function; visible: boolean; folderId: string }> = ({
	hideModal,
	visible,
	folderId
}) => {
	// @ts-ignore
	const fileManager: CloudDocFileManager = CloudDocFileManager.getInstance();
	const uploadImage = () => {
		// hideModal()
		chooseFromLibrary();
	};
	const uploadVideo = () => {
		takeVideo();
	};
	// const task:any

	const videoPickerConfig: Options = {
		mediaType: 'video'
	};

	const libraryPickerConfig: Options = {
		multiple: true,
		compressVideoPreset: 'Passthrough',
		mediaType: 'any',
		forceJpg: true
	};

	const fileUpload = (item: CloudDocFileItem) => {
		// @ts-ignore
		fileManager.uploadFile(item);
	};

	const takeVideo = async () => {
		logEvent(events.ROOM_BOX_ACTION_VIDEO);
		try {
			const video = await ImagePicker.openCamera(videoPickerConfig);
			hideModal();
			const file = {
				filename: video.filename,
				path: video.path,
				size: video.size,
				mime: video.mime,
				folderId
			} as CloudDocFileItem;

			if (file.size > 200 * 1024 * 1024 * 1024) {
				Alert.alert('文件过大');
			} else {
				fileUpload(file);
				hideModal();
			}
		} catch (e) {
			hideModal();
			logEvent(events.ROOM_BOX_ACTION_VIDEO_F);
			if ((e as { code: string })?.code === 'E_NO_CAMERA_PERMISSION') {
				// this.alertNativePermisson(I18n.t('Alert_Open_Camera_Permission'));
			}
		}
	};

	const chooseFromLibrary = async () => {
		logEvent(events.ROOM_BOX_ACTION_LIBRARY);
		const chooseFromGallery = NativeModules?.JSToNativeManager?.chooseFromGallery;
		try {
			let attachments = null;
			if (chooseFromGallery != null && isAndroid) {
				attachments = (await chooseFromGallery()) as unknown as ImageOrVideo[];
			} else {
				attachments = (await ImagePicker.openPicker(libraryPickerConfig)) as unknown as ImageOrVideo[];
			}
			// @ts-ignore
			attachments = attachments.map(att => forceJpgExtension(att));
			for (const attachment of attachments) {
				// @ts-ignore
				const file = {
					filename: attachment.filename,
					path: attachment.path,
					size: attachment.size,
					mime: attachment.mime,
					folderId
				} as CloudDocFileItem;

				if (file.size > 200 * 1024 * 1024) {
					Alert.alert('文件过大');
				} else {
					fileUpload(file);
					hideModal();
				}
			}
			console.info(attachments);
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_LIBRARY_F);
			if ((e as { code: string })?.code === 'E_NO_LIBRARY_PERMISSION') {
				// this.alertNativePermisson(I18n.t('Alert_Open_Gallary_Permission'));
			}
			console.info(e);
		}
	};

	const chooseFile = async () => {
		logEvent(events.ROOM_BOX_ACTION_FILE);
		try {
			const res = await DocumentPicker.pickSingle({
				type: [DocumentPicker.types.allFiles]
			});
			if (res.size === 0) {
				showToast('不能选择0KB的文件');
				return;
			}
			const file = {
				filename: res.name,
				size: res.size,
				mime: res.type,
				path: res.uri,
				folderId
			} as CloudDocFileItem;
			console.info(res);
			if (file.size > 200 * 1024 * 1024) {
				Alert.alert('文件过大');
			} else {
				fileUpload(file);
				hideModal();
			}
		} catch (e: any) {
			if (!DocumentPicker.isCancel(e)) {
				logEvent(events.ROOM_BOX_ACTION_FILE_F);
				log(e);
			}
		}
	};

	return (
		<DrawerMenu
			visible={visible}
			hideModal={hideModal}
			menuPosition='bottom'
			Height={isIOS ? 190 : 179}
			children={
				<View style={{ flexDirection: 'column' }}>
					<View style={{ alignItems: 'center', justifyContent: 'center', padding: 8 }}>
						{/* eslint-disable-next-line react/jsx-no-undef */}
						<Text style={{ fontSize: 16, fontWeight: '400', color: '#333' }}>{I18n.t('Cloud_Doc_File_Upload_Title')}</Text>
					</View>
					<View style={{ width: '100%', flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 20 }}>
						<TouchableOpacity
							style={{ flexDirection: 'column', paddingVertical: 8, paddingHorizontal: 12, width: '25%', alignItems: 'center' }}
							onPress={uploadImage}
						>
							<AlbumIcon />
							<View style={{ marginTop: 12 }}>
								<Text style={{ fontSize: 14, fontWeight: '400', color: '#666' }}>{I18n.t('Upload_photo')}</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={{ flexDirection: 'column', paddingVertical: 8, paddingHorizontal: 12, width: '25%', alignItems: 'center' }}
							onPress={uploadVideo}
						>
							<VideoIcon />
							<View style={{ marginTop: 12 }}>
								<Text style={{ fontSize: 14, fontWeight: '400', color: '#666' }}>{I18n.t('Cloud_Doc_File_Upload_Video')}</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={{ flexDirection: 'column', paddingVertical: 8, paddingHorizontal: 12, width: '25%', alignItems: 'center' }}
							onPress={chooseFile}
						>
							<FoldIcon />
							<View style={{ marginTop: 12 }}>
								<Text style={{ fontSize: 14, fontWeight: '400', color: '#666' }}>{I18n.t('Upload_file')}</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>
			}
		/>
	);
};

export default CloudDocUploadView;
