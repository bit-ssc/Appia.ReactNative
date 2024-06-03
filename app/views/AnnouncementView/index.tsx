import { TouchableOpacity, Text, TextInput, View, Keyboard, Alert, NativeModules, FlatList, Linking } from 'react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import ImagePicker, { ImageOrVideo } from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import moment from 'moment/moment';

import { CustomIcon } from '../../containers/CustomIcon';
import { ChatsStackParamList } from '../../stacks/types';
import BackgroundContainer from '../../containers/BackgroundContainer';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as HeaderButton from '../../containers/HeaderButton';
import FileIcon from '../../containers/FileIcon';
import Button from '../../containers/Button';
import store from '../../lib/store';
import { attachmentToPhoto, IApplicationState, IAttachment, IRoomSettings, IUser, SubscriptionType } from '../../definitions';
import { canUploadFile } from '../../utils/media';
import I18n from '../../i18n';
import { sendFile } from '../../lib/methods/uploadFile';
import { isIOS } from '../../utils/deviceInfo';
import { showToast } from '../../lib/methods/helpers/showToast';
import { Services } from '../../lib/services';
import { showErrorAlert } from '../../utils/info';
import { OpenFile } from '../../lib/methods/openFile';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { hasPermission } from '../../lib/methods';
import { forceJpgExtension } from '../../containers/MessageBox/forceJpgExtension';
import CloseIcon from '../../containers/Icon/Close';
import Avatar from '../../containers/Avatar';

interface IAnnouncementProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'AnnouncementView'>;
	route: RouteProp<ChatsStackParamList, 'AnnouncementView'>;
}

export interface IFile {
	fileName: string;
	fileUrl: string;
	fileType: string;
}

const getType = (message: string) => message && message.split('.')[message.split('.').length - 1].trim();

export const getAllFiles = (value: string[]) => {
	const files = [] as IFile[];
	for (let i = 1; i < value.length; i++) {
		const file = {
			fileName: value[i],
			fileUrl: value[i + 1],
			fileType: getType(value[i + 1])
		} as IFile;
		files.push(file);
		i++;
	}
	return files;
};

export const isImage = (type: string) => /png|jpg|jpeg|gif|webp|apng/i.test(type.toLowerCase().trim());

export const getAllImages = (files: IFile[]) => {
	const images = [] as IFile[];
	for (let i = 0; i < files.length; i++) {
		if (isImage(files[i].fileType)) {
			images.push(files[i]);
		}
	}
	return images;
};

export const getOtherFiles = (files: IFile[]) => {
	const otherFiles = [] as IFile[];
	for (let i = 0; i < files.length; i++) {
		if (!isImage(files[i].fileType)) {
			otherFiles.push(files[i]);
		}
	}
	return otherFiles;
};

export const previewImage = (item: IFile) => {
	if (isIOS) {
		Keyboard.dismiss();
	}
	const photo = attachmentToPhoto(item as IAttachment);
	const JSToNativeManager = NativeModules?.JSToNativeManager;
	JSToNativeManager.showPhoto(photo);
};

