import I18n from 'i18n-js';
import { Keyboard, NativeModules } from 'react-native';

import { showToast } from './helpers/showToast';
import { attachmentToPhoto, IAttachment } from '../../definitions/IAttachment';
import { formatAttachmentUrl } from './helpers/formatAttachmentUrl';
import store from '../store';
import { IApplicationState, IUser } from '../../definitions';
import { isIOS } from '../../utils/deviceInfo';
import { createPreviewGetFileId, fileDownloadAndPreview } from '../../utils/fileDownload';
import Navigation from '../navigation/appNavigation';
import { IFileInfo } from '../../definitions/ICloudDisk';

// import { themes } from '../constants';
// import { useTheme } from '../../theme';

interface OpenFileOptions {
	iosUseShimo?: boolean;
	pictureUseShimo?: boolean;
	downloadUrl?: string;
	url?: string;
}

export async function OpenFile(attachment: IAttachment, options?: OpenFileOptions, messageId?: string) {
	const user = (store.getState() as IApplicationState).login.user as IUser;
	const server = (store.getState() as IApplicationState).server.server as string;

	const enterpriseId = (store.getState() as IApplicationState).settings.Enterprise_ID;
	const shimoWeb = ((store.getState() as IApplicationState).settings.Shimo_Web_Url || 'https://shimo-web.sophmain.vip') as string;
	if ((!options || !options.pictureUseShimo) && attachment.type) {
		if (
			['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].indexOf(attachment.type.toLowerCase()) !== -1 ||
			attachment.image_type
		) {
			if (isIOS) {
				Keyboard.dismiss();
			}
			const photo = attachmentToPhoto(attachment);
			const JSToNativeManager = NativeModules?.JSToNativeManager;
			JSToNativeManager?.showPhoto(photo);
			return;
		}

		if (
			['mp4', 'mp3', 'avi', 'wmv', 'mpg', 'mpeg', 'mov', 'rm', 'ram', 'swf', 'flv', 'wma', 'rmvb', 'flv', 'mkv'].indexOf(
				attachment.type.toLowerCase()
			) !== -1 ||
			attachment.video_type
		) {
			if (isIOS) {
				Keyboard.dismiss();
			}
			attachment.video_url = attachment.title_link;
			const photo = attachmentToPhoto(attachment);
			const JSToNativeManager = NativeModules?.JSToNativeManager;
			JSToNativeManager?.showPhoto(photo);
			return;
		}
	}
	if (attachment.title_link) {
		if (isIOS && options && !options.iosUseShimo) {
			await fileDownloadAndPreview(
				options.url ?? formatAttachmentUrl(attachment.title_link, user.id, user.token, server),
				attachment
			);
		} else {
			let downloadUrl = '';
			if (options && options.downloadUrl) {
				downloadUrl = options.downloadUrl;
			} else {
				downloadUrl = attachment.title_link.replace(new RegExp('/file-upload'), '/file-proxy');
				downloadUrl = downloadUrl.startsWith('https') ? downloadUrl : `${server}${downloadUrl}`;
			}
			console.info('downloadUrl', downloadUrl);
			try {
				// 这里不需要fileID
				const result = await createPreviewGetFileId(
					getFileType(attachment.title_link)?.trimRight() || '',
					attachment.title || '未命名文件',
					downloadUrl ?? '',
					attachment.file_size || 1000
				);
				if (result.code === '0') {
					const { data } = result;
					const docUrl = `${shimoWeb}/clouddocument/${data.fileId}?&org=${enterpriseId}&source=appia&type=preview&token=${user.token}&userId=${user.id}&header=0`;
					await Navigation.navigate('CloudDocumentWebView', {
						title: attachment.title || '未命名文件',
						url: docUrl,
						downloadUrl,
						messageId,
						titleLink: attachment.title_link
					});
				} else {
					showToast(I18n.t('Error_Download_file'));
				}
			} catch (error) {
				showToast((error as Error).message);
			}
		}
	}
}

export const openCloudFile = (cloudFile: IFileInfo) => {
	if (!cloudFile) return;
	const user = (store.getState() as IApplicationState).login.user as IUser;

	const enterpriseId = (store.getState() as IApplicationState).settings.Enterprise_ID;
	const shimoWeb = ((store.getState() as IApplicationState).settings.Shimo_Web_Url || 'https://shimo-web.sophmain.vip') as string;

	const docUrl = `${shimoWeb}/clouddocument/${cloudFile.fileId}?&org=${enterpriseId}&source=appia&type=cooperation&token=${user.token}&userId=${user.id}&header=0`;
	Navigation.navigate('CloudDocumentPage', {
		title: cloudFile.name || '未命名文件',
		url: docUrl,
		cloudFile
	});
};

const getFileType = (url: string) => {
	const reg = url.split('.').pop()?.toLowerCase();
	return reg;
};
