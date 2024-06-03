import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { FetchBlobResponse, StatefulPromise } from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { IUpload, IUser, IAttachment, IUserMessage, TUploadModel } from '../../definitions';
import database from '../database';
import FileUpload from './helpers/fileUpload';
import { IFileUpload } from './helpers/fileUpload/interfaces';
import log from './helpers/log';
import { createFileLocalMessage } from './createFileLocalMessage';
import { random } from './helpers';
import { getMessageById } from '../database/services/Message';
import { store } from '../store/auxStore';
import { showToast } from './helpers/showToast';
import I18n from '../../i18n';
import { isIOS } from '.';

const uploadQueue: { [index: string]: StatefulPromise<FetchBlobResponse> } = {};

const getUploadPath = (path: string, messageId: string) => `${path}-${messageId}`;

export function isUploadActive(path: string, messageId: string): boolean {
	return !!uploadQueue[getUploadPath(path, messageId)];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function resendFile(
	rid: string,
	token: string,
	msgId: string,
	attachments: IAttachment[] | undefined,
	user: IUserMessage | undefined
) {
	try {
		if (attachments) {
			const att = attachments[0];
			const fileInfo = {
				rid,
				type: att.type,
				name: att.name,
				path: att.localPath
			} as IUpload;

			const u = {
				id: user?._id,
				name: user?.name,
				username: user?.username,
				token
			};
			if (fileInfo.path) {
				const fileExists = await RNFS.exists(fileInfo.path);
				if (fileExists) {
					sendFileMessage(rid, fileInfo, '', store.getState().server.server, u, true, msgId);
				} else {
					showToast(I18n.t('Upload_File_Not_Exist'));
				}
			} else {
				showToast(I18n.t('Upload_File_Not_Exist'));
			}
		}
	} catch (e) {
		log(e);
	}
}

const createDirectoryIfNotExists = async (path: string) => {
	const directoryExists = await RNFS.exists(path);
	if (!directoryExists) {
		await RNFS.mkdir(path);
	}
};

export function sendFileMessage(
	rid: string,
	fileInfo: IUpload,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token' | 'username' | 'name'>>,
	isResend?: boolean,
	msgId?: string | undefined
): Promise<FetchBlobResponse | void> {
	return new Promise(async (resolve, reject) => {
		try {
			const { id, token } = user;

			const uploadUrl = `${server}/api/v1/rooms.upload/${rid}`;

			fileInfo.rid = rid;

			let messageId: any = random(17);

			if (isResend) {
				messageId = msgId;
			} else {
				const uploadsDir = `${RNFS.DocumentDirectoryPath}/uploads`;
				await createDirectoryIfNotExists(uploadsDir);
				const destPath = `${uploadsDir}/${fileInfo.name}`;
				if (isIOS) {
					const cleanSourcePath = fileInfo.path.replace(/^file:\/\//, '');
					const decodedPath = decodeURIComponent(cleanSourcePath);
					const fileExists = await RNFS.exists(decodedPath);
					const destPathExists = await RNFS.exists(destPath);
					if (fileExists) {
						if (!destPathExists) {
							await RNFS.copyFile(decodedPath, destPath);
						}
						fileInfo.path = destPath;
					} else {
						const fileExists2 = await RNFS.exists(cleanSourcePath);
						if (fileExists2) {
							if (!destPathExists) {
								await RNFS.copyFile(cleanSourcePath, destPath);
							}
							fileInfo.path = destPath;
						}
					}
				} else {
					await RNFS.copyFile(fileInfo.path, destPath);
					const fileExists = await RNFS.exists(destPath);
					if (fileExists) {
						fileInfo.path = destPath;
					}
				}
			}

			const db = database.active;
			const uploadsCollection = db.get('uploads');
			let uploadRecord: TUploadModel;
			const uploadPath = getUploadPath(fileInfo.path, messageId);

			try {
				uploadRecord = await uploadsCollection.find(messageId);
			} catch (error) {
				try {
					await db.write(async () => {
						uploadRecord = await uploadsCollection.create(u => {
							u._raw = sanitizedRaw({ id: messageId }, uploadsCollection.schema);
							Object.assign(u, fileInfo);
							if (tmid) {
								u.tmid = tmid;
							}
							if (u.subscription) {
								u.subscription.id = rid;
							}
						});
					});
				} catch (e) {
					return log(e);
				}
			}

			const messageDate = new Date();

			await createFileLocalMessage(rid, user, fileInfo, messageId, messageDate);

			const messageRecord = await getMessageById(messageId);

			const formData: IFileUpload[] = [];
			formData.push({
				name: 'file',
				type: fileInfo.type,
				filename: fileInfo.name || 'fileMessage',
				uri: `file://${fileInfo.path}`
			});

			formData.push({
				name: 'messageId',
				data: messageId
			});

			formData.push({
				name: 'ts',
				data: messageDate.toISOString()
			});

			formData.push({
				name: 'localPath',
				data: fileInfo.path
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

			if (tmid) {
				formData.push({
					name: 'tmid',
					data: tmid
				});
			}

			const headers = {
				...RocketChatSettings.customHeaders,
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': token,
				'X-User-Id': id
			};

			uploadQueue[uploadPath] = FileUpload.fetch('POST', uploadUrl, headers, formData);

			uploadQueue[uploadPath].uploadProgress(async (loaded: number, total: number) => {
				try {
					if (messageRecord && messageRecord.attachments) {
						const attachment = messageRecord.attachments[0];
						const a = Math.floor((loaded / total) * 100);
						attachment.uploadProgress = a === 100 ? 98 : a;
						await db.write(async () => {
							await messageRecord.update(m => {
								m.attachments = [attachment];
							});
						});
					}
				} catch (e) {
					log(e);
				}
			});

			uploadQueue[uploadPath].then(async response => {
				if (response.respInfo.status >= 200 && response.respInfo.status < 400) {
					// If response is all good...
					try {
						await db.write(async () => {
							await uploadRecord.destroyPermanently();
						});
						if (messageRecord && messageRecord.attachments) {
							const attachment = messageRecord.attachments[0];
							if (attachment.localPath) {
								console.info('删除文件：', attachment.localPath);
								RNFS.unlink(attachment.localPath);
							}
						}
						resolve(response);
					} catch (e) {
						log(e);
					}
				} else {
					try {
						if (messageRecord && messageRecord.attachments) {
							console.info('上传文件失败：', response);
							const attachment = messageRecord.attachments[0];
							attachment.uploadFail = true;
							await db.write(async () => {
								await messageRecord.update(m => {
									m.attachments = [attachment];
								});
							});
						}
					} catch (e) {
						log(e);
					}
					try {
						reject(response);
					} catch (e) {
						reject(e);
					}
				}
			});

			uploadQueue[uploadPath].catch(async error => {
				try {
					if (messageRecord && messageRecord.attachments) {
						const attachment = messageRecord.attachments[0];
						attachment.uploadFail = true;
						await db.write(async () => {
							await messageRecord.update(m => {
								m.attachments = [attachment];
							});
						});
					}
				} catch (e) {
					log(e);
				}
				reject(error);
			});
		} catch (e) {
			log(e);
		}
	});
}
