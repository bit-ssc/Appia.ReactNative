import RNFetchBlob, { FetchBlobResponse } from 'react-native-blob-util';
import { Alert, AppState, NativeModules, PermissionsAndroid, ToastAndroid } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import { MMKVInstance, MMKVLoader, ProcessingModes } from 'react-native-mmkv-storage';
import { useRef } from 'react';

import { IFileUpload } from '../../lib/methods/helpers/fileUpload/interfaces';
import FileUpload from '../../lib/methods/helpers/fileUpload';
import { isIOS } from '../../utils/deviceInfo';
import { setDownloadTaskNum, setIsUploadNumShow, setUploadTaskNum } from '../../actions/cloudDisk';
import { store as reduxStore } from '../../lib/store/auxStore';
import { Services } from '../../lib/services';
import sdk from '../../lib/services/sdk';
import { showToast } from '../../lib/methods/helpers/showToast';

export interface CloudDocFileItem {
	filename: string;
	fileId: string;
	path: string;
	mime: string;
	format: string;
	type: string;
	size: number;
	folderId: string;
	isUpload: boolean;
	received: number;
	sent: number;
	isPause: boolean;
	isFailed: boolean;
	task: any;
	downloadProgressCallBack: (received: number, total: number) => void;
	uploadProgressCallBack: (sent: number, total: number) => void;
	taskSuccess: () => void;
	taskFaild: () => void;
}

export class CloudDocFileManager {
	// 构造函数
	private downloadTaskArr: CloudDocFileItem[] = [];
	private uploadTaskArr: CloudDocFileItem[] = [];

	// eslint-disable-next-line react-hooks/rules-of-hooks
	private appState = useRef(AppState.currentState);

	private mmkv: MMKVInstance;

	private static myInstance = null;

	private urlPrefix = `${reduxStore.getState().server.server}/api/v1/${Services.prefix}`;

	static getInstance() {
		if (CloudDocFileManager.myInstance === null) {
			// @ts-ignore
			CloudDocFileManager.myInstance = new CloudDocFileManager();
		}
		return this.myInstance;
	}

	constructor() {
		console.info('初始化了--------------------------');
		const userid = reduxStore.getState().login.user.id;
		this.mmkv = new MMKVLoader()
			// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
			.setProcessingMode(ProcessingModes.MULTI_PROCESS)
			.withEncryption()
			.withInstanceID(userid as string)
			.initialize();
		AppState.addEventListener('change', this.handleAppStateChange);
	}

	handleAppStateChange = (nextAppState: string) => {
		if (this.appState.current.match(/inactive|background/) && nextAppState === 'active') {
			console.info('App has come to the foreground!');
			this.getTaskFromStorage();
		}

		if (this.appState.current.match(/active|foreground/) && nextAppState === 'inactive') {
			console.info('App has come to the background!');
			this.saveTaskToStorage();
		}

		// @ts-ignore
		this.appState.current = nextAppState;
		console.info('AppState', this.appState.current);
	};

	saveTaskToStorage() {
		for (const item of this.uploadTaskArr) {
			item.isFailed = true;
			if (item.task && item.task.cancel) {
				item.task.cancel();
			}
		}
		for (const item of this.downloadTaskArr) {
			item.isPause = true;
			if (item.task && item.task.cancel) {
				item.task.cancel();
			}
		}

		this.mmkv.setArrayAsync('uploadTaskList', this.uploadTaskArr);
		this.mmkv.setArrayAsync('downloadTaskList', this.downloadTaskArr);
	}

	getTaskFromStorage() {
		this.mmkv.getArrayAsync('uploadTaskList').then(res => {
			if (this.uploadTaskArr.length === 0) {
				this.uploadTaskArr = res as CloudDocFileItem[];
				reduxStore.dispatch(setUploadTaskNum(this.uploadTaskArr.length));
			}
		});
		this.mmkv.getArrayAsync('downloadTaskList').then(res => {
			if (this.downloadTaskArr.length === 0) {
				this.downloadTaskArr = res as CloudDocFileItem[];
			}
		});
	}

	getDownloadTask() {
		return this.downloadTaskArr;
	}

	getUploadTask() {
		return this.uploadTaskArr;
	}

	private uploadFileFetch(item: CloudDocFileItem): Promise<FetchBlobResponse | void> {
		// eslint-disable-next-line require-await
		return new Promise(async (resolve, reject) => {
			const formData: IFileUpload[] = [];
			formData.push({
				name: 'file',
				type: item.mime,
				filename: item.filename,
				uri: item.path,
				data: RNFetchBlob.wrap(decodeURI(item.path))
			});
			formData.push({
				name: 'docSource',
				data: 'web_yun_pan'
			});
			formData.push({
				name: 'folderId',
				data: item.folderId === '' ? 'fo_0' : item.folderId
			});

			// const url = `${this.urlPrefix}/rpc/file/import`;
			const url = `${reduxStore.getState().server.server}/api/v1/doc.fileImport`;
			const headers = {
				'X-Auth-Token': sdk.current.currentLogin.authToken,
				'X-User-Id': sdk.current.currentLogin.userId
			};
			console.info('开始', headers);
			const task = FileUpload.fetch('POST', url, headers, formData);
			item.task = task;
			task.then(res => {
				resolve(res);
				console.info('上传结束：', res);
			});
			task.uploadProgress((written, total) => {
				item.sent = written;
				item.size = total;
				if (item.uploadProgressCallBack) {
					item.uploadProgressCallBack(written, total);
				}
			});
			task.catch(res => {
				reject(res);
			});
		});
	}

