import {
	Alert,
	Dimensions,
	Image,
	Modal,
	NativeModules,
	PermissionsAndroid,
	ScrollView,
	Text,
	ToastAndroid,
	View
} from 'react-native';
import React from 'react';
import RNFetchBlob from 'react-native-blob-util';
import * as Progress from 'react-native-progress';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';

import Button from '../Button';
import styles from './styles';
import { isIOS } from '../../lib/methods';
import openLink from '../../utils/openLink';
import { isTablet } from '../../utils/deviceInfo';

const PATH = '/storage/emulated/0/Download/appia/';
const CACHE_PATH = '/storage/emulated/0/Download/appia/appia_cache_file.apk';

export interface IVersionData {
	platform: string;
	version: string;
	url: string;
	is_force_update: boolean;
	file_hash: string;
	notes: string;
}

interface IVersionModalProps {
	versionData: IVersionData | undefined;
	showModal: Function;
}

interface IVersionModalState {
	loadingStart?: boolean;
	imgObjHg: number;
	downloadProgress?: number;
}

export default class VersionModal extends React.Component<IVersionModalProps, IVersionModalState> {
	private task: any;
	constructor(props: IVersionModalProps) {
		super(props);
		this.state = {
			imgObjHg: 0,
			downloadProgress: 0,
			loadingStart: false
		};
	}

	componentDidMount() {
		const screenWidth = Dimensions.get('window').width * 0.85;
		const cover = require('../../static/images/update.png');
		const imageObj = Image.resolveAssetSource(cover);
		const { width, height } = imageObj;
		// 根据屏幕宽度拿到图片自适应高度
		const myHeight = Math.floor(((screenWidth / width) * height) / 0.85);
		this.setState({ imgObjHg: isTablet ? myHeight / 2 : myHeight });
		this.task = null;
	}

	isLoadedApk = async () => {
		if (isIOS) {
			const { versionData } = this.props;
			if (versionData) {
				const JSToNativeManager = NativeModules?.JSToNativeManager;
				JSToNativeManager.checkTestflight((error: any, event: any) => {
					if (!error) {
						const res = versionData.url.split(',');
						if (event === 1) {
							openLink(res[1] ?? versionData.url);
						} else {
							openLink(res[0] ?? versionData.url);
						}
					}
				});
			}
			return;
		}
		await this.deleteCacheFile();
		const { versionData } = this.props;
		RNFS.exists(`${PATH}${versionData?.version}.apk`).then(value => {
			value ? this.apkInstallAndPermission() : this.crequestMultiplePermission();
		});
	};

