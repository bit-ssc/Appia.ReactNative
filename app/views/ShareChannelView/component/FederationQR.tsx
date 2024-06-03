import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, NativeModules, PermissionsAndroid, StyleProp, Text, View, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Touchable from 'react-native-platform-touchable';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';
import CameraRoll from '@react-native-community/cameraroll';

import { IApplicationState, ISubscription } from '../../../definitions';
import I18n from '../../../i18n';
import * as List from '../../../containers/List';
import styles from '../styles';
import { Services } from '../../../lib/services';
import { ScannerResult } from '../../ScannerView';
import { showToast } from '../../../lib/methods/helpers/showToast';
import { separator } from '../index';
import { isAndroid, isIOS } from '../../../utils/deviceInfo';
import EventEmitter from '../../../utils/events';
import { LISTENER } from '../../../containers/Toast';
import Button from '../../../containers/Button';
import { useTheme } from '../../../theme';
import Touch from '../../../utils/touch';

interface IFederationProps {
	room: ISubscription;
	expire: number;
	timeStr: string;
	setDrawerShow: (state: boolean) => void;
	style?: StyleProp<ViewStyle>;
}

const FederationQR = ({ room, expire = -1, timeStr, setDrawerShow, style }: IFederationProps): React.ReactElement => {
	const enterprise = useSelector((state: IApplicationState) => state.settings.Enterprise_ID);
	const user = useSelector((state: IApplicationState) => state.login.user.username || state.login.user.name);
	const [qrcodeContent, setQrcodeContent] = useState('');
	let qrcodeRef: { toDataURL: (arg0: (url: any) => void) => void };
	const { theme, colors } = useTheme();

	useEffect(() => {
		getContent();
	}, [expire, enterprise, user]);

	const getContent = async () => {
		try {
			// @ts-ignore
			const res = await Services.getRoomQRcode(room?.rid, {
				inviteUsername: user || '',
				expire,
				attribution: (enterprise as unknown as string) || '',
				owner: user || '',
				ownerOrg: (enterprise as unknown as string) || '',
				t: room?.t || '',
				limitNumber: expire === 1 ? 1 : undefined
			});
			let inviteId = ''; // eslint-disable-next-line no-empty
			// @ts-ignore
			if (res.success) {
				// @ts-ignore
				inviteId = res.data.inviteId;
				setQrcodeContent(`${ScannerResult.JOIN_FEDERATION}${separator}${inviteId}`);
			}
		} catch (e) {
			console.info(e);
			showToast('获取二维码信息失败');
		}
	};

	const reload = () => getContent();

	const loadQR = async (imageData: string) => {
		if (isAndroid) {
			const rationale = {
				title: I18n.t('Write_External_Permission'),
				message: I18n.t('Write_External_Permission_Message'),
				buttonPositive: 'Ok'
			};
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, rationale);
			if (!(result || result === PermissionsAndroid.RESULTS.GRANTED)) {
				return;
			}
		}
		const dirs = isIOS ? RNFS.LibraryDirectoryPath : `${RNFS.PicturesDirectoryPath}/Appia`;
		const downloadDest = `${dirs}/${Date.now()}.jpg`;
		const newImageData = isIOS ? imageData.replace(/\r?\n|\r/g, '') : imageData;
		try {
			RNFetchBlob.fs.writeFile(downloadDest, newImageData, 'base64').then(() => {
				console.info('first', downloadDest);
				try {
					CameraRoll.save(downloadDest, {
						type: 'photo',
						album: 'Appia'
					})
						.then(e1 => {
							console.info('suc', e1);
							EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
							showToast(I18n.t('saved_to_gallery'));
						})
						.catch(e2 => {
							console.info('fai', e2);
							if (e2.code === 'E_PHOTO_LIBRARY_AUTH_DENIED') {
								Alert.alert(
									I18n.t('Alert_Permission'),
									I18n.t('Alert_Open_Gallary_Permission'),
									[
										{
											text: I18n.t('Confirm'),
											onPress: () => {
												const JSToNativeManager = NativeModules?.JSToNativeManager;
												JSToNativeManager.jumpToSystemSetting();
											}
										}
									],
									{ cancelable: false }
								);
							}
						});
				} catch (e3) {
					// Alert.alert(JSON.stringify(e3))
					console.info('catch', e3);
				}
			});
		} catch (e) {
			console.info('e: ', e);
		}
	};

	const loadQRHandle = () => {
		if (qrcodeRef) {
			qrcodeRef.toDataURL(imageData => loadQR(imageData));
		} else {
			showToast('保存二维码失败');
		}
	};

	const renderImage = () => (
		<View style={styles.qrcodeContainer}>
			{qrcodeContent ? (
				<QRCode
					value={qrcodeContent}
					getRef={ref => (qrcodeRef = ref)}
					logo={require('../../../static/images/logo.png')}
					logoSize={40}
					size={200}
				/>
			) : (
				<Touchable onPress={reload} style={styles.QD_code}>
					<Text>点击刷新...</Text>
				</Touchable>
			)}
		</View>
	);

	const renderButton = () => (
		<Button
			title={I18n.t('save_to_album')}
			onPress={loadQRHandle}
			style={[
				{
					backgroundColor: 'fff',
					borderColor: colors.tintColor,
					borderWidth: 2,
					borderRadius: 4
				}
			]}
			styleText={[{ color: colors.tintColor }]}
		/>
	);

	const renderValidTime = () => (
		<Touch
			theme={theme}
			onPress={() => {
				setDrawerShow(true);
			}}
		>
			<List.Section
				style={[
					styles.roomInfoContainer,
					{
						flexDirection: 'row',
						justifyContent: 'flex-end',
						marginTop: 0,
						borderTopLeftRadius: 0,
						borderTopRightRadius: 0
					}
				]}
			>
				<View style={[{ height: 40, alignSelf: 'baseline' }]}>
					<Text style={styles.itemTitle} numberOfLines={1}>
						{I18n.t('QR_Code_Valid_Time')}
					</Text>
				</View>

				<Text
					style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
					numberOfLines={1}
					ellipsizeMode={'tail'}
				>
					{timeStr}
				</Text>
				<List.Icon name='chevron-right' style={[styles.actionIndicator]} />
			</List.Section>
		</Touch>
	);

	const renderTips = () => (
		<List.Section
			style={[
				styles.roomInfoContainer,
				{
					flexDirection: 'row',
					justifyContent: 'flex-end',
					marginTop: 0,
					borderTopLeftRadius: 0,
					borderTopRightRadius: 0
				}
			]}
		>
			<Text style={[styles.tipText, { marginStart: isIOS ? 16 : 0 }]}>{I18n.t('Federation_QR_Tips2')}</Text>
		</List.Section>
	);

	return (
		<List.Container testID='room-type-scrollview'>
			<List.Section
				style={[
					styles.roomInfoContainer,
					{
						paddingHorizontal: 20,
						paddingTop: 16,
						marginBottom: 1,
						borderBottomLeftRadius: 0,
						borderBottomRightRadius: 0
					},
					style
				]}
			>
				{renderImage()}
				{renderButton()}
			</List.Section>
			{renderValidTime()}
			{renderTips()}
		</List.Container>
	);
};

export default FederationQR;
