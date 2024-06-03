import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { NativeModules } from 'react-native';

import log from '../../utils/log';
import { IUpload, IUser } from '../../definitions';
import { isIOS } from '../../utils/deviceInfo';

const uploadQueue: { [index: string]: Promise<Response> } = {};

export function isUploadActive(path: string): boolean {
	return !!uploadQueue[path];
}

// export async function cancelUpload(item: TUploadModel): Promise<void> {
// 	if (!isEmpty(uploadQueue[item.path])) {
// 		try {
// 			await uploadQueue[item.path].cancel();
// 		} catch {
// 			// Do nothing
// 		}
// 		try {
// 			const db = database.active;
// 			await db.write(async () => {
// 				await item.destroyPermanently();
// 			});
// 		} catch (e) {
// 			log(e);
// 		}
// 		delete uploadQueue[item.path];
// 	}
// }

export function sendFile(
	robotId: string,
	fileInfo: IUpload,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>
): Promise<Response | void> {
	return new Promise((resolve, reject) => {
		try {
			if (isIOS) {
				const JSToNativeManager = NativeModules?.JSToNativeManager;
				JSToNativeManager?.changeFileUploadStatus(1);
			}
			const { id, token } = user;

			const uploadUrl = `${server}/api/v1/admin/file/upload/${robotId}`;

			const formData = new FormData();
			formData.append('file', {
				// @ts-ignore
				name: fileInfo.name || 'file',
				// @ts-ignore
				type: 'multipart/form-data',
				fileType: fileInfo.type,
				uri: fileInfo.path
			});

			const headers = {
				...RocketChatSettings.customHeaders,
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': token,
				'X-User-Id': id
			};
			fetch(uploadUrl, { method: 'POST', headers, body: formData })
				.then(response => {
					if (response.status >= 200 && response.status < 400) {
						// If response is all good...
						if (isIOS) {
							const JSToNativeManager = NativeModules?.JSToNativeManager;
							JSToNativeManager?.changeFileUploadStatus(0);
						}
						try {
							// await db.write(async () => {
							// 	await uploadRecord.destroyPermanently();
							// });
							resolve(response.json());
						} catch (e) {
							log(e);
						}
					} else {
						if (isIOS) {
							const JSToNativeManager = NativeModules?.JSToNativeManager;
							JSToNativeManager?.changeFileUploadStatus(0);
						}
						try {
							// await db.write(async () => {
							// 	await uploadRecord.update(u => {
							// 		u.error = true;
							// 	});
							// });
						} catch (e) {
							log(e);
						}
						try {
							reject(response);
						} catch (e) {
							reject(e);
						}
					}
				})
				.catch(error => {
					if (isIOS) {
						const JSToNativeManager = NativeModules?.JSToNativeManager;
						JSToNativeManager?.changeFileUploadStatus(0);
					}
					try {
						// await db.write(async () => {
						// 	await uploadRecord.update(u => {
						// 		u.error = true;
						// 	});
						// });
					} catch (e) {
						log(e);
					}
					reject(error);
				});
		} catch (e) {
			if (isIOS) {
				const JSToNativeManager = NativeModules?.JSToNativeManager;
				JSToNativeManager?.changeFileUploadStatus(0);
			}
			log(e);
		}
	});

	// uploadQueue[fileInfo.path].uploadProgress(async (loaded: number, total: number) => {
	// 	try {
	// 		await db.write(async () => {
	// 			await uploadRecord.update(u => {
	// 				u.progress = Math.floor((loaded / total) * 100);
	// 			});
	// 		});
	// 	} catch (e) {
	// 		log(e);
	// 	}
	// });
}
