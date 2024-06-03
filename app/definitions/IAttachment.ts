import { IApplicationState } from '.';
import { formatAttachmentUrl } from '../lib/methods/helpers/formatAttachmentUrl';
import { IUser } from './IUser';
import store from '../lib/store';

export interface IAttachment {
	ts?: string | Date;
	title?: string;
	type?: string;
	description?: string;
	title_link?: string;
	image_url?: string;
	image_type?: string;
	video_url?: string;
	video_type?: string;
	audio_url?: string;
	title_link_download?: boolean;
	attachments?: IAttachment[];
	fields?: IAttachment[];
	image_dimensions?: { width?: number; height?: number };
	image_preview?: string;
	image_size?: number;
	author_name?: string;
	author_real_name?: string;
	author_icon?: string;
	actions?: { type: string; msg: string; text: string }[];
	message_link?: string;
	text?: string;
	short?: boolean;
	value?: string;
	author_link?: string;
	color?: string;
	thumb_url?: string;
	collapsed?: boolean;
	file_size?: number;
	fileUrl?: string;
	msgType?: string;
	msgData?: string;
	fileId?: string;
	name?: string;
	creatorId?: string;
	currentUserId?: string;
	views?: string;
	downloadUrl?: string;
	format?: string;
	fileSize?: string;
	docRes?: string;
	updatedAt?: string;
	pwd?: string;
	externalMedia?: boolean;
	localPath?: string;
	uploadProgress?: number;
	uploadFail?: boolean;
	isUpload?: boolean;
}

export interface IServerAttachment {
	_id: string;
	name: string;
	size: number;
	type: string;
	rid: string;
	userId: string;
	AmazonS3: { path: string };
	store: string;
	identify: {
		format: string;
		size: {
			width: number;
			height: number;
		};
	};
	complete: boolean;
	etag: string;
	path: string;
	progress: boolean;
	token: string;
	uploadedAt: string | Date;
	uploading: boolean;
	url: string;
	user: Pick<IUser, '_id' | 'username' | 'name'>;
}

export interface IShareAttachment {
	filename: string;
	description?: string;
	size: number;
	mime?: string;
	path: string;
	canUpload: boolean;
	error?: any;
	uri: string;
	width?: number;
	height?: number;
}

export interface IPhoto {
	url: string;
	type: number;
	size: number;
	width: number;
	height: number;
	localPath: string;
	thumbnailUrl100: string;
}

export function attachmentToPhoto(attachment: IAttachment): IPhoto {
	if (!attachment) {
		return { url: '' } as IPhoto;
	}
	let type = 0;
	if (attachment.image_url) {
		type = 0;
	} else if (attachment.video_url) {
		type = 1;
	}
	let url = '';

	if (attachment.externalMedia) {
		url = attachment.title_link || attachment.image_url || attachment.video_url || '';
	} else {
		const baseUrl = (store.getState() as IApplicationState).server.server;
		const { user } = (store.getState() as IApplicationState).login;

		if (type === 0) {
			url = formatAttachmentUrl(
				attachment.title_link || attachment.image_url || attachment.fileUrl,
				user.id || '',
				user.token || '',
				baseUrl
			);
		} else {
			url = formatAttachmentUrl(attachment.video_url, user.id || '', user.token || '', baseUrl);
		}
		url = encodeURI(url);
	}

	const photo: IPhoto = {
		url,
		type,
		size: attachment.file_size || 0,
		width: attachment.image_dimensions?.width || 0,
		height: attachment.image_dimensions?.height || 0,
		localPath: '',
		thumbnailUrl100: attachment.thumb_url || ''
	};
	// console.info('photo', url, type);
	return photo;
}