	crequestMultiplePermission = async () => {
		try {
			if ((DeviceInfo.getSystemVersion() as unknown as number) <= 10) {
				const res = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
				if (res) {
					this.androidDownload();
				} else {
					await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then(res => {
						res === 'granted' ? this.androidDownload() : this.permissionToast();
					});
				}
			} else {
				NativeModules?.JSToNativeManager?.getAllFilePermission(
					() => {
						// ToastAndroid.showWithGravity(
						// 	'Android11 之后， 下载apk到外部存储需要所有文件权限',
						// 	ToastAndroid.SHORT,
						// 	ToastAndroid.BOTTOM
						// );
						this.androidDownload();
					},
					() => {
						ToastAndroid.showWithGravity('Android11+ 下载apk到外部存储需要所有文件权限', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
					}
				);
			}
		} catch (e) {
			console.info(e);
		}
	};

	permissionToast = () => {
		Alert.alert('获取文件管理权限失败,请去设置中开启');
	};

	androidDownload = () => {
		ToastAndroid.showWithGravity('请勿退出当前页面', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
		const { versionData } = this.props;
		this.setState({
			loadingStart: true
		});

		this.task = RNFetchBlob.config({
			path: CACHE_PATH,
			overwrite: true
		})
			.fetch('GET', versionData?.url as string)
			.progress((received, total) => {
				this.setState({
					downloadProgress: received / total
				});
			});
		this.task
			.then((res: any) => {
				this.setState({
					downloadProgress: 1
				});
				RNFS.moveFile(res.path(), `${PATH}${versionData?.version}.apk`);
				RNFetchBlob.android.actionViewIntent(`${PATH}${versionData?.version}.apk`, 'application/vnd.android.package-archive');
			})
			.catch((e: any) => {
				console.info('e ===============', e);
			});
	};

	deleteCacheFile = async () => {
		await RNFS.unlink(CACHE_PATH)
			.then(() => {
				console.info('FILE DELETED');
			})
			.catch(err => {
				console.info('err', err);
			});
	};

	onPress = () => {
		this.props.showModal(false);
	};

	renderBeforeLoad = () => {
		const { versionData } = this.props;
		return (
			<View style={styles.buttonContainer}>
				<Button title={'立即升级'} onPress={() => this.isLoadedApk()} style={styles.update}></Button>
				{versionData?.is_force_update ? null : (
					<Button
						title={'暂不升级'}
						onPress={() => {
							this.onPress();
						}}
						style={styles.reject}
						color={'#000000'}
					></Button>
				)}
			</View>
		);
	};

	apkInstallAndPermission = async () => {
		try {
			try {
				if ((DeviceInfo.getSystemVersion() as unknown as number) <= 10) {
					const res = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
					if (res) {
						ToastAndroid.showWithGravity('检测到已下载最新安装包', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
						this.installApk();
					} else {
						await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then(res => {
							res === 'granted' ? this.installApk() : this.permissionToast();
						});
					}
				} else {
					NativeModules?.JSToNativeManager?.getAllFilePermission(
						() => {
							// ToastAndroid.showWithGravity(
							// 	'Android11 之后， 下载apk到外部存储需要所有文件权限',
							// 	ToastAndroid.SHORT,
							// 	ToastAndroid.BOTTOM
							// );
							this.installApk();
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
			console.log(err);
		}
	};

	installApk = () => {
		RNFetchBlob.android.actionViewIntent(
			`${PATH}${this.props.versionData?.version}.apk`,
			'application/vnd.android.package-archive'
		);
	};

	cancelTask = () => {
		this.task &&
			this.task.cancel((error: any) => {
				console.info('Download Task cancel ', error);
				this.props.showModal(false);
				ToastAndroid.showWithGravity('下载任务已取消', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
				this.deleteCacheFile();
			});
	};

	renderLoading = () => {
		const { downloadProgress } = this.state;
		return (
			<View style={styles.loadingContainer}>
				{downloadProgress === 1 ? (
					<>
						<Text style={styles.installText}> 已下载完成</Text>
						<Button title={'立即安装'} onPress={() => this.apkInstallAndPermission()} style={styles.installButton}></Button>
					</>
				) : (
					<>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<View style={{ height: 5 }}>
								<Progress.Bar progress={downloadProgress} width={200} />
							</View>
							<Text style={{ marginStart: 8 }}>{Math.floor((downloadProgress as number) * 100)}%</Text>
						</View>
						<Button
							title={'取消升级'}
							onPress={() => {
								this.cancelTask();
							}}
							style={[styles.reject, { marginTop: 10 }]}
							color={'#000000'}
						/>
					</>
				)}
			</View>
		);
	};

	render() {
		const { versionData } = this.props;
		const { loadingStart, imgObjHg } = this.state;
		return (
			<Modal animationType='fade' transparent={true}>
				<View style={styles.modalView}>
					<View style={[styles.container, { height: imgObjHg }]}>
						<Image
							resizeMode='stretch'
							style={[styles.img, { width: '100%', height: imgObjHg }]}
							source={require('../../static/images/update.png')}
						/>
						<View style={[styles.header]}>
							<Text style={[styles.title, { color: '#ffffff' }]}>发现新版本!</Text>
							<Text style={[styles.text, { color: '#ffffff' }]}>{versionData?.version.split('-')[0]}版本，体验全新升级</Text>
						</View>

						<ScrollView style={[styles.content]} showsVerticalScrollIndicator={false} fadingEdgeLength={100}>
							<Text style={[styles.tip, { color: '#000000' }]}>更新内容:</Text>
							<Text style={[styles.note, { color: '#000000' }]}>{versionData?.notes}</Text>
						</ScrollView>
						{loadingStart ? this.renderLoading() : this.renderBeforeLoad()}
					</View>
				</View>
			</Modal>
		);
	}
}
