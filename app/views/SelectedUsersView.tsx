import { Q } from '@nozbe/watermelondb';
import orderBy from 'lodash/orderBy';
import React from 'react';
import { FlatList, View, Text, TouchableOpacity, Pressable, ScrollView, TextInput, Dimensions, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';
import ScrollableTabView from 'react-native-scrollable-tab-view';

import { addUser, removeUser, reset, addUsers, removeUsers, setLoading } from '../actions/selectedUsers';
import { themes } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import Avatar from '../containers/Avatar';
import { sendLoadingEvent } from '../containers/Loading';
import SafeAreaView from '../containers/SafeAreaView';
// import SearchBox from '../containers/SearchBox';
import StatusBar from '../containers/StatusBar';
import Button from '../containers/Button';
import Organization from '../containers/Organization';
import { IApplicationState, IBaseScreen, IDepartment, ISubscription, IUser, IUserSummary, TUserModel } from '../definitions';
import I18n from '../i18n';
import database from '../lib/database';
import UserItem, { styles } from '../containers/Organization/UserItem';
import { ISelectedUser } from '../reducers/selectedUsers';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';
import { showErrorAlert } from '../utils/info';
import log, { events, logEvent } from '../utils/log';
import { isIOS } from '../utils/deviceInfo';
import sharedStyles from './Styles';
import { isGroupChat, getRoomAvatar, TSearch, searchDebounce } from '../lib/methods';
import CustomTabBar from '../containers/CustomTabBar';
import { CustomIcon } from '../containers/CustomIcon';
import { showToast } from '../lib/methods/helpers/showToast';
import TimeDrawer from './ShareChannelView/component/TimeDrawer';
import FederationQR from './ShareChannelView/component/FederationQR';
import GroupIcon from '../containers/Icon/GroupIcon';
import { Services } from '../lib/services';

// const ITEM_WIDTH = 250;
// const getItemLayout = (_: any, index: number) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index });

const SHOW_CHANGE_TIPS = 1;
const SHOW_QRCODE = 2;

interface ISelectedUsersViewProps extends IBaseScreen<ChatsStackParamList, 'SelectedUsersView'> {
	users: ISelectedUser[];
	loading: boolean;
	user: IUser;
	baseUrl: string;
	userMap: Record<string, IUserSummary>;
}
interface ISelectedUsersViewState {
	showOrg: boolean;
	maxUsers?: number;
	search: TSearch[];
	chats: ISelectedUser[];
	searchText: string;
	orgHistory: IDepartment[];
	showSearchBox: boolean;
	// selectedType: number;
	isChooseAll: boolean;
	showDrawer: boolean;
	expire: number;
	timeStr: string;
	federationState: number;
}

class SelectedUsersView extends React.Component<ISelectedUsersViewProps, ISelectedUsersViewState> {
	private flatlist?: FlatList;
	private querySubscription?: Subscription;
	private orgRef: any;
	private textInputRef: any;
	private fromCreatGroup?: boolean;
	private groupUsers?: TUserModel[];
	private groupUserIds?: string[];
	private existSelectedUsers?: ISelectedUser[];
	private onlyChooseOne?: boolean;
	private room?: ISubscription;
	private isManager: boolean | undefined;
	private isLocal: boolean | undefined;
	private fromRoomView: boolean | undefined;
	private fromScanQRCode: boolean | undefined;

	constructor(props: ISelectedUsersViewProps) {
		super(props);
		this.init();
		this.props.dispatch(reset());
		const maxUsers = props.route.params?.maxUsers;
		const lastSelected = props.route.params?.lastSelected;
		this.fromCreatGroup = props.route.params?.fromCreatGroup ?? false;
		this.fromRoomView = props.route.params?.fromRoomView;
		this.groupUsers = props.route.params?.groupUsers;
		this.groupUserIds = this.groupUsers?.map(a => a._id);
		this.onlyChooseOne = props.route.params.chooseOnlyOne;
		this.room = props.route.params?.room;
		this.isManager = props.route.params?.isManager;
		this.isLocal = props.route.params?.isLocal;
		this.fromScanQRCode = props.route.params?.fromScanQRCode;

		this.state = {
			searchText: '',
			showOrg: false,
			maxUsers,
			search: [],
			chats: [],
			orgHistory: [],
			showSearchBox: false,
			isChooseAll: false,
			// selectedType: 0
			showDrawer: false,
			expire: -1,
			timeStr: I18n.t('Forever_Valid'),
			federationState: SHOW_CHANGE_TIPS
		};
		// this.setHeader(props.route.params?.showButton);
		this.setHeader();
		const { user, dispatch, route, users } = this.props;
		if (this.fromCreatGroup) {
			if (users.length > 0 && users[0].userId !== user.id) {
				dispatch(removeUser(users[0])); // TODO:没有解决根本问题，切换账号后还是有上一个账号的痕迹
			}
		} else {
			const existUsers: ISelectedUser[] = [];
			this.groupUsers?.forEach(item => {
				existUsers.push({
					t: 'd',
					_id: item._id,
					isUser: true,
					userId: item._id,
					fname: item.name || '',
					name: item.username,
					username: item.username
				});
			});
			this.existSelectedUsers = existUsers;
		}

		const me = { _id: user.id, userId: user.id, rid: user.rid, name: user.username, fname: user.name as string };
		const meIndex = users.findIndex(el => (me.userId ? el.userId === me.userId : el.rid === me.rid));
		if (route.params?.includeMe && meIndex === -1) {
			dispatch(addUser(me));
			props.users.push(me);
		} else if (!route.params?.includeMe && meIndex > -1) {
			dispatch(removeUser(me));
			props.users.splice(meIndex, 1);
		}

		if (lastSelected && lastSelected.length > 0) {
			dispatch(addUsers(lastSelected));
		}
	}

	fetchAllMembers = async () => {
		const { dispatch } = this.props;
		dispatch(setLoading(true));
		try {
			this.groupUsers = await Services.getRoomMembers({
				rid: this.room?.rid ?? '',
				roomType: this.room?.t ?? '',
				type: 'all',
				filter: '',
				skip: 0,
				limit: 0,
				allUsers: true
			});
			dispatch(setLoading(false));
			const existUsers: ISelectedUser[] = [];
			this.groupUsers?.forEach(item => {
				existUsers.push({
					t: 'd',
					_id: item._id,
					isUser: true,
					userId: item._id,
					fname: item.name || '',
					name: item.username,
					username: item.username
				});
			});
			this.existSelectedUsers = existUsers;
		} catch (e) {
			dispatch(setLoading(false));

			log(e);
		}
	};
	async componentDidMount() {
		if (this.fromRoomView && !this.groupUsers) {
			await this.fetchAllMembers();
		}
	}

	componentDidUpdate(prevProps: ISelectedUsersViewProps) {
		const { loading, users } = this.props;

		if (loading !== prevProps.loading) {
			sendLoadingEvent({ visible: loading });
		}

		if (users !== prevProps.users) {
			this.setHeader();
		}
	}

	componentWillUnmount() {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}

	onConfirm = () => {
		const { users, route, navigation } = this.props;
		// const { selectedType } = this.state;
		const minUsers = route.params?.minUsers || 0;
		const nextAction = route.params?.nextAction;
		if (users.length < minUsers) {
			showToast(`最少选中${minUsers}人`);
		}
		if (users.length >= minUsers && nextAction) {
			if (this.fromCreatGroup) {
				nextAction(this.state.isChooseAll);
				return;
			}
			nextAction(navigation, users);
		}
	};

	onBackPress = () => {
		const { showOrg } = this.state;
		if (!showOrg || !this.orgRef?.goPrev()) {
			const { navigation } = this.props;
			navigation?.pop();
		}
	};

	// showButton can be sent as route params or updated by the component
	setHeader = (title?: string) => {
		const { navigation, route, users } = this.props;
		// const { showSearchBox } = this.state;
		const buttonText = route.params?.buttonText ?? I18n.t('Next');
		title = title || route.params?.title || I18n.t('Select_Users');
		// const buttonText = route.params?.buttonText ?? I18n.t('Next');
		// const maxUsers = route.params?.maxUsers;
		// const nextAction = route.params?.nextAction ?? (() => {});
		const options = {
			title,
			headerLeft: () => <HeaderButton.BackButton onPress={this.onBackPress} />,
			headerRight: () =>
				this.onlyChooseOne ? null : (
					<View style={sharedStyles.confirmButtonBox}>
						<Button style={sharedStyles.confirmButton} title={`${buttonText}(${users.length})`} onPress={this.onConfirm}></Button>
					</View>
				)
		};
		navigation.setOptions(options);
	};

	searchBtnClick = () => {
		this.setState(
			{
				showSearchBox: true
			},
			() => {
				this.setHeader();
			}
		);
	};

	// eslint-disable-next-line react/sort-comp
	init = async () => {
		const { route } = this.props;
		try {
			const db = database.active;
			const whereClause = route.params?.hasRooms
				? [Q.where('archived', false), Q.where('open', true)]
				: [Q.where('t', 'd'), Q.where('bot', Q.notEq(true))];
			const observable = await db
				.get('subscriptions')
				.query(...whereClause)
				.observeWithColumns(['room_updated_at']);

			this.querySubscription = observable.subscribe(data => {
				const chats = orderBy(data, ['roomUpdatedAt'], ['desc']) as ISelectedUser[];

				this.setState({
					chats
				});
			});
		} catch (e) {
			log(e);
		}
	};

	onSearchChangeText(text: string) {
		this.setState({ searchText: text });
		this.handleSearch(text);
	}

	handleSearch = async (text: string) => {
		const { route } = this.props;
		// const result = await search({ text, filterRooms: !!route.params?.hasRooms });
		// console.log(!!route.params?.hasRooms, '!!route.params?.hasRooms!!route.params?.hasRooms');
		const res = await searchDebounce({ text, filterRooms: !!route.params?.hasRooms });
		// console.log(res, 'first')
		this.setState({ search: res.filter(item => !item.name?.includes(':') && (item.appiaDisplay || item.t !== 'd')) });
	};

	isGroupChat = () => {
		const { maxUsers } = this.state;
		return maxUsers && maxUsers > 2;
	};

	isChecked = (item: ISelectedUser) => {
		const { users } = this.props;
		const result = this.existSelectedUsers?.concat(users) || [];
		return (
			result.findIndex(
				el =>
					el.username === item.name ||
					el.name === item.name ||
					el.userId === item.userId ||
					el._id === item.userId ||
					el.userId === item._id ||
					el._id === item._id
			) !== -1
		);
	};

	isNewGroupChecked = (item: ISelectedUser) => {
		const { users } = this.props;
		return (
			users.findIndex(
				el =>
					el.username === item.name ||
					el.name === item.name ||
					el.userId === item.userId ||
					el._id === item.userId ||
					el.userId === item._id ||
					el._id === item._id
			) !== -1
		);
	};

	toggleUser = (user: ISelectedUser) => {
		const { maxUsers } = this.state;
		const {
			dispatch,
			users,
			user: { username }
		} = this.props;

		// Disallow removing self user from the direct message group
		if (this.isGroupChat() && username === user.name) {
			return;
		}
		const isContain = this.fromCreatGroup ? this.isNewGroupChecked(user) : this.isChecked(user);
		if (!isContain) {
			// if (this.isGroupChat() && users.length === maxUsers) {
			if (maxUsers && users.length >= maxUsers) {
				return showErrorAlert(I18n.t('Max_number_of_users_allowed_is_number', { maxUsers }), I18n.t('Oops'));
			}
			logEvent(events.SELECTED_USERS_ADD_USER);
			dispatch(addUser(user));
		} else {
			logEvent(events.SELECTED_USERS_REMOVE_USER);
			dispatch(removeUser(user));
		}
	};

	_onPressItem = (id: string, item = {} as ISelectedUser) => {
		const { dispatch, route } = this.props;
		if (this.onlyChooseOne) {
			dispatch(reset());
			dispatch(
				addUser({
					_id: item._id,
					isUser: item?.isUser,
					name: item.search ? (item.username as string) : item.name,
					fname: item.search ? item.name : item.fname,
					t: item.t,
					prid: item.prid,
					uids: item.uids,
					usernames: item.usernames
				})
			);
			setTimeout(() => {
				route.params.nextAction && route.params.nextAction();
			}, 100);
			return;
		}
		const { user } = this.props;
		this.toggleUser({
			_id: item._id,
			isUser: item?.isUser,
			rid: item.rid,
			name: item.search ? (item.username as string) : item.name,
			fname: item.search ? item.name : item.fname,
			t: item.t,
			userId: (item.t === 'd' && item.uids?.length ? item.uids?.find(id => id !== user.id) : item._id) || user.id,
			prid: item.prid,
			uids: item.uids,
			usernames: item.usernames
		});

		const { searchText } = this.state;
		if (searchText) {
			this.textInputRef.clear();
			this.onSearchChangeText('');
		}
	};

	_onPressSelectedItem = (item: ISelectedUser) => this.toggleUser(item);

	onOrgChecked = (userList: IUserSummary[], checked: boolean) => {
		const { dispatch, users, route, user } = this.props;
		const { maxUsers } = this.state;
		const result: ISelectedUser[] = [];
		userList.forEach(item => {
			if (
				route.params?.includeMe &&
				(user.username === item.name ||
					user.name === item.name ||
					user.name === item.username ||
					user.username === item.username ||
					user._id === item._id)
			) {
				return;
			}
			const index = users.findIndex(
				a =>
					a.username === item.name ||
					a.name === item.name ||
					a.name === item.username ||
					a.username === item.username ||
					a._id === item._id
			);
			if ((checked && index === -1) || (!checked && index > -1)) {
				result.push({
					t: 'd',
					_id: item._id,
					isUser: true,
					userId: item._id,
					fname: item.name,
					name: item.username,
					username: item.username
				} as ISelectedUser);
			}
		});

		if (checked) {
			if (maxUsers && users.length + result.length > maxUsers) {
				return showErrorAlert(I18n.t('Max_number_of_users_allowed_is_number', { maxUsers }), I18n.t('Oops'));
			}
			dispatch(addUsers(result));
		} else {
			dispatch(removeUsers(result));
		}
	};

	// toggleOrgList = () => {
	// 	const { selectedType } = this.state;
	// 	Navigation.navigate('SelectGroupTypeView', {
	// 		selectedType,
	// 		nextAction: (index: number) => {
	// 			this.setState({ selectedType: index });
	// 		}
	// 	});
	// };

	cancelSearch = () => {
		this.setState(
			{
				searchText: '',
				showSearchBox: false
			},
			() => {
				this.setHeader();
			}
		);
	};

	renderHeader = () => {
		const { theme, users } = this.props;
		// const { searchText, showSearchBox } = this.state;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor, flexDirection: 'row', borderRadius: 8, minHeight: 40 }}>
				{this.onlyChooseOne ? null : this.renderSelected()}
				<TextInput
					keyboardType='default'
					onChangeText={(text: string) => {
						this.onSearchChangeText(text);
					}}
					style={{ minWidth: 100, flex: 1, marginStart: users.length === 0 ? 16 : 5 }}
					placeholder={'搜索'}
					ref={ref => (this.textInputRef = ref)}
				/>
			</View>
		);
	};

	renderBreadcrumbs = () =>
		this.state.orgHistory.map((org: IDepartment, index: number) => (
			<View style={{ flexDirection: 'row', marginTop: 8 }}>
				<Text> / </Text>
				<TouchableOpacity onPress={() => this.orgRef?.jump(org._id)}>
					<Text style={index + 1 === this.state.orgHistory.length ? sharedStyles.tableTitleActive : sharedStyles.tableTitleText}>
						{org.name}
					</Text>
				</TouchableOpacity>
			</View>
		));

	setFlatListRef = (ref: FlatList) => (this.flatlist = ref);

	onContentSizeChange = () => this.flatlist?.scrollToEnd({ animated: true });

	setOrgHistory = (orgHistory: IDepartment[]) => this.setState({ orgHistory });

	renderSelected = () => {
		const { users, theme, route } = this.props;
		// const { searchText } = this.state
		// const buttonText = route.params?.buttonText ?? I18n.t('Next');
		this.setHeader();

		if (users.length === 0) {
			return null;
		}
		const maxUsers = route.params?.maxUsers;
		const showButton = route.params?.showButton;
		if (!showButton && maxUsers && users.length === 0) {
			return null;
		}

		return (
			<View style={sharedStyles.footerBox}>
				<FlatList
					data={users}
					ref={this.setFlatListRef}
					onContentSizeChange={this.onContentSizeChange}
					// getItemLayout={getItemLayout}
					keyExtractor={item => item._id}
					style={{ borderColor: themes[theme].separatorColor, flex: 0 }}
					contentContainerStyle={{ marginTop: 5, marginBottom: 10, height: 55, marginLeft: 20, paddingRight: 10, flex: 0 }}
					renderItem={this.renderSelectedItem}
					keyboardShouldPersistTaps='always'
					horizontal
				/>
				{/* <View style={sharedStyles.confirmButtonBox}>*/}
				{/* 	<Button style={sharedStyles.confirmButton} title={`${buttonText}(${users.length})`} onPress={this.onConfirm}></Button>*/}
				{/* </View>*/}
			</View>
		);
	};

	renderSelectedItem = ({ item }: { item: ISelectedUser; index: number }) => {
		const { theme, route, user } = this.props;
		const avatar = item.rid ? getRoomAvatar(item) : item.name;
		let disabled = true;
		if (this.fromCreatGroup) {
			disabled =
				route.params?.includeMe &&
				(user.username === item.name || user.name === item.name || user._id === item.userId || user._id === item._id);
		} else {
			const index = this.existSelectedUsers?.findIndex(
				el =>
					el.username === item.name ||
					el.name === item.name ||
					el.userId === item.userId ||
					el._id === item.userId ||
					el.userId === item._id ||
					el._id === item._id
			);
			disabled = index !== -1;
		}
		return (
			<Pressable
				onPress={() => !disabled && this._onPressSelectedItem(item)}
				testID={`selected-user-${item.name}`}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }: any) => ({
					backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
				})}
			>
				<View style={{ paddingRight: 15 }}>
					<Avatar text={avatar || item.name} rid={item.rid} type={item.t} size={36} style={{ marginVertical: 12 }} />
				</View>
			</Pressable>
		);
	};

	renderItem = ({ item, index }: { item: ISelectedUser; index: number }) => {
		const { search, chats } = this.state;
		const { theme, user, route } = this.props;

		item.userId = (item.t === 'd' && item.uids?.length ? item.uids?.find(id => id !== user.id) : item._id) || user.id;
		// const name = item.search ? item.name : item.fname;
		const name = item.fname || item.dname || item.name;
		const username = item.search ? (item.username as string) : item.name;
		let style = { borderColor: themes[theme].separatorColor };
		if (index === 0) {
			// style = { ...style, ...sharedStyles.separatorTop };
			style = { ...style };
		}
		if (search.length > 0 && index === search.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (search.length === 0 && index === chats.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		let disabled: false | undefined | boolean = true;
		if (this.fromCreatGroup) {
			disabled =
				route.params?.includeMe &&
				(user.username === item.name || user.name === item.name || user._id === item.userId || user._id === item._id);
		} else {
			const index = this.existSelectedUsers?.findIndex(
				el =>
					el.username === item.name ||
					el.name === item.name ||
					el.userId === item.userId ||
					el._id === item.userId ||
					el.userId === item._id ||
					el._id === item._id
			);
			disabled = index !== -1;
		}
		return (
			<UserItem
				id={item.userId}
				name={name}
				username={username}
				rid={item.rid}
				type={item.t}
				avatar={item.rid ? getRoomAvatar(item) : item.name}
				avatarSize={40}
				onPress={() => this._onPressItem(item._id, item)}
				testID={`select-users-view-item-${item.name}`}
				checked={this.fromCreatGroup ? this.isNewGroupChecked(item) : this.isChecked(item)}
				hasCheckbox={!this.onlyChooseOne}
				disabled={disabled}
				style={style}
				theme={theme}
			/>
		);
	};

	renderList = () => {
		const { searchText } = this.state;
		const { theme, users, user } = this.props;
		let selectUsers = users.filter(a => a.userId);
		if (!this.fromCreatGroup) {
			selectUsers = this.existSelectedUsers?.concat(selectUsers) || [];
		}

		// filter DM between multiple users
		return !searchText ? (
			<ScrollableTabView
				// style={styles.container}
				// renderTabBar={() => <DefaultTabBar style={{ height: 40, marginTop: 8 }} />}
				renderTabBar={() => <CustomTabBar tabStyle={{ flex: 1 }} theme={'black'}></CustomTabBar>}
				tabBarBackgroundColor='#fff'
				tabBarActiveTextColor='#2878ff'
				tabBarInactiveTextColor='black'
				tabBarUnderlineStyle={{ backgroundColor: '#2878ff' }}
			>
				<View style={{ flex: 1 }} tabLabel={I18n.t('Recent_Contacts')}>
					{this.renderListView()}
				</View>
				{this.onlyChooseOne ? null : (
					<View style={{ flex: 1 }} tabLabel={I18n.t('Company_Contacts')}>
						<ScrollView
							horizontal={true}
							showsHorizontalScrollIndicator={false}
							style={{ flexDirection: 'row', maxHeight: 40, minHeight: 50 }}
						>
							<Text style={[sharedStyles.tableTitleText, { marginLeft: 10, marginTop: 8 }]}>{I18n.t('Company_Contacts')}</Text>
							{this.renderBreadcrumbs()}
						</ScrollView>
						<Organization
							onRef={ref => (this.orgRef = ref)}
							theme={theme}
							onPress={this.onOrgChecked}
							selectedUsers={selectUsers}
							setPageTitle={this.setHeader}
							setOrgHistory={this.setOrgHistory}
							disabledUsers={this.fromCreatGroup ? [user] : this.groupUsers}
						/>
					</View>
				)}
				<View
					style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#fff' }}
					tabLabel={I18n.t('Federated_Member')}
				>
					{this.renderFederationTab()}
				</View>
			</ScrollableTabView>
		) : (
			this.renderListView()
		);
	};

	renderFederationTab = () => {
		if (this.fromCreatGroup) {
			return this.renderFederationTips(I18n.t('Federated_Member_Tip1'));
		}
		if (this.fromScanQRCode) {
			console.info(this.fromScanQRCode);
			return this.renderFederationTips(I18n.t('Federated_Member_Tip3'));
		}
		return this.renderFederation();
	};

	renderFederationTips = (tip: string, showButton?: boolean) => (
		<View style={{ alignItems: 'center', marginTop: Dimensions.get('window').height * 0.2, backgroundColor: '#fff' }}>
			<GroupIcon width={80} height={80} />
			<Text style={{ textAlign: 'left', fontSize: 16, color: 'rgba(0,0,0,0.8)', marginTop: 15, marginHorizontal: 20 }}>
				{tip}
			</Text>
			{showButton ? (
				<Button
					style={{ minWidth: Dimensions.get('window').width * 0.4, marginTop: 15, borderRadius: 8 }}
					onPress={() => {
						this.setState({ federationState: SHOW_QRCODE });
					}}
					title={I18n.t('I_SEE')}
				/>
			) : null}
		</View>
	);

	renderFederation = () => {
		const { expire, timeStr, showDrawer, federationState } = this.state;
		if (this.room?.federated || federationState === SHOW_QRCODE) {
			return (
				<View style={{ width: '100%' }}>
					<FederationQR
						room={this.room as unknown as ISubscription}
						expire={expire}
						timeStr={timeStr}
						setDrawerShow={this.changeDrawer}
						style={{ flex: 1 }}
					/>
					<TimeDrawer
						isShowBottom={showDrawer}
						closeDrawer={this.changeDrawer}
						handleExpire={this.handleExpire}
						handleTimeString={this.handleTimeString}
						expire={expire}
					/>
				</View>
			);
		}
		return this.renderFederationTips(I18n.t('Federation_QR_Tips1'), true);
	};

	renderChooseAll = () => {
		const { theme } = this.props;
		const { isChooseAll } = this.state;
		return (
			<Pressable
				onPress={() => {
					this.setState({
						isChooseAll: !isChooseAll
					});
				}}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }: any) => ({
					backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : '#fff'
				})}
			>
				<View style={[styles.container, { borderColor: themes[theme].separatorColor, borderBottomWidth: 1 }]}>
					<CustomIcon
						name={isChooseAll ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={24}
						style={[styles.checkbox]}
						color={isChooseAll ? themes[theme].actionTintColor : themes[theme].auxiliaryText}
					/>

					<View style={[styles.textContainer, { marginHorizontal: 15, marginVertical: 15 }]}>
						<Text style={[styles.name, { color: themes[theme].titleText }]} numberOfLines={1}>
							{`添加全员（新成员自动加入该${I18n.t('Channel')}）`}
						</Text>
					</View>
				</View>
			</Pressable>
		);
	};

	changeDrawer = (state: boolean) => {
		this.setState({
			showDrawer: state
		});
	};

	handleExpire = (value: number) => {
		this.setState({
			expire: value
		});
	};

	handleTimeString = (label: string) => {
		this.setState({
			timeStr: label
		});
	};

	renderListView = () => {
		const { search, chats, searchText } = this.state;
		const { theme, route } = this.props;
		const hasRooms = route.params?.hasRooms;
		const isChannel = route.params?.isChannel;
		const searchOrChats = (searchText ? search : chats) as ISelectedUser[];

		// filter DM between multiple users
		const data = searchOrChats.filter(sub => hasRooms || !isGroupChat(sub));
		// console.log(search.length, 'datadata')
		return (
			<>
				{isChannel ? this.renderChooseAll() : null}
				<FlatList
					data={data}
					extraData={this.props}
					keyExtractor={item => item._id}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
					onTouchStart={Keyboard.dismiss}
					// ListHeaderComponent={this.renderHeader}
					contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
					keyboardShouldPersistTaps='always'
					ListFooterComponent={() => <View style={{ height: isIOS ? 0 : 20 }} />}
				/>
			</>
		);
	};

	render = () => (
		<SafeAreaView testID='select-users-view'>
			<StatusBar />
			<View style={{ padding: 5, backgroundColor: '#f3f4f5' }}>{this.renderHeader()}</View>
			{this.renderList()}
			{/* {this.renderSelected()}*/}
			{/* <Loading /> */}
		</SafeAreaView>
	);
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	users: state.selectedUsers.users,
	loading: state.selectedUsers.loading,
	user: getUserSelector(state),
	userMap: state.contacts.userMap
});

export default connect(mapStateToProps)(withTheme(SelectedUsersView));
