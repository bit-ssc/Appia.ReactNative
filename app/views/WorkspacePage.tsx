import React from 'react';
import { Text, View, StyleSheet, Image, ScrollView, TouchableOpacity, RefreshControl, PermissionsAndroid } from 'react-native';
import { connect } from 'react-redux';
import { StackNavigationOptions } from '@react-navigation/stack';
import Geolocation from '@react-native-community/geolocation';

import { IApplicationState, IBaseScreen, IWorkSpaceGroup, IWorkspaceItem } from '../definitions';
import { WorkspaceStackParamList } from '../stacks/types';
import { themes } from '../lib/constants';
import { Services } from '../lib/services';
import { withTheme } from '../theme';
import { getWorkspace } from '../actions/workspace';
import ActivityIndicator from '../containers/ActivityIndicator';
import { PHASE } from '../reducers/workspace';
import I18n from '../i18n';
import Navigation from '../lib/navigation/appNavigation';
import { isAndroid } from '../utils/deviceInfo';
import { openWebview } from '../utils/openLink';
import ListIcon from '../containers/Icon/List';
import { toggleCompanies } from '../actions/company';
import { getFanweiHeaderToken } from '../lib/services/restApi';
import UserPreferences from '../lib/methods/userPreferences';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// backgroundColor: '#FAFAFA'
		marginBottom: 12
	},
	groupBox: {
		margin: 12,
		marginBottom: 0,
		backgroundColor: '#ffffff'
	},
	groupTitle: {
		padding: 16,
		paddingLeft: 10,
		fontSize: 14,
		color: 'rgba(0, 0, 0, 0.6)'
	},
	list: {
		// flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	item: {
		width: '33.33%',
		alignItems: 'center',
		borderColor: '#E7E7E7',
		borderTopWidth: 1,
		paddingTop: 20,
		paddingBottom: 20
	},
	splitItem: {
		borderLeftWidth: 1
	},
	itemName: {
		alignSelf: 'center',
		marginTop: 12,
		fontSize: 14,
		color: '#000000'
	},
	itemIcon: {
		width: 40,
		height: 40,
		alignSelf: 'center',
		borderRadius: 8
	},
	loadError: {
		flex: 1,
		marginTop: 200,
		alignContent: 'center',
		justifyContent: 'center'
	},
	loadText: {
		textAlign: 'center',
		fontSize: 16
	}
});

interface IWorkspaceViewProps extends IBaseScreen<WorkspaceStackParamList, 'Workspace'> {
	phase: PHASE;
	loaded: boolean;
	groups: IWorkSpaceGroup[];
	server: string;
	toggle: boolean;
}

interface IWorkspaceViewState {
	refreshing: boolean;
}

class WorkspacePage extends React.Component<IWorkspaceViewProps, IWorkspaceViewState> {
	constructor(props: IWorkspaceViewProps) {
		super(props);
		this.state = {
			refreshing: false
		};
	}

	componentDidMount() {
		this.getData(true);
		this.setHeader();
		const { navigation } = this.props;
		navigation.addListener('focus', () => {
			this.requestFanweiHeaderToken();
		});
	}

	requestFanweiHeaderToken = async () => {
		const preTime = UserPreferences.getString('fwTokenTime');
		if (new Date().getTime() - Number(preTime) > 1500000 || !UserPreferences.getString('fwToken')) {
			try {
				const token = await getFanweiHeaderToken();
				console.info('fwToken1', token);
				UserPreferences.setString('fwToken', token);
				UserPreferences.setString('fwTokenTime', `${new Date().getTime()}`);
			} catch (error) {
				console.info('error', error);
			}
		}
	};

	toggle = () => {
		this.props.dispatch(toggleCompanies(!this.props.toggle));
	};

	setHeader = () => {
		const { navigation } = this.props;
		const options = {
			headerTitleAlign: 'center',
			headerLeft: () => (
				<TouchableOpacity onPress={this.toggle} style={{ paddingHorizontal: 12 }}>
					<ListIcon />
				</TouchableOpacity>
			),
			title: I18n.t('Workspace')
		} as Partial<StackNavigationOptions>;
		navigation.setOptions(options);
	};