const AnnouncementView = ({ navigation, route }: IAnnouncementProps): React.ReactElement => {
	const separator = '\u0001\u0002';
	const room = route.params?.room;
	const { announcement } = room;
	// const insets = useSafeAreaInsets();
	const [isEditing, setIsEditing] = useState(false);
	const [bottomOffset, setBottomOffset] = useState(20);
	const { setOptions } = useNavigation();
	const [haveEditPermission, setHaveEditPermission] = useState(false);
	const updateTime = room.announcement?.updateTime;

	const allMessage = (announcement?.message ?? '').split(separator);
	const content = allMessage && allMessage.length > 0 ? allMessage[0] : '';

	const [allFiles, setAllFiles] = useState(getAllFiles(allMessage));
	const [allImages, setAllImages] = useState(getAllImages(allFiles));
	const [otherFiles, setOtherFiles] = useState(getOtherFiles(allFiles));
	// console.info("allFiles", allFiles)
	// console.info("allImages", allImages)
	// console.info("otherFiles", otherFiles)

	const [announcementMsg, setAnnouncementMsg] = useState(content);
	const [saving, setSaving] = useState(false);

	const inputRef = useRef<TextInput>(null);
	const oMsg = announcement?.message;

	useEffect(() => {
		checkPermisson();
	}, []);

	const checkPermisson = async () => {
		const isLivechat = room.t === SubscriptionType.OMNICHANNEL;

		const { permissions } = store.getState();
		const editLivechatRoomCustomfields = permissions['edit-livechat-room-customfields'];
		const editOmnichannelContact = permissions['edit-omnichannel-contact'];
		const editRoomPermission = permissions['edit-room'];

		const permissionToEdit = isLivechat ? [editOmnichannelContact, editLivechatRoomCustomfields] : [editRoomPermission];
		const hasPerm = await hasPermission(permissionToEdit, room.rid);
		if (hasPerm.some(Boolean)) {
			setHaveEditPermission(true);
		}
	};

	const addAnnouncement = () => {
		setIsEditing(true);
		setTimeout(() => {
			inputRef.current?.blur();
		}, 1000);
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const postOrEdit = () => {
		if (!isEditing) {
			setIsEditing(true);
			return;
		}
		if (!announcementMsg && !allImages && !otherFiles) {
			showToast(I18n.t('Toast_Submit_Announcement'));
		} else {
			submit();
		}
	};

	const openFile = async (item: IFile) => {
		setSaving(true);
		const attachment = {
			title: item.fileName.trim(),
			title_link: item.fileUrl.trim(),
			type: item.fileType.trim()
		};
		await OpenFile(attachment);
		setSaving(false);
	};

	const deleteFile = (index: number, isImage: boolean) => {
		if (isImage) {
			allImages.splice(index, 1);
			const list = Array.from(allImages);
			setAllImages(list);
		} else {
			otherFiles.splice(index, 1);
			const list = Array.from(otherFiles);
			setOtherFiles(list);
		}
		const newAllFiles = Array.from(allImages);
		newAllFiles.push(...otherFiles);
		const list = Array.from(newAllFiles);
		setAllFiles(list);
	};

	const submit = async () => {
		Keyboard.dismiss();

		setSaving(true);
		const params = {} as IRoomSettings;

		let result = `${announcementMsg}`;

		if (allFiles && allFiles.length) {
			let suffix = '';
			for (let i = 0; i < allFiles.length; i++) {
				suffix = `${suffix} \u0001\u0002${allFiles[i].fileName} \u0001\u0002${allFiles[i].fileUrl.replace(
					new RegExp('/file-upload'),
					'/file-proxy'
				)}`;
			}
			result = `${announcementMsg} ${suffix}`;
		}
		if (result !== oMsg) {
			if (isBlank(result)) {
				result = '';
			}
			params.roomAnnouncement = {
				message: result
			};
		} else {
			showErrorAlert(I18n.t('Nothing_to_save'));
			setSaving(false);
			return;
		}
		try {
			await Services.saveRoomSettings(room.rid, params);
			setSaving(false);
			navigation.pop();
		} catch (e: any) {
			setSaving(false);
			showToast('上传失败，请稍后重试');
			setIsEditing(false);
		}
	};

	function isBlank(str: string) {
		return !str || /^\s*$/.test(str);
	}

	const getFileType = (url: string) => {
		const reg = url.split('.').pop();
		return reg;
	};

	const chooseFile = async () => {
		if (room.t !== 'd') {
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
					path: res.uri
				};
				uploadAllFile(file);
			} catch (e: any) {
				setSaving(false);
				if (!DocumentPicker.isCancel(e)) {
					showToast(e);
				} else {
					showToast(I18n.t('Cancel'));
				}
			}
		}
	};

	const uploadAllFile = async (file: any) => {
		const user = (store.getState() as IApplicationState).login.user as IUser;
		const server = (store.getState() as IApplicationState).server.server as string;
		// todo 可能存在问题
		if (canUpload([file])) {
			setSaving(true);
			const result = await sendFile(
				'announcement.bot',
				{
					name: file.filename,
					description: '',
					size: file.size ?? 0,
					type: file.mime ?? '',
					path: file.path,
					store: 'Uploads'
				},
				server,
				{ id: user.id, token: user.token }
			).then(res => res.url ?? '');
			let newFile = null;
			newFile = result
				? ({
						fileName: file.filename,
						fileUrl: result.replace(new RegExp('/file-upload'), '/file-proxy'),
						fileType: getFileType(file.filename) ?? ''
				  } as IFile)
				: null;
			// @ts-ignore
			if (isImage(newFile.fileType)) {
				// @ts-ignore
				allImages.push(newFile);
				const list = Array.from(allImages);
				setAllImages(list);
			} else {
				// @ts-ignore
				otherFiles.push(newFile);
				const list = Array.from(otherFiles);
				setOtherFiles(list);
			}
			const newAllFiles = Array.from(allImages);
			newAllFiles.push(...otherFiles);
			const list = Array.from(newAllFiles);
			setAllFiles(list);
			setSaving(false);
		}
	};

	const choosePhoto = async () => {
		const chooseFromGallery = NativeModules?.JSToNativeManager?.chooseFromGallery;
		try {
			let attachments = null;
			if (chooseFromGallery != null && !isIOS) {
				attachments = (await chooseFromGallery()) as unknown as ImageOrVideo[];
			} else {
				attachments = (await ImagePicker.openPicker({
					multiple: true,
					compressVideoPreset: 'Passthrough',
					mediaType: 'any',
					forceJpg: true
				})) as unknown as ImageOrVideo[];
			}
			// @ts-ignore
			attachments = attachments.map(att => forceJpgExtension(att));
			attachments.forEach(item => {
				const file = {
					filename: item.filename,
					size: item.size,
					mime: item.mime,
					path: item.path
				};
				uploadAllFile(file);
			});
		} catch (e) {
			if ((e as { code: string })?.code === 'E_NO_CAMERA_PERMISSION') {
				showToast(I18n.t('Alert_Open_Camera_Permission'));
			}
		}
	};

	const canUpload = (files: any[]) => {
		if (!files || files.length <= 0) return false;
		return files.every(value => canUploadFileThis(value));
	};

	const canUploadFileThis = (file: any) => {
		const FileUpload_MediaTypeWhiteList = (store.getState() as IApplicationState).settings
			.FileUpload_MediaTypeWhiteList as string;
		const maxFileSize = (store.getState() as IApplicationState).settings.FileUpload_MaxFileSize as number;
		const result = canUploadFile({
			file,
			allowList: FileUpload_MediaTypeWhiteList,
			maxFileSize,
			permissionToUploadFile: true
		});
		if (result.success) {
			return true;
		}
		Alert.alert(I18n.t('Error_uploading'), result.error && I18n.isTranslated(result.error) ? I18n.t(result.error) : result.error);
		return false;
	};

	const keyboardDidShowHandler = (event: any) => {
		setBottomOffset(event.endCoordinates.height ?? 180);
	};

	const keyboardDidHideHandler = () => {
		setBottomOffset(20);
	};

	useEffect(() => {
		Keyboard.addListener('keyboardWillShow', keyboardDidShowHandler);
		Keyboard.addListener('keyboardWillHide', keyboardDidHideHandler);
		return () => {
			Keyboard.removeListener('keyboardWillShow', keyboardDidShowHandler);
			Keyboard.removeListener('keyboardWillHide', keyboardDidHideHandler);
		};
	}, []);

	useLayoutEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Announcement')
		});
	}, [setOptions]);

	useLayoutEffect(() => {
		const titleStr = isEditing ? I18n.t('Publish') : I18n.t('Edit');
		const rightTitle = announcementMsg.length === 0 && !isEditing ? '' : titleStr;
		const options = {
			headerLeft: () => <HeaderButton.BackButton onPress={() => navigation.pop()} />,
			headerRight: () =>
				haveEditPermission ? (
					<HeaderButton.Container>
						<HeaderButton.Item title={rightTitle} onPress={postOrEdit}></HeaderButton.Item>
					</HeaderButton.Container>
				) : null
		};
		navigation.setOptions(options);
	}, [announcementMsg.length, haveEditPermission, isEditing, navigation, postOrEdit]);

	const renderEmptyView = () => (
		<>
			<BackgroundContainer loading={false} text={I18n.t('No_Announcement')} />
			{haveEditPermission ? (
				<TouchableOpacity
					onPress={addAnnouncement}
					style={{
						height: 40,
						backgroundColor: '#2878FF',
						marginBottom: 40,
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'row',
						marginHorizontal: 15,
						borderRadius: 5
					}}
				>
					<CustomIcon name='add' size={16} color='white' />
					<Text style={{ color: 'white', marginLeft: 5 }}>{I18n.t('Add_Announcement')}</Text>
				</TouchableOpacity>
			) : null}
		</>
	);

	const changeAnnouncement = (text: string) => {
		setAnnouncementMsg(text);
	};

	const renderHeader = () => {
		const user = room?.announcement?.u;
		return (
			<View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
				<Avatar text={user?.username} style={{ marginRight: 12 }} size={36} />
				<View>
					<Text style={[{ fontSize: 16, color: '#000' }]}>{user?.name}</Text>
					<Text>{moment(updateTime).format('更新于MM月DD日 HH:mm')}</Text>
				</View>
			</View>
		);
	};

	const OpenURLText = ({ url, children }) => {
		const handlePress = () => {
			// 使用Linking API打开URL
			Linking.openURL(url);
		};

		return (
			<Text style={{ color: '#5297FF' }} onPress={handlePress}>
				{children}
			</Text>
		);
	};

	const renderLinks = () => {
		// /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
		// @ts-ignore
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		const links = announcementMsg.match(urlRegex);

		const parts = announcementMsg.split(urlRegex);

		if (links && links?.length > 0) {
			return (
				<View>
					{renderHeader()}
					<Text style={{ color: '#000' }}>
						{/* 遍历文本块并为URL添加特殊处理 */}
						{parts.map((part, index) =>
							urlRegex.test(part) ? (
								<OpenURLText key={String(index)} url={part}>
									{part}
								</OpenURLText>
							) : (
								<Text key={String(index)}>{part}</Text>
							)
						)}
					</Text>
				</View>
			);
		}
		return (
			<View>
				{renderHeader()}
				<Text style={[{ fontSize: 16, color: '#000' }]}>{announcementMsg}</Text>
			</View>
		);
	};

	const renderImage = (item: { item: IFile; index: number }) => (
		<View>
			<Touchable
				onPress={() => {
					previewImage(item?.item);
				}}
			>
				<FastImage
					style={{ width: 111, height: 111, marginHorizontal: 5, marginBottom: 5 }}
					source={{
						uri: item?.item?.fileUrl,
						priority: FastImage.priority.high
					}}
					resizeMode={FastImage.resizeMode.cover}
				/>
			</Touchable>
			{isEditing ? (
				<Touchable
					style={{ position: 'absolute', alignSelf: 'flex-end', right: 10, top: 5 }}
					onPress={() => deleteFile(item?.index, true)}
				>
					<CloseIcon color={'#E5E6E8'} width={20} height={20} />
				</Touchable>
			) : null}
		</View>
	);

	const renderAnnouncement = () => (
		<>
			<View style={{ backgroundColor: 'white', margin: 10, padding: 10, flex: 1 }}>
				{isEditing ? (
					<TextInput
						style={[{ fontSize: 16, color: '#000' }]}
						autoFocus={true}
						placeholder={I18n.t('Announcement')}
						multiline={true}
						numberOfLines={0}
						editable={isEditing}
						value={announcementMsg}
						onChangeText={text => changeAnnouncement(text)}
					></TextInput>
				) : (
					renderLinks()
				)}
				{allImages ? (
					<FlatList
						style={{ marginTop: 8, flexGrow: 0 }}
						data={allImages}
						renderItem={({ item, index }) => renderImage({ item, index })}
						numColumns={3}
					/>
				) : null}
				{otherFiles &&
					otherFiles.map((item, index) => (
						<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
							<TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => openFile(item)}>
								<FileIcon fontSize={20} fileName={item.fileType} />
								<Text style={{ color: '#5297FF', marginLeft: 5 }}>{item.fileName}</Text>
							</TouchableOpacity>
							{isEditing && (
								// 添加文件后看预览的状态
								<TouchableOpacity onPress={() => deleteFile(index, false)}>
									<CustomIcon name={'close'} size={20} color={'black'} />
								</TouchableOpacity>
							)}
						</View>
					))}
			</View>
			{isEditing ? (
				<View style={{ marginBottom: bottomOffset, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
					<Button
						style={{ marginHorizontal: 30, height: 30, borderRadius: 5 }}
						title={I18n.t('Upload_file')}
						onPress={chooseFile}
					></Button>
					{isIOS ? (
						<Button
							style={{ marginHorizontal: 30, height: 30, borderRadius: 5 }}
							title={I18n.t('Upload_photo')}
							onPress={choosePhoto}
						></Button>
					) : null}
				</View>
			) : null}
		</>
	);

	return (
		<SafeAreaView
			style={{ backgroundColor: '#FAFAFA' }}
			// onTouchStart={() => {
			// 	Keyboard.dismiss();
			// }}
		>
			<StatusBar />
			{announcementMsg.length === 0 && !isEditing ? renderEmptyView() : renderAnnouncement()}
			{saving ? <ActivityIndicator absolute size='large' /> : null}
		</SafeAreaView>
	);
};

export default AnnouncementView;
