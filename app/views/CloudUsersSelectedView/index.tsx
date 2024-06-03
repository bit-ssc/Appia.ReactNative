import React from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Subscription } from 'rxjs';
import { Q } from '@nozbe/watermelondb';
import orderBy from 'lodash/orderBy';
import { connect } from 'react-redux';

import { IApplicationState, IBaseScreen, IDepartment, IUser, IUserSummary, TUserModel } from '../../definitions';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { addUser, addUsers, removeUser, removeUsers, reset } from '../../actions/selectedUsers';
import { sendLoadingEvent } from '../../containers/Loading';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import database from '../../lib/database';
import log, { events, logEvent } from '../../utils/log';
import { isGroupChat, getRoomAvatar, search, TSearch } from '../../lib/methods';
import { showErrorAlert } from '../../utils/info';
import { themes } from '../../lib/constants';
import sharedStyles from '../Styles';
import Button from '../../containers/Button';
import { isIOS } from '../../utils/deviceInfo';
import Avatar from '../../containers/Avatar';
import UserItem, { styles } from '../../containers/Organization/UserItem';
import Organization from '../../containers/Organization';
import { CustomIcon } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { getUserSelector } from '../../selectors/login';
import { withTheme } from '../../theme';
import { ChatsStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import { CloudPermissionEditItemData } from '../CloudPermissionManageView';
import { DrawerMenu } from '../../containers/DrawerMenu';

interface CloudUsersSelectedViewProps extends IBaseScreen<ChatsStackParamList, 'CloudUsersSelectedView'> {
	users: ISelectedUser[];
	loading: boolean;
	user: IUser;
	baseUrl: string;
}
interface CloudUsersSelectedViewState {
	showOrg: boolean;
	maxUsers?: number;
	search: TSearch[];
	chats: ISelectedUser[];
	searchText: string;
	orgHistory: IDepartment[];
	showSearchBox: boolean;
	isChooseAll: boolean;
	editListData: CloudPermissionEditItemData[];
	isEditViewShow: boolean;
}

class CloudUsersSelectedView extends React.Component<CloudUsersSelectedViewProps, CloudUsersSelectedViewState> {
	private flatlist?: FlatList;
	private querySubscription?: Subscription;
	private orgRef: any;
	private fromCreatGroup?: boolean;
	private groupUsers?: TUserModel[];
	private groupUserIds?: string[];
	private existSelectedUsers?: ISelectedUser[];
	private textInputRef: any;

	constructor(props: CloudUsersSelectedViewProps) {
		super(props);
		this.init();
		this.loadPermissionData();
		const maxUsers = props.route.params?.maxUsers;
		this.fromCreatGroup = props.route.params?.fromCreatGroup ?? false;
		this.groupUsers = props.route.params?.groupUsers;
		this.groupUserIds = this.groupUsers?.map(a => a._id);
		this.state = {
			searchText: '',
			showOrg: false,
			maxUsers,
			search: [],
			chats: [],
			orgHistory: [],
			showSearchBox: false,
			isChooseAll: false
			// selectedType: 0
		};
		// this.setHeader(props.route.params?.showButton);
		this.setHeader();
		const { dispatch, users } = this.props;
		console.info('users', users);
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
		dispatch(reset());
	}

	componentDidUpdate(prevProps: CloudUsersSelectedViewProps) {
		const { loading } = this.props;

		if (loading !== prevProps.loading) {
			sendLoadingEvent({ visible: loading });
		}
	}

	componentWillUnmount() {
		const { dispatch } = this.props;
		dispatch(reset());
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}

	onConfirm = () => {
		const { users } = this.props;
		// @ts-ignore
		if (users.length > 0) {
			this.setState({ isEditViewShow: true });
		}
	};

	onBackPress = () => {
		const { showOrg } = this.state;
		if (!showOrg || !this.orgRef?.goPrev()) {
			const { navigation } = this.props;
			navigation?.pop();
		}
	};

	loadPermissionData = async () => {
		const res = await Services.getPermissionTypeList();
		console.info(res, 'res');
		const { data } = res;
		this.setState({ editListData: data });
	};

	editView = () => (
		<DrawerMenu
			visible={this.state.isEditViewShow}
			hideModal={() => {
				this.setState({ isEditViewShow: false });
			}}
			menuPosition='bottom'
			Height={this.state.editListData.length * 79 + 65}
			children={
				<FlatList
					data={this.state.editListData}
					renderItem={({ item }) => this.editListItem(item)}
					ListFooterComponent={this.editListFooterView}
					ItemSeparatorComponent={List.Separator}
				/>
			}
		/>
	);

	editListFooterView = () => (
		<View style={{ flexDirection: 'column', width: '100%' }}>
			<View style={{ height: 8, width: '100%', backgroundColor: '#F5F5F5' }} />
			<TouchableOpacity
				onPress={() => {
					this.setState({ isEditViewShow: false });
				}}
			>
				<View style={{ width: '100%', height: 57, alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ fontSize: 18, fontWeight: '400', color: '#333' }}>取消</Text>
				</View>
			</TouchableOpacity>
		</View>
	);

	editListItem = (item: CloudPermissionEditItemData) => (
		<TouchableOpacity
			onPress={() => {
				this.setState({ isEditViewShow: false });
				this.uploadPermissionChange(item.code);
			}}
		>
			<View style={{ paddingHorizontal: 12, paddingVertical: 16, flexDirection: 'column', width: '100%' }}>
				<Text style={{ fontSize: 18, fontWeight: '400', color: '#333' }}>{item.name}</Text>
				<Text style={{ fontSize: 14, fontWeight: '400', color: '#999' }}>{item.description}</Text>
			</View>
		</TouchableOpacity>
	);

	uploadPermissionChange = (permissionType: number) => {
		const { users, route, navigation } = this.props;
		const nextAction = route.params?.nextAction;
		if (nextAction) {
			const userIds: string[] = [];
			users.forEach(item => {
				if (!this.groupUserIds?.includes(item.name)) {
					userIds.push(item.name);
				}
			});
			nextAction(navigation, userIds, permissionType);
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
			headerRight: () => (
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
			const whereClause = route.params?.hasRooms ? [Q.where('archived', false), Q.where('open', true)] : [Q.where('t', 'd')];
			const observable = await db
				.get('subscriptions')
				.query(...whereClause)
				.observeWithColumns(['room_updated_at']);

			this.querySubscription = observable.subscribe(data => {
				const chats = orderBy(data, ['roomUpdatedAt'], ['desc']) as ISelectedUser[];
				this.setState({ chats });
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
		const result = await search({ text, filterRooms: !!route.params?.hasRooms });
		this.setState({ search: result.filter(item => !item.name?.includes(':')) });
	};

	isGroupChat = () => {
		const { maxUsers } = this.state;
		return maxUsers && maxUsers > 2;
	};

	isChecked = (item: ISelectedUser) => {
		const { users } = this.props;
		const result = this.existSelectedUsers?.concat(users) || [];
		return (
			result.findIndex(el =>
				item.userId
					? el.username === item.name ||
					  el.name === item.name ||
					  el.userId === item.userId ||
					  el._id === item.userId ||
					  el.userId === item._id ||
					  el._id === item._id
					: el.rid === item.rid
			) !== -1
		);
	};

	isNewGroupChecked = (item: ISelectedUser) => {
		const { users } = this.props;
		return (
			users.findIndex(el =>
				item.userId ? el.userId === item.userId || el._id === item.userId || el.userId === item._id : el.rid === item.rid
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
		const isContain = this.isChecked(user);
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
		const { dispatch, users } = this.props;
		const { maxUsers } = this.state;
		const result: ISelectedUser[] = [];
		userList.forEach(item => {
			const isMe = this.existSelectedUsers?.findIndex(
				a =>
					a.username === item.name ||
					a.name === item.name ||
					a.name === item.username ||
					a.username === item.username ||
					a._id === item._id
			);
			if (isMe !== -1) {
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

	renderHeader = () => {
		const { theme, users } = this.props;
		// const { searchText, showSearchBox } = this.state;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor, flexDirection: 'row', borderRadius: 8, minHeight: 40 }}>
				{this.renderSelected()}
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
			</View>
		);
	};

	renderSelectedItem = ({ item }: { item: ISelectedUser; index: number }) => {
		const { theme } = this.props;
		const avatar = item.rid ? getRoomAvatar(item) : item.name;
		const disabled = this.groupUserIds?.includes(item.userId || '');
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
		const { theme, user } = this.props;

		item.userId = (item.t === 'd' && item.uids?.length ? item.uids?.find(id => id !== user.id) : item._id) || user.id;
		// const name = item.search ? item.name : item.fname;
		const name = item.fname || item.name;
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
				checked={this.isChecked(item) || this.groupUserIds?.includes(item.name)}
				hasCheckbox={true}
				disabled={this.groupUserIds?.includes(item.name)}
				style={style}
				theme={theme}
			/>
		);
	};

	renderList = () => {
		const { searchText } = this.state;
		const { theme, users } = this.props;
		let selectUsers = users.filter(a => a.userId);
		if (!this.fromCreatGroup) {
			selectUsers = this.existSelectedUsers?.concat(selectUsers) || [];
		}

		// filter DM between multiple users
		return !searchText ? (
			<View style={{ flex: 1 }} tabLabel={I18n.t('Company_Contacts')}>
				<ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', maxHeight: 40 }}>
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
					disabledUsers={this.groupUsers}
				/>
			</View>
		) : (
			this.renderListView()
		);
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

	renderListView = () => {
		const { search, chats, searchText } = this.state;
		const { theme, route } = this.props;
		const hasRooms = route.params?.hasRooms;
		const isChannel = route.params?.isChannel;
		const searchOrChats = (searchText ? search : chats) as ISelectedUser[];
		// filter DM between multiple users
		const data = searchOrChats.filter(sub => hasRooms || !isGroupChat(sub));

		return (
			<>
				{isChannel ? this.renderChooseAll() : null}
				<FlatList
					data={data}
					extraData={this.props}
					keyExtractor={item => item._id}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
					contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
					keyboardShouldPersistTaps='always'
				/>
			</>
		);
	};

	render = () => (
		<SafeAreaView testID='select-users-view'>
			<StatusBar />
			<View style={{ padding: 5, backgroundColor: '#f3f4f5' }}>{this.renderHeader()}</View>
			{this.renderList()}
			{this.state.isEditViewShow ? this.editView() : null}
		</SafeAreaView>
	);
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	users: state.selectedUsers.users,
	loading: state.selectedUsers.loading,
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(CloudUsersSelectedView));
