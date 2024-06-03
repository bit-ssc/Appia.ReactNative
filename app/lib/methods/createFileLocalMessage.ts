import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Model } from '@nozbe/watermelondb';
import mime from 'react-native-mime-types';

import database from '../database';
import log from './helpers/log';
import { Encryption } from '../encryption';
import { E2EType, IMessage, IUser, IUpload, IAttachment } from '../../definitions';
import { E2E_MESSAGE_TYPE, E2E_STATUS, messagesStatus } from '../constants';
import { IFileUpload } from './helpers/fileUpload/interfaces';
import { getMessageById } from '../database/services/Message';

export async function createFileLocalMessage(
	rid: string,
	user: Partial<Pick<IUser, 'id' | 'token' | 'username' | 'name'>>,
	fileInfo: IUpload,
	messageId: any,
	ts: string | Date
): Promise<void> {
	try {
		const db = database.active;
		const messageRecord = await getMessageById(messageId);

		if (messageRecord) {
			await db.write(async () => {
				await messageRecord.update(m => {
					m.ts = ts;
				});
			});
			if (messageRecord.attachments) {
				const attachment = messageRecord.attachments[0];
				attachment.uploadFail = false;
				attachment.uploadProgress = 0;
				await db.write(async () => {
					await messageRecord.update(m => {
						m.attachments = [attachment];
					});
				});
			}
		} else {
			const msgCollection = db.get('messages');

			const batch: Model[] = [];

			const formData: IFileUpload[] = [];
			formData.push({
				name: 'file',
				type: fileInfo.type,
				filename: fileInfo.name || 'fileMessage',
				uri: fileInfo.path
			});

			if (fileInfo.description) {
				formData.push({
					name: 'description',
					data: fileInfo.description
				});
			}

			if (fileInfo.msg) {
				formData.push({
					name: 'msg',
					data: fileInfo.msg
				});
			}
			const message = await Encryption.encryptMessage({
				_id: messageId,
				rid
			} as IMessage);

			const attachment = getAttachment(fileInfo);

			// Create the message sent in Messages collection
			batch.push(
				msgCollection.prepareCreate(m => {
					m._raw = sanitizedRaw({ id: messageId }, msgCollection.schema);
					if (m.subscription) {
						m.subscription.id = rid;
					}
					m.msg = '';
					m.ts = ts;
					m._updatedAt = ts;
					m.status = messagesStatus.TEMP;
					m.unread = true;
					m.u = {
						_id: user.id || '1',
						username: user.username,
						name: user.name
					};

					m.t = message.t;
					if (message.t === E2E_MESSAGE_TYPE) {
						m.e2e = E2E_STATUS.DONE as E2EType;
					}
					m.attachments = [attachment];
					m.file = {
						_id: '',
						name: fileInfo.name ? fileInfo.name : '文件',
						type: fileInfo.type ? fileInfo.type : 'type'
					};
				})
			);

			try {
				await db.write(async () => {
					await db.batch(...batch);
				});
			} catch (e) {
				console.info('保存失败 ===', e);
				return;
			}
		}
	} catch (e) {
		console.info('创建失败 ===', e);
		log(e);
	}
}

const getAttachment = (file: IUpload): IAttachment => {
	const mimeType = mime.lookup(file.path);
	if (mimeType && mimeType.startsWith('image/')) {
		return {
			image_url: file.path,
			localPath: file.path,
			image_type: file.type,
			image_dimensions: {
				width: file.width,
				height: file.height
			},
			type: file.type,
			name: file.name,
			isUpload: true
		};
	}
	if (mimeType && mimeType.startsWith('video/')) {
		return {
			video_url: file.path, // 这里可能应该是 video_url 而不是 audio_url
			localPath: file.path,
			type: file.type,
			name: file.name,
			isUpload: true
		};
	}
	return {
		format: file.type || 'file', // 使用 || 来提供默认值
		title: file.name,
		title_link: file.path,
		title_link_download: true,
		localPath: file.path,
		type: file.type,
		name: file.name,
		isUpload: true
	};
};
