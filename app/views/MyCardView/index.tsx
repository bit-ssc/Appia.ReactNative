import React from 'react';
import { Alert, Image, NativeModules, PermissionsAndroid, ScrollView, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';
import CameraRoll from '@react-native-community/cameraroll';

import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { themes } from '../../lib/constants';
import Avatar from '../../containers/Avatar';
import SafeAreaView from '../../containers/SafeAreaView';
import { TSupportedThemes, withTheme } from '../../theme';
import { IApplicationState, IUser } from '../../definitions';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { getUserSelector } from '../../selectors/login';
import { COMPANY_NAME } from '../../lib/constants/contacts';
import Button from '../../containers/Button';
import sdk from '../../lib/services/sdk';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import * as HeaderButton from '../../containers/HeaderButton';
import EventEmitter from '../../utils/events';
import { LISTENER } from '../../containers/Toast';
import { showToast } from '../../lib/methods/helpers/showToast';

interface IMyCardViewProps {
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'MyCardView'>,
		StackNavigationProp<MasterDetailInsideStackParamList>
	>;
	theme: TSupportedThemes;
	useRealName: boolean;
	user: IUser;
	enterpriseName: string;
	route: RouteProp<ChatsStackParamList, 'MyCardView'>;
}

interface IState {
	QRCode: string;
	failureTime: number;
}

class MyCardView extends React.Component<IMyCardViewProps, IState> {
	constructor(props: IMyCardViewProps) {
		super(props);
		this.state = {
			QRCode: '',
			failureTime: Date.now()
		};
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setOptions({
			headerTitleAlign: 'center',
			headerLeft: () => <HeaderButton.BackButton navigation={navigation} />,
			title: I18n.t('employee_business_card')
		});

		this.getQRCode();
	}

	// regetQRCode = setInterval(() => {
	// 	this.getQRCode();
	// }, 60 * 1000);

	async getQRCode() {
		// @ts-ignore
		const { imgUrl, expire } = await sdk.get('qrcode.query');
		this.setState({
			QRCode: await imgUrl,
			failureTime: await expire
		});
		console.log('dxd', this.state.QRCode);
	}

	componentWillUnmount() {
		// clearInterval(this.regetQRCode);
	}

	loadQR = async () => {
		const { QRCode } = this.state;
		if (!QRCode) {
			// 提示二维码为空
		}

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
		const downloadDest = `${dirs}/${Date.now()}.png`;
		const imageDatas = QRCode.split('data:image/png;base64,');
		const imageData = imageDatas[1];

		try {
			RNFetchBlob.fs.writeFile(downloadDest, imageData, 'base64').then(() => {
				console.log('writeFile', downloadDest);
				console.log('imageData', imageData);
				try {
					CameraRoll.save(downloadDest, {
						type: 'photo',
						album: 'Appia'
					})
						.then(e1 => {
							console.info('suc', e1);
							EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
							showToast('保存至相册成功');
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
					console.log('catch', e3);
				}
			});
		} catch (e) {
			console.info('e: ', e);
		}
	};

	renderButton = () => (
		<View style={styles.loadButtonContainer}>
			<Button
				onPress={this.loadQR}
				style={[styles.roomButton1]}
				title={I18n.t('save_to_album')}
				type={'text'}
				color={'#2878FF'}
			></Button>
		</View>
	);

	render() {
		const { user, useRealName, theme, enterpriseName } = this.props;

		if (!user) {
			return null;
		}

		return (
			<SafeAreaView>
				<ScrollView style={[styles.container]} {...scrollPersistTaps}>
					<View style={[styles.headerWrapper, styles.shadow, { backgroundColor: themes[theme].backgroundColor }]}>
						<View style={[styles.header]}>
							<Avatar text={user.username} style={styles.avatar} size={52} />
							<View style={styles.headerTextContainer}>
								<View style={styles.headerUsername}>
									<Text numberOfLines={1} style={[styles.username, { color: themes[theme].titleText }]}>
										{useRealName ? user.name : user.username}
									</Text>
									<Text numberOfLines={1} style={[styles.companyName]}>
										{enterpriseName}
									</Text>
								</View>
							</View>
						</View>
						<View style={[styles.QD_codeContainer]}>
							<Image source={{ uri: this.state.QRCode }} style={[styles.QD_code]}></Image>
						</View>
					</View>
					{this.renderButton()}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	enterpriseName: state.settings.Enterprise_Name || COMPANY_NAME
});

// @ts-ignore
export default connect(mapStateToProps)(withTheme(MyCardView));
