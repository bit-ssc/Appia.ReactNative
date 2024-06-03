import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { connect } from 'react-redux';
import Touchable from 'react-native-platform-touchable';
import QRCodeScanner from 'react-native-qrcode-scanner';
import ImagePicker from 'react-native-image-crop-picker';
// @ts-ignore
import QRCodeReader from 'react-native-qrcode-local-image-jerry';
import * as Progress from 'react-native-progress';

import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { withTheme } from '../../theme';
import I18n from '../../i18n';
import { BackArrow, Gallery } from '../../containers/Icon/Scaner';
import appNavigation from '../../lib/navigation/appNavigation';
import { separator } from '../ShareChannelView';
import { IApplicationState, IBaseScreen } from '../../definitions';

interface IScannerViewProps extends IBaseScreen<ChatsStackParamList, 'ScannerView'> {
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'ScannerView'>,
		StackNavigationProp<MasterDetailInsideStackParamList>
	>;

	route: RouteProp<ChatsStackParamList, 'ScannerView'>;
	user: string;
	enterprise: string;
	userId: string;
	matrixDomain: { org: string; matrixRemote: string };
}

interface IScannerViewState {
	viewState: string;
	showLoading: boolean;
	uri: string;
}

enum ViewState {
	SCANNER = 'scanner',
	LOADING = 'loading',
	SUCCESS = 'success',
	Expired = 'expired',
	FAIL = 'fail'
}

export enum ScannerResult {
	JOIN_FEDERATION = 'join_federation',
	HTTP = 'http'
}

const map = {
	// loading: require('../../static/images/success.png'),
	success: require('../../static/images/success.png'),
	fail: require('../../static/images/fail.png')
} as unknown as Map<string, any>;

class ScannerView extends React.Component<IScannerViewProps, IScannerViewState> {
	private scanner: any;

	constructor(props: IScannerViewProps) {
		super(props);
		this.state = {
			viewState: ViewState.SCANNER,
			uri: '',
			showLoading: false
		};
		this.scanner = React.createRef();
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: '扫一扫',
			headerTransparent: true,
			headerTitleStyle: { color: 'white' },
			headerLeft: () => (
				<TouchableOpacity
					onPress={() => {
						appNavigation.back();
					}}
					style={{ paddingHorizontal: 12 }}
				>
					<BackArrow />
				</TouchableOpacity>
			)
		});
	}

	onSuccess = (e: any) => {
		this.setState({
			viewState: e.data ? ViewState.SUCCESS : ViewState.FAIL,
			uri: e.data
		});
	};

	renderScannerResult = (data: string, type: string) => {
		const { navigation } = this.props;
		navigation.replace('ScannerResultView', { data, type });
	};

	renderSuccess = (uri: string | undefined) => {
		console.info('uri', uri);
		const data: string[] | undefined = uri?.split(separator);
		if (!data || data[0] === ScannerResult.JOIN_FEDERATION) {
			// @ts-ignore
			this.renderScannerResult(data[1], ScannerResult.JOIN_FEDERATION);
			setTimeout(() => {
				this.scanner?.reactivate();
			}, 2000);
			return this.renderScanner();
		}
		if (uri?.startsWith('https') || uri?.startsWith('http')) {
			this.renderScannerResult(uri, ScannerResult.HTTP);
		}
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<Text>{uri || '无法识别二维码'}</Text>
			</View>
		);
	};

	renderState = (state: string) => (
		<View style={styles.stateContainer}>
			<Image source={map.get(state)}></Image>
			<Text style={styles.text}>{I18n.t(state)}</Text>
		</View>
	);

	renderGallery = () => (
		<View style={styles.bottomContent}>
			<Touchable onPress={this.openGallery}>
				<View>
					<Gallery />
				</View>
			</Touchable>
		</View>
	);

	openGallery = () => {
		ImagePicker.openPicker({
			cropping: false,
			includeBase64: true
		}).then(r => r && this.recognize(r));
	};

	recognize = async (image: any) => {
		this.setState({
			showLoading: true
		});
		const path = image.path.replace('file:///', '/');
		console.info('image', path);
		await QRCodeReader.decode(path, (error: any, result: any) => {
			if (result) {
				this.setState({
					viewState: ViewState.SUCCESS,
					uri: result,
					showLoading: false
				});
			} else if (error) {
				this.setState({
					viewState: ViewState.SUCCESS,
					uri: error,
					showLoading: false
				});
			}
		});
	};

	renderLoading = () => (
		<View style={styles.loadingContainer}>
			<Progress.Circle size={60} borderWidth={5} indeterminate={true} style={styles.loading} />
		</View>
	);

	renderScanner = () => {
		const { showLoading } = this.state;
		return (
			<View style={{ flex: 1, alignItems: 'center' }}>
				<QRCodeScanner
					ref={(r: any) => {
						this.scanner = r;
					}}
					onRead={this.onSuccess}
					showMarker={true}
					customMarker={this.renderCustomMarker()}
					flashMode={RNCamera.Constants.FlashMode.auto}
					cameraStyle={styles.camera}
				/>
				{this.renderGallery()}
				{showLoading && this.renderLoading()}
			</View>
		);
	};

	renderCustomMarker = () => (
		<View style={styles.customMarkerContainer}>
			<View style={styles.customMarker}>
				<View style={styles.topLeftCorner} />
				<View style={styles.topRightCorner} />
				<View style={styles.bottomLeftCorner} />
				<View style={styles.bottomRightCorner} />
			</View>
		</View>
	);

	showView = (viewState: string, uri?: string) => {
		switch (viewState) {
			case ViewState.SCANNER:
				return this.renderScanner();
			case ViewState.SUCCESS:
				return this.renderSuccess(uri);
			default:
				return this.renderState(viewState);
		}
	};

	render() {
		const { viewState, uri } = this.state;
		return <View style={styles.parent}>{this.showView(viewState, uri)}</View>;
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: state.login.user.username || state.login.user.name,
	userId: state.login.user.id,
	enterprise: state.settings.Enterprise_ID,
	matrixDomain: JSON.parse((state.settings.Org_Matrix_Domain as string) || '[]').find(
		(item: any) => item.org.toLowerCase() === (state.settings.Enterprise_ID as string).toLowerCase()
	)
});

// @ts-ignore
export default connect(mapStateToProps)(withTheme(ScannerView));