	uploadFile(item: CloudDocFileItem) {
		console.info('开始上传 = ', item);
		this.uploadFileFetch(item)
			.then(res => {
				const { respInfo } = res;
				// eslint-disable-next-line eqeqeq
				if (respInfo.status == 200) {
					if (item.isUpload) {
						const index = this.uploadTaskArr.indexOf(item);
						this.uploadTaskArr.splice(index, 1);
						reduxStore.dispatch(setUploadTaskNum(this.uploadTaskArr.length));
						if (this.uploadTaskArr.length === 0) {
							reduxStore.dispatch(setIsUploadNumShow(false));
						}
						if (item.taskSuccess) {
							item.taskSuccess();
						}
					}
					showToast('上传成功');
				} else {
					item.isFailed = true;
					if (item.taskFaild) {
						item.taskFaild();
					}
				}
			})
			.catch(res => {
				console.info('失败=====', res);
				item.isFailed = true;
				if (item.taskFaild) {
					item.taskFaild();
				}
			});
		item.isUpload = true;
		this.uploadTaskArr.push(item);
		reduxStore.dispatch(setIsUploadNumShow(true));
		reduxStore.dispatch(setUploadTaskNum(this.uploadTaskArr.length));
	}

	private getAndroidPermission = async (item: CloudDocFileItem) => {
		try {
			try {
				if ((DeviceInfo.getSystemVersion() as unknown as number) <= 10) {
					const res = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
					if (res) {
						ToastAndroid.showWithGravity('检测到已下载最新安装包', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
						this.downloadFileFetch(item);
					} else {
						await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then(res => {
							res === 'granted' ? this.downloadFileFetch(item) : this.permissionToast();
						});
					}
				} else {
					NativeModules?.AliveModule?.getAllFilePermission(
						() => {
							// ToastAndroid.showWithGravity(
							// 	'Android11 之后， 下载apk到外部存储需要所有文件权限',
							// 	ToastAndroid.SHORT,
							// 	ToastAndroid.BOTTOM
							// );
							this.downloadFileFetch(item);
						},
						() => {
							ToastAndroid.showWithGravity(
								'Android11+ 下载apk到外部存储需要所有文件权限',
								ToastAndroid.SHORT,
								ToastAndroid.BOTTOM
							);
						}
					);
				}
			} catch (e) {
				console.info(e);
			}
		} catch (err) {
			console.info(err);
		}
	};

	private permissionToast = () => {
		Alert.alert('获取文件管理权限失败,请去设置中开启');
	};

	async downloadFile(fileId: string, filename: string, size: number, type: string, format: string, downloadUrl?: string) {
		if (fileId && filename && size) {
			const item = { fileId, filename, size, type, format } as CloudDocFileItem;
			// 这个地方：有的文件没有下载链接，需要先导出，再下载
			if (downloadUrl) {
				item.path = downloadUrl;
				if (!item.isPause) {
					if (isIOS) {
						this.downloadFileFetch(item);
					} else {
						this.getAndroidPermission(item);
					}
				}
			} else {
				await Services.requestFileEport(fileId)
					.then(res => {
						const { data } = res;
						this.requestFileEportProgress(data.fileId, data.taskId)
							.then(res => {
								const { data } = res;
								item.path = data.downloadUrl;
								if (!item.isPause) {
									if (isIOS) {
										this.downloadFileFetch(item);
									} else {
										this.getAndroidPermission(item);
									}
								}
							})
							.catch(() => {
								item.isFailed = true;
								const index = this.downloadTaskArr.indexOf(item);
								if (index <= -1) {
									this.downloadTaskArr.push(item);
								}
							});
					})
					.catch(() => {
						item.isFailed = true;
						const index = this.downloadTaskArr.indexOf(item);
						if (index <= -1) {
							this.downloadTaskArr.push(item);
						}
					});
			}
		}
	}

	private downloadFileFetch(item: CloudDocFileItem): Promise<FetchBlobResponse | void> {
		console.info('开始下载');
		// eslint-disable-next-line require-await
		return new Promise(async (resolve, reject) => {
			const task = RNFetchBlob.config({
				fileCache: true,
				overwrite: true
			}).fetch('GET', item.path, {});

			task
				.progress((received, total) => {
					item.received = received;
					item.size = total;
					if (item.downloadProgressCallBack) {
						item.downloadProgressCallBack(received, total);
					}
				})
				.then(async res => {
					let path: string;
					let { format } = item;
					if (format) {
						format = `.${format}`;
					}
					console.info('开始保存 = ', item);
					if (isIOS) {
						const localPath = `${RNFS.DocumentDirectoryPath}/Download`;
						path = `${localPath}/${item.filename}${format}`;
						const res = await RNFS.exists(localPath);
						if (!res) {
							await RNFS.mkdir(localPath);
						}
					} else {
						path = `/storage/emulated/0/Download/${item.filename}${format}`;
					}
					console.info('下载路径 = ', path);
					RNFS.copyFile(res.path(), path)
						.then(() => {
							console.info('保存成功 path = ', path);
							RNFetchBlob.fs.mv;
						})
						.catch(err => {
							console.info('保存失败：', err);
						});

					const index = this.downloadTaskArr.indexOf(item);
					this.downloadTaskArr.splice(index, 1);
					if (item.taskSuccess) {
						item.taskSuccess();
					}
					reduxStore.dispatch(setDownloadTaskNum(this.downloadTaskArr.length));
					resolve(res);
				})
				.catch(err => {
					console.info('下载失败 = ', err.toString(), 'Error = ', Error);
					if (!err.toString().match('canceled')) {
						item.isFailed = true;
					}

					if (item.taskFaild) {
						item.taskFaild();
					}
					reject(err);
				});
			item.task = task;
			const index = this.downloadTaskArr.indexOf(item);
			if (index <= -1) {
				console.info('index = ', index);
				this.downloadTaskArr.push(item);
			}
			reduxStore.dispatch(setDownloadTaskNum(this.downloadTaskArr.length));
		});
	}

	pauseUploadTask(item: CloudDocFileItem) {
		item.task.cancel((err: any) => {
			console.info('pauseUploadTask = ', err);
		});
		console.info(item);
	}

	pauseAllUploadTask() {
		for (const item of this.uploadTaskArr) {
			this.pauseUploadTask(item);
		}
	}

	resumeUploadTask(item: CloudDocFileItem) {
		console.info(item);
		this.uploadFileFetch(item)
			.then(res => {
				const { respInfo } = res;
				const { _response } = respInfo;
				const jsonObject = JSON.parse(_response);
				console.info('上传成功 = ', _response, jsonObject, jsonObject.success);
				if (jsonObject.success === true) {
					const index = this.uploadTaskArr.indexOf(item);
					this.uploadTaskArr.splice(index, 1);
					if (item.taskSuccess) {
						item.taskSuccess();
					}
				} else {
					item.isFailed = true;
					if (item.taskFaild) {
						item.taskFaild();
					}
				}
			})
			.catch(() => {
				item.isFailed = true;
				if (item.taskFaild) {
					item.taskFaild();
				}
			});
		item.isUpload = true;
	}
	resumeAllUploadTask() {
		for (const item of this.uploadTaskArr) {
			this.resumeUploadTask(item);
		}
	}
	pauseDownloadTask(item: CloudDocFileItem) {
		item.task.cancel((err: any) => {
			console.info(err);
		});
	}
	pauseAllDownloadTask() {
		for (const item of this.downloadTaskArr) {
			this.pauseDownloadTask(item);
		}
	}
	async resumeDownloadTask(item: CloudDocFileItem) {
		await Services.requestFileEport(item.fileId)
			.then(res => {
				const { data } = res;
				this.requestFileEportProgress(data.fileId, data.taskId)
					.then(res => {
						const { data } = res;
						item.path = data.downloadUrl;
						if (!item.isPause) {
							if (isIOS) {
								this.downloadFileFetch(item);
							} else {
								this.getAndroidPermission(item);
							}
						}
					})
					.catch(() => {
						item.isFailed = true;
						const index = this.downloadTaskArr.indexOf(item);
						if (index <= -1) {
							this.downloadTaskArr.push(item);
						}
					});
			})
			.catch(() => {
				item.isFailed = true;
				const index = this.downloadTaskArr.indexOf(item);
				if (index <= -1) {
					this.downloadTaskArr.push(item);
				}
			});
	}

	resumeAllDownloadTask() {
		for (const item of this.downloadTaskArr) {
			this.resumeDownloadTask(item);
		}
	}

	closeUploadTask(item: CloudDocFileItem) {
		const index = this.uploadTaskArr.indexOf(item);
		if (index > -1) {
			if (item.task && item.task.cancel) {
				item.task.cancel();
			}
			this.uploadTaskArr.splice(index, 1);
			reduxStore.dispatch(setUploadTaskNum(this.uploadTaskArr.length));
		}
	}
	closeDownloadTask(item: CloudDocFileItem) {
		const index = this.downloadTaskArr.indexOf(item);
		if (index > -1) {
			if (item.task && item.task.cancel) {
				item.task.cancel();
			}
			this.downloadTaskArr.splice(index, 1);
		}
	}
	requestFileEportProgress = (fileId?: string, taskId?: string): Promise<any> =>
		Services.requestFileEportProgress(fileId, taskId)
			.then(res => {
				const { data } = res;
				if (data.progress === 100) {
					return Promise.resolve(res);
				}
				return this.requestFileEportProgress(fileId, taskId);
			})
			.catch(e => Promise.reject(e));
}
