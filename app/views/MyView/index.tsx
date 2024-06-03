import React, { Component } from 'react';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import { Image, ScrollView, Text, View } from 'react-native';

import Touch from '../../utils/touch';
import Avatar from '../../containers/Avatar';
import { events, logEvent } from '../../utils/log';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import Navigation from '../../lib/navigation/appNavigation';
import SidebarItem from './SidebarItem';
import styles from './styles';
import { IApplicationState, IUser, SubscriptionType, IBaseScreen } from '../../definitions';
import * as List from '../../containers/List';
import { COMPANY_NAME } from '../../lib/constants/contacts';
import StatusBar from '../../containers/StatusBar';
import { CustomIcon } from '../../containers/CustomIcon';
import Status from '../../containers/Status/Status';
import { BackButton } from '../../containers/HeaderButton';
import { ChatsStackParamList } from '../../stacks/types';

interface ISidebarState {
	showStatus: boolean;
}

interface ISidebarProps extends IBaseScreen<ChatsStackParamList, 'MyView'> {
	baseUrl: string;
	user: IUser;
	theme: TSupportedThemes;
	loadingServer: boolean;
	useRealName: boolean;
	allowStatusMessage: boolean;
	isMasterDetail: boolean;
	viewStatisticsPermission: string[];
	viewRoomAdministrationPermission: string[];
	viewUserAdministrationPermission: string[];
	viewPrivilegedSettingPermission: string[];
	enterpriseName: string;
}

class MyView extends Component<ISidebarProps, ISidebarState> {
	constructor(props: ISidebarProps) {
		super(props);
		this.state = {
			showStatus: false
		};
	}

	static navigationOptions = ({ navigation }: ISidebarProps) => ({
		headerTitleAlign: 'center',
		title: I18n.t('Me'),
		headerLeft: () => <BackButton navigation={navigation} />
	});

	shouldComponentUpdate(nextProps: ISidebarProps, nextState: ISidebarState) {
		const { showStatus } = this.state;
		const {
			user,
			baseUrl,
			isMasterDetail,
			useRealName,
			theme,
			viewStatisticsPermission,
			viewRoomAdministrationPermission,
			viewUserAdministrationPermission,
			viewPrivilegedSettingPermission
		} = this.props;
		if (nextState.showStatus !== showStatus) {
			return true;
		}
		if (nextProps.baseUrl !== baseUrl) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!dequal(nextProps.user, user)) {
			return true;
		}
		if (nextProps.isMasterDetail !== isMasterDetail) {
			return true;
		}
		if (nextProps.useRealName !== useRealName) {
			return true;
		}
		if (!dequal(nextProps.viewStatisticsPermission, viewStatisticsPermission)) {
			return true;
		}
		if (!dequal(nextProps.viewRoomAdministrationPermission, viewRoomAdministrationPermission)) {
			return true;
		}
		if (!dequal(nextProps.viewUserAdministrationPermission, viewUserAdministrationPermission)) {
			return true;
		}
		if (!dequal(nextProps.viewPrivilegedSettingPermission, viewPrivilegedSettingPermission)) {
			return true;
		}
		return false;
	}

	sidebarNavigate = (route: string) => {
		// @ts-ignore
		logEvent(events[`SIDEBAR_GO_${route.replace('StackNavigator', '').replace('View', '').toUpperCase()}`]);
		Navigation.navigate(route);
	};

	navigate = () => {
		const { user } = this.props;
		Navigation.navigate('RoomInfoView', {
			rid: user.username,
			t: SubscriptionType.DIRECT
		});
	};

	navigateZxing = () => {
		const { user } = this.props;
		Navigation.navigate('MyCardView', {
			rid: user.username
		});
	};

	renderNavigation = () => {
		const { theme } = this.props;
		return (
			<>
				<SidebarItem
					text={I18n.t('UserInfo')}
					left={<Image source={require('../../static/images/contacts/profile.png')} style={styles.leftImage} />}
					right={<CustomIcon name='chevron-right' size={20} color={themes[theme].auxiliaryText} />}
					onPress={this.navigate}
					testID='sidebar-profile'
					theme={theme}
				/>
				{this.renderSeparator()}
				<SidebarItem
					text={I18n.t('Settings')}
					left={<Image source={require('../../static/images/contacts/settings.png')} style={styles.leftImage} />}
					right={<CustomIcon name='chevron-right' size={20} color={themes[theme].auxiliaryText} />}
					onPress={() => this.sidebarNavigate('SettingsStackNavigator')}
					testID='sidebar-settings'
					theme={theme}
				/>
				{this.renderSeparator()}
			</>
		);
	};

	renderCustomStatus = () => {
		const { user, theme } = this.props;
		return (
			<SidebarItem
				text={user.statusText || I18n.t('Edit_Status')}
				left={
					<Status
						size={24}
						status={user?.status}
						style={[
							styles.leftImage,
							{
								paddingTop: 7,
								paddingLeft: 7
							}
						]}
					/>
				}
				theme={theme}
				right={<CustomIcon name='edit' size={20} color={themes[theme].auxiliaryText} />}
				style={{ marginBottom: 12 }}
				onPress={() => this.sidebarNavigate('StatusView')}
				testID='sidebar-custom-status'
			/>
		);
	};

	renderSeparator = () => <List.Separator />;

	render() {
		const { user, useRealName, theme, enterpriseName } = this.props;

		if (!user) {
			return null;
		}

		return (
			<SafeAreaView>
				<StatusBar />
				<ScrollView style={[styles.container]} {...scrollPersistTaps}>
					<View style={[styles.headerWrapper, styles.shadow, { backgroundColor: themes[theme].backgroundColor }]}>
						<Touch theme={theme} onPress={() => this.sidebarNavigate('ProfileStackNavigator')} style={[styles.header]}>
							<Avatar text={user.username} style={styles.avatar} size={60} />

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
						</Touch>

						<View style={[styles.line]}></View>

						<Touch theme={theme} onPress={this.navigateZxing} style={[styles.userCard]}>
							<Text numberOfLines={1} style={[styles.userCardText]}>
								{I18n.t('employee_business_card')}
							</Text>
							<View style={[styles.userCardIcon]}>
								<Image source={require('../../static/images/contacts/card.png')} />
								<CustomIcon name='chevron-right' size={20} color={themes[theme].auxiliaryText} />
							</View>
						</Touch>
					</View>

					{this.renderCustomStatus()}
					{this.renderNavigation()}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	baseUrl: state.server.server,
	loadingServer: state.server.loading,
	enterpriseName: state.settings.Enterprise_Name || COMPANY_NAME,
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	allowStatusMessage: state.settings.Accounts_AllowUserStatusMessageChange as boolean,
	isMasterDetail: state.app.isMasterDetail,
	viewStatisticsPermission: state.permissions['view-statistics'] as string[],
	viewRoomAdministrationPermission: state.permissions['view-room-administration'] as string[],
	viewUserAdministrationPermission: state.permissions['view-user-administration'] as string[],
	viewPrivilegedSettingPermission: state.permissions['view-privileged-setting'] as string[]
});

// @ts-ignore
export default connect(mapStateToProps)(withTheme(MyView));
