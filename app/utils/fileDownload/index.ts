import RNFetchBlob, { FetchBlobResponse } from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { NativeModules } from 'react-native';

import { IApplicationState } from '../../definitions/redux/index';
import EventEmitter from '../events';
import { LISTENER } from '../../containers/Toast';
import I18n from '../../i18n';
import { DOCUMENTS_PATH, DOWNLOAD_PATH, EXTERNAL_DOWNLOAD_PATH } from '../../lib/constants';
import { IAttachment } from '../../definitions/IAttachment';
import store from '../../lib/store';
import { EResourceType } from '../../definitions';
import { isAndroid } from '../deviceInfo';

export interface IResource {
	url?: string;
	type: EResourceType;
	size: number;
	width: number;
	height: number;
	localPath?: string;
}
export const openPreview = (resources: IResource[], index = 0): void => {
	const showPhotoBrowser = NativeModules?.JSToNativeManager?.showPhotoBrowser;

	if (showPhotoBrowser) {
		showPhotoBrowser(index, resources);
	}
};

export const getLocalFilePathFromFile = (localPath: string, attachment: IAttachment): string => `${localPath}${attachment.title}`;

export const fileDownload = (url: string, attachment: IAttachment): Promise<FetchBlobResponse> => {
	const path = getLocalFilePathFromFile(isAndroid ? EXTERNAL_DOWNLOAD_PATH : DOWNLOAD_PATH, attachment);

	const options = {
		path,
		timeout: 10000,
		indicator: true,
		overwrite: true,
		addAndroidDownloads: {
			path,
			notification: true,
			useDownloadManager: true
		}
	};

	return RNFetchBlob.config(options).fetch('GET', url);
};

interface FileViewerOptions {
	displayName?: string;
	showAppsSuggestions?: boolean;
	showOpenWithDialog?: boolean;
	onDismiss?(): any;
}

export const fileDownloadAndPreview = async (
	url: string,
	attachment: IAttachment,
	options?: FileViewerOptions
): Promise<void> => {
	try {
		const path = getLocalFilePathFromFile(DOCUMENTS_PATH, attachment);
		const file = await RNFetchBlob.config({
			timeout: 10000,
			indicator: true,
			path
		}).fetch('GET', url);

		FileViewer.open(file.data, {
			showOpenWithDialog: true,
			showAppsSuggestions: true,
			...options
		})
			.then(res => res)
			.catch(async () => {
				const file = await fileDownload(url, attachment);
				file
					? EventEmitter.emit(LISTENER, { message: I18n.t('Downloaded_file') })
					: EventEmitter.emit(LISTENER, { message: I18n.t('Error_Download_file') });
			});
	} catch (e) {
		EventEmitter.emit(LISTENER, { message: I18n.t('Error_Download_file') });
	}
};

export const createPreviewGetFileId = (format: string, fileName: string, downloadUrl: string, fileSize: number): Promise<any> => {
	const { user } = (store.getState() as IApplicationState).login;
	const { settings } = store.getState() as IApplicationState;
	const org = (settings.Enterprise_ID || 'bitmain') as string;

	const headers = {
		'a-doc-source': 'appia',
		'a-doc-token': user.token || '',
		'Content-Type': 'application/json',
		'a-doc-username': user.id || '',
		'a-doc-org': org
	};
	console.info('header', headers);
	const shimoServer = settings.Shimo_Api_Url || 'https://shimo-server.sophmain.vip';
	return fetch(`${shimoServer}/api/v1/rpc/file/view/create`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ format, fileName, downloadUrl, fileSize })
	}).then(response => {
		console.info(response);
		if (response.ok) {
			return response.json();
		}
		return Promise.reject(new Error(''));
	});
};