	getData = async (force = false) => {
		const { dispatch, server } = this.props;
		await new Promise((resolve, reject) =>
			dispatch(
				getWorkspace(
					{
						force,
						server
					},
					{
						resolve: resolve as () => void,
						reject
					}
				)
			)
		);
	};

	onRefresh = () => {
		this.setState({ refreshing: true });
		this.getData(true);
		this.setState({ refreshing: false });
	};

	// 跳转到员工服务对话窗
	directService = async (item: IWorkspaceItem) => {
		const name = item.extra?.name;
		const result = await Services.createDirectMessage(name);
		if (result.success) {
			const { room } = result;
			const params = {
				rid: room.rid,
				t: room.t,
				name: item.name,
				roomUserId: name
			};

			Navigation.navigate('RoomView', params);
		}
	};

	locationPermission = async () => {
		if (isAndroid) {
			const permissions = [
				PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
				PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
			];

			if (
				!(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) ||
				!(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION))
			) {
				PermissionsAndroid.requestMultiple(permissions).then(res => {
					if (
						res['android.permission.ACCESS_COARSE_LOCATION'] !== 'granted' ||
						res['android.permission.ACCESS_FINE_LOCATION'] !== 'granted'
					) {
						alert('没有定位权限，请前往 手机-设置-应用权限 中开启');
					}
				});
			}
		} else {
			// ios permission
			Geolocation.requestAuthorization();
		}
	};

	handleWebview = (item: IWorkspaceItem) => {
		if (item.name === '企业滴滴') {
			this.locationPermission().then(() => {
				this.directWebView(item);
			});
			return;
		}

		if (item.name === '云盘' || item.name === '云文档') {
			this.directCloudDocView();
			return;
		}

		if (item.name === '消息待办' || item.type === 10) {
			this.directAllTodoView();
			return;
		}
		this.directWebView(item);
	};

	// WebView打开页面
	directWebView = (item: IWorkspaceItem) => {
		if (!item.url || item.url.length === 0) {
			const { server } = this.props;
			item.url = `${server}/appia_fe/nonsupport`;
		}
		const params = {
			title: item.name,
			needAuth: item.need_auth,
			source: item.extra?.source,
			urlType: item.url_type
		};
		openWebview(item.url, params, this.props.theme);
	};

	directCloudDocView = () => {
		Navigation.navigate('CloudStorageView');
	};

	directAllTodoView = () => {
		Navigation.navigate('TodoListView', {});
	};

	onPress = (item: IWorkspaceItem) => {
		if (item.type === 3) {
			this.directService(item);
		} else {
			this.handleWebview(item);
		}
	};

	renderContent = () => {
		const { phase, loaded, theme, groups } = this.props;

		if (loaded) {
			return (
				<View style={styles.container}>
					{groups.map(group => (
						<View style={styles.groupBox}>
							<Text style={styles.groupTitle}>{group.name}</Text>
							<View style={styles.list}>
								{group.items.map((item, index) => (
									<View style={[styles.item, index % 3 !== 0 && styles.splitItem]}>
										<TouchableOpacity onPress={() => this.onPress(item)}>
											<Image style={styles.itemIcon} source={{ uri: item.icon }} />
											<Text style={styles.itemName}>{item.name}</Text>
										</TouchableOpacity>
									</View>
								))}
								{group.items.length % 3 > 0 && <View style={[styles.item, styles.splitItem]}></View>}
								{group.items.length % 3 === 1 && <View style={[styles.item, styles.splitItem]}></View>}
							</View>
						</View>
					))}
				</View>
			);
		}

		if (phase === PHASE.LOADING) {
			return <ActivityIndicator />;
		}

		return (
			<View style={styles.loadError}>
				<Text style={[styles.loadText, { color: themes[theme].titleText }]}>加载失败...</Text>
			</View>
		);
	};

	render() {
		// const { phase } = this.props;
		return (
			<ScrollView
				refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />}
				testID='workspace-view'
				style={{ backgroundColor: '#FAFAFA' }}
			>
				{this.renderContent()}
			</ScrollView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	phase: state.workspace.phase,
	loaded: !!state.workspace.groups.length,
	groups: state.workspace.groups,
	server: state.server.server,
	toggle: state.company.toggle
});

export default connect(mapStateToProps)(withTheme(WorkspacePage));
