import { Q } from '@nozbe/watermelondb';
import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { connect } from 'react-redux';
import { Observable, Subscription } from 'rxjs';

import { themes } from '../../lib/constants';
import { TActionSheetOptions, withActionSheet } from '../../containers/ActionSheet';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import Button from '../../containers/Button';
import SafeAreaView from '../../containers/SafeAreaView';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import { LISTENER } from '../../containers/Toast';
import { IApplicationState, IBaseScreen, IUser, SubscriptionType, TSubscriptionModel, TUserModel } from '../../definitions';
import I18n from '../../i18n';
import database from '../../lib/database';
import UserItem from '../../containers/UserItem';
import { getUserSelector } from '../../selectors/login';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { TSupportedThemes, withTheme } from '../../theme';
import EventEmitter from '../../utils/events';
import { goRoom, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import log from '../../utils/log';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { TSupportedPermissions } from '../../reducers/permissions';
import { getRoomAvatar, getRoomTitle, hasPermission, isGroupChat, RoomTypes } from '../../lib/methods';
import styles from './styles';
import { Services } from '../../lib/services';
import { setLoading } from '../../actions/selectedUsers';
import Navigation from '../../lib/navigation/appNavigation';
import debounce from '../../utils/debounce';
import sharedStyles from '../Styles';
import Avatar from '../../containers/Avatar';
import { isIOS } from '../../utils/deviceInfo';
import { showToast } from '../../lib/methods/helpers/showToast';
import { SET_OWNER_MODE, SET_PDT_MODE } from '../RoomGroupManageView';

const PAGE_SIZE = 50;

interface IRoomMembersEditViewProps extends IBaseScreen<ModalStackParamList, 'RoomMembersEditView'> {
	rid: string;
	members: string[];
	canAddUser: boolean;
	baseUrl: string;
	room: TSubscriptionModel;
	user: {
		id: string;
		token: string;
		roles: string[];
	};
	showActionSheet: (params: TActionSheetOptions) => {};
	theme: TSupportedThemes;
	isMasterDetail: boolean;
	useRealName: boolean;
	muteUserPermission: string[];
	setLeaderPermission: string[];
	setOwnerPermission: string[];
	setModeratorPermission: string[];
	removeUserPermission: string[];
	editTeamMemberPermission: string[];
	viewAllTeamChannelsPermission: string[];
	viewAllTeamsPermission: string[];
}

interface IRoomMembersEditViewState {
	isLoading: boolean;
	allUsers: boolean;
	filtering: string;
	rid: string;
	members: TUserModel[];
	membersFiltered: TUserModel[];
	room: TSubscriptionModel;
	end: boolean;
	membersSelected: TUserModel[];
}

const EDIT_MODE = {
	REMOVE_USER: 1,
	ADD_OWNER: 2,
	ADD_MODERATOR: 3,
	ADD_PDT: 4,
	UNDEFINE: -1
};

class RoomMembersEditView extends React.Component<IRoomMembersEditViewProps, IRoomMembersEditViewState> {
	private mounted: boolean;
	private permissions: { [key in TSupportedPermissions]?: boolean };
	private roomObservable!: Observable<TSubscriptionModel>;
	private subscription!: Subscription;
	private roomRoles: any;
	private moreTimer: any;
	private preFilter: string | undefined;

	private roleIds: any;
	private leaders: any;
	private firstLoad: boolean;
	private canAction: boolean;
	private currentPage: number;
	private editMode: number; // 1、批量删除 2、设置群主 3、批量设置管理员
	private flatlist?: FlatList;
	private moderatorsSelected: IUser[];

	constructor(props: IRoomMembersEditViewProps) {
		super(props);
		this.mounted = false;
		this.permissions = {};
		this.moreTimer = null;
		this.firstLoad = true;
		this.canAction = false;
		this.currentPage = 0;
		const rid = props.route.params?.rid;
		const room = props.route.params?.room;
		this.editMode = props.route.params?.editMode ?? EDIT_MODE.UNDEFINE;
		this.state = {
			isLoading: false,
			allUsers: true,
			filtering: '',
			rid,
			members: [],
			membersFiltered: [],
			room: room || ({} as TSubscriptionModel),
			end: false,
			membersSelected: []
		};
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable.subscribe(changes => {
				if (this.mounted) {
					this.setState({ room: changes });
				} else {
					this.setState({ room: changes });
				}
			});
		}
		this.setHeader();
	}

	async componentDidMount() {
		const { room } = this.state;
		this.mounted = true;
		this.fetchMembers('');

		if (isGroupChat(room)) {
			return;
		}

		const {
			muteUserPermission,
			setLeaderPermission,
			setOwnerPermission,
			setModeratorPermission,
			removeUserPermission,
			editTeamMemberPermission,
			viewAllTeamChannelsPermission,
			viewAllTeamsPermission
		} = this.props;

		const result = await hasPermission(
			[
				muteUserPermission,
				setLeaderPermission,
				setOwnerPermission,
				setModeratorPermission,
				removeUserPermission,
				...(room.teamMain ? [editTeamMemberPermission, viewAllTeamChannelsPermission, viewAllTeamsPermission] : [])
			],
			room.rid
		);

		this.permissions = {
			'mute-user': result[0],
			'set-leader': result[1],
			'set-owner': result[2],
			'set-moderator': result[3],
			'remove-user': result[4],
			...(room.teamMain
				? {
						'edit-team-member': result[5],
						'view-all-team-channels': result[6],
						'view-all-teams': result[7]
				  }
				: {})
		};

		// const hasSinglePermission = Object.values(this.permissions).some(p => !!p);
		// if (hasSinglePermission) {
		this.fetchRoomMembersRoles();
		// }
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	setHeader = () => {
		const { room } = this.state;
		let title = I18n.t('Members');
		if (this.editMode === EDIT_MODE.REMOVE_USER) {
			title = I18n.t('Remove_Member');
		} else if (this.editMode === EDIT_MODE.ADD_OWNER) {
			const role = room.t === 'c' ? 'Owner_Channel' : 'Owner';
			title = `添加${I18n.t(role)}`;
		} else if (this.editMode === EDIT_MODE.ADD_MODERATOR) {
			const role = room.t === 'c' ? 'Moderator_Channel' : 'Moderator';
			title = `编辑${I18n.t(role)}`;
		} else if (this.editMode === EDIT_MODE.ADD_PDT) {
			title = `编辑${I18n.t('PDT_Manager')}`;
		}
		// const { allUsers } = this.state;
		const { navigation } = this.props;
		// const toggleText = allUsers ? I18n.t('Online') : I18n.t('All');
		navigation.setOptions({
			headerTitleAlign: 'center',
			title,
			headerLeft: () => <HeaderButton.BackButton navigation={navigation} />
		});
	};

	addUserClick = async () => {
		const { room } = this.state;
		const { t, rid } = room;
		this.setState({ isLoading: true });
		try {
			this.setState({ isLoading: false });
			const membersResult = await Services.getRoomMembers({
				rid,
				roomType: t,
				type: 'all',
				filter: '',
				skip: 0,
				limit: 0,
				allUsers: true
			});
			Navigation.navigate('SelectedUsersView', {
				title: I18n.t('Add_users'),
				groupUsers: membersResult,
				nextAction: async () => {
					const { room } = this.state;
					const { dispatch, navigation } = this.props;
					const { rid } = room;
					try {
						dispatch(setLoading(true));
						await Services.addUsersToRoom(rid);
						// @ts-ignore
						navigation.navigate('RoomView', {});
					} catch (e) {
						log(e);
					} finally {
						dispatch(setLoading(false));
					}
				}
			});
		} catch (e) {
			this.setState({ isLoading: false });
			log(e);
		}
	};

	onSearchChangeText = debounce((text: string) => {
		// const { members } = this.state;
		// let membersFiltered: TUserModel[] = [];
		text = text.trim();

		// if (members && members.length > 0 && text) {
		// 	membersFiltered = members.filter(
		// 		m => m.username.toLowerCase().match(text.toLowerCase()) || m.name?.toLowerCase().match(text.toLowerCase())
		// 	);
		// }
		if (text.length === 0) {
			this.currentPage = 0;
		}
		this.setState(() => {
			if (this.preFilter !== text) {
				this.fetchMembers(text);
			}
			return { filtering: text, membersFiltered: [] };
		});
	}, 1000);

	navToDirectMessage = async (item: IUser) => {
		try {
			const db = database.active;
			const subsCollection = db.get('subscriptions');
			const query = await subsCollection.query(Q.where('name', item.username)).fetch();
			if (query.length) {
				const [room] = query;
				this.goRoom(room);
			} else {
				const result = await Services.createDirectMessage(item.username);
				if (result.success) {
					this.goRoom({ rid: result.room?._id as string, name: item.username, t: SubscriptionType.DIRECT });
				}
			}
		} catch (e) {
			log(e);
		}
	};

	removeUsersFromTeam = async (selectedUsers: IUser[]) => {
		try {
			const { room, members, membersFiltered, filtering } = this.state;
			await Promise.all(
				selectedUsers.map(async item => {
					const userId = item._id;
					const result = await Services.removeUserFromRoom({ roomId: room.rid, t: room.t as RoomTypes, userId });
					if (result.success) {
						this.setState(prev => ({
							membersSelected: prev.membersSelected.filter(item => item._id !== userId)
						}));
					} else {
						showToast(`员工${item.name}删除失败`);
					}
				})
			);
			const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
			showToast(message);
			if (filtering.length === 0) {
				const newMembers = members.filter(member => selectedUsers.find(prop => member._id !== prop._id));
				this.setState({
					members: newMembers
				});
			} else {
				const newMembersFiltered = membersFiltered.filter(member => selectedUsers.find(prop => member._id !== prop._id));
				this.setState({
					membersFiltered: newMembersFiltered
				});
			}
			Navigation.back();
			// @ts-ignore - This is just to force a reload
			// navigation.navigate('RoomMembersEditView');
		} catch (e: any) {
			log(e);
			showErrorAlert(
				e.data.error ? I18n.t(e.data.error) : I18n.t('There_was_an_error_while_action', { action: I18n.t('removing_team') }),
				I18n.t('Cannot_remove')
			);
		}
	};
	handleRemoveUsersFromRoom = async (selectedUsers: IUser[]) => {
		try {
			const { room } = this.state;
			// TODO: interface SubscriptionType on IRoom is wrong

			await Promise.all(
				selectedUsers.map(async item => {
					const userId = item._id;
					const result = await Services.removeUserFromRoom({ roomId: room.rid, t: room.t as RoomTypes, userId });
					if (!result.success) {
						showToast(`员工${item.name}删除失败`);
					}
				})
			);
			const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
			showToast(message);
			Navigation.back();
			/* 			if (filtering.length === 0) {
				const newMembers = members.filter(member => selectedUsers.find(prop => member._id !== prop._id));
				this.setState({
					members: newMembers,
					membersSelected: []
				});
			} else {
				const newMembersFiltered = membersFiltered.filter(member => selectedUsers.find(prop => member._id !== prop._id));
				this.setState({
					membersFiltered: newMembersFiltered,
					membersSelected: []
				});
			} */
		} catch (e) {
			log(e);
		}
	};

	isContained = (item: TUserModel) => {
		const { membersSelected } = this.state;
		return membersSelected.findIndex(el => (item.username ? el.username === item.username : el._id === item._id)) !== -1;
	};

	onPressUser = (selectedUser: TUserModel) => {
		if (this.editMode === SET_OWNER_MODE) {
			const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isOwner = userRoleResult?.roles.includes('owner');

			console.info('userRoleResult', userRoleResult);
			showConfirmationAlert({
				message: isOwner ? '确认取消此用户的Sponsor权限？' : '确认设置此用户为Sponsor？',
				confirmationText: I18n.t('Yes_action_it'),
				onPress: () => {
					const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
					const isOwner = userRoleResult?.roles.includes('owner');
					this.handleOwner(selectedUser, !isOwner);
				}
			});
			return;
		}

		if (this.editMode === SET_PDT_MODE) {
			const isPDT = selectedUser?.roles?.includes('pdt') ?? false;

			showConfirmationAlert({
				message: isPDT ? '确认取消此用户的PDT经理权限' : '确认设置此用户为PDT经理？',
				confirmationText: I18n.t('Yes_action_it'),
				onPress: () => {
					this.handlePDT(selectedUser, isPDT);
				}
			});
			return;
		}

		if (this.isContained(selectedUser)) {
			this.setState(prevState => ({
				membersSelected: prevState.membersSelected.filter(el => el.username && el.username !== selectedUser.username)
			}));
		} else {
			this.setState(prevState => ({
				membersSelected: [...prevState.membersSelected, selectedUser]
			}));
		}
	};

	fetchRoomMembersRoles = async () => {
		try {
			const { room } = this.state;
			const type = room.t as SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL;
			const result = await Services.getRoomRoles(room.rid, type);
			if (result?.success) {
				this.roomRoles = result.roles;
				this.roleIds = this.roomRoles.map((item: { u: { _id: any } }) => item.u._id);
				this.leaders = this.roomRoles.map((item: { u: any; roles: any }) => ({ ...item.u, roles: [...item.roles] }));
				if (this.editMode === EDIT_MODE.ADD_MODERATOR) {
					this.setState({
						membersSelected: this.leaders.filter(e => this.isModerator(e.roles))
					});
					this.moderatorsSelected = this.leaders.filter(e => this.isModerator(e.roles));
				}
				if (this.firstLoad) {
					this.firstLoad = false;
					this.filterRoles([]);
				}
			}
		} catch (e) {
			log(e);
		}
	};

	onEndReached = () => {
		if (!this.canAction) {
			return;
		}
		const { filtering } = this.state;
		// if (filtering.length !== 0) {
		// 	return;
		// }
		this.currentPage += 1;
		if (this.moreTimer) {
			clearTimeout(this.moreTimer);
		}
		this.moreTimer = setTimeout(() => this.fetchMembers(filtering), 100);
	};

	fetchMembers = async (filtering: string) => {
		const { rid, allUsers, room, membersFiltered } = this.state;
		const { t } = room;

		this.setState({ isLoading: true });
		try {
			this.preFilter = filtering;
			const membersResult = await Services.getRoomMembers({
				rid,
				roomType: t,
				type: allUsers ? 'all' : 'online',
				filter: filtering,
				skip: filtering.length !== 0 ? membersFiltered.length : this.currentPage * PAGE_SIZE,
				limit: PAGE_SIZE,
				allUsers
			});

			if (filtering.length !== 0) {
				if (filtering !== this.preFilter) {
					return;
				}
				this.setState({
					membersFiltered: membersResult,
					members: [],
					isLoading: false
				});
			} else {
				this.filterRoles(membersResult);

				this.setState({
					// members: members.concat(membersResult || []),
					membersFiltered: [],
					isLoading: false
				});
			}

			this.setHeader();
		} catch (e) {
			log(e);
			this.setState({ isLoading: false });
		}
	};

	filterRoles = (membersResult: TUserModel[]) => {
		if (this.roomRoles) {
			const { members } = this.state;
			let newMembers = [...this.leaders, ...[...members, ...membersResult.filter(user => !this.roleIds.includes(user._id))]];
			if (membersResult.length === 0) {
				newMembers = [...this.leaders, ...members.filter(user => !this.roleIds.includes(user._id))];
			}
			const uniqueItems = newMembers.filter(
				(item, index) => index === newMembers.findIndex(obj => JSON.stringify(obj) === JSON.stringify(item))
			);

			this.setState({
				members: uniqueItems
			});
		} else {
			this.setState(prevState => ({
				members: [...prevState.members, ...membersResult]
			}));
		}
	};

	goRoom = (item: TGoRoomItem) => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			// @ts-ignore
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.popToTop();
		}
		goRoom({ item, isMasterDetail });
	};

	getUserDisplayName = (user: TUserModel) => {
		const { useRealName } = this.props;
		return (useRealName ? user.name : user.username) || user.username;
	};

	handleMute = async (user: TUserModel) => {
		const { rid } = this.state;
		try {
			await Services.toggleMuteUserInRoom(rid, user?.username, !user?.muted);
			EventEmitter.emit(LISTENER, {
				message: I18n.t('User_has_been_key', { key: user?.muted ? I18n.t('unmuted') : I18n.t('muted') })
			});
		} catch (e) {
			log(e);
		}
	};

	handleOwner = async (selectedUser: TUserModel, isOwner: boolean) => {
		try {
			const { room } = this.state;
			await Services.toggleRoomOwner({
				roomId: room.rid,
				t: room.t,
				userId: selectedUser._id,
				isOwner
			});
			const message = isOwner
				? 'User__username__is_now_a_owner_of__room_name_'
				: 'User__username__removed_from__room_name__owners';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			});
		} catch (e) {
			// @ts-ignore
			showToast(I18n.t(e.data.errorType));
			log(e);
		}
		this.setState({
			end: false,
			members: []
		});
		this.currentPage = 0;
		this.fetchMembers('');
		this.fetchRoomMembersRoles();
	};

	handlePDT = async (selectedUser: TUserModel, isPDT: boolean) => {
		try {
			const { room } = this.state;
			let message = '';
			console.info('isPDT', isPDT);
			if (isPDT) {
				await Services.roomRoleRmove(room.rid, selectedUser.username, 'pdt');
				message = 'User__username__removed_from__room_name__pdt';
			} else {
				await Services.roomRoleAdd(room.rid, selectedUser.username, 'pdt', true);
				message = 'User__username__is_now_a_pdt_of__room_name_';
			}

			showToast(
				I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			);
		} catch (e) {
			// @ts-ignore
			showToast(I18n.t(e.data.errorType));
			log(e);
		}
		this.setState({
			end: false,
			members: []
		});
		this.currentPage = 0;
		await this.fetchRoomMembersRoles();
		this.fetchMembers('');
	};

	handleLeader = async (selectedUser: TUserModel, isLeader: boolean) => {
		try {
			const { room } = this.state;
			await Services.toggleRoomLeader({
				roomId: room.rid,
				t: room.t,
				userId: selectedUser._id,
				isLeader
			});
			const message = isLeader
				? 'User__username__is_now_a_leader_of__room_name_'
				: 'User__username__removed_from__room_name__leaders';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.fetchRoomMembersRoles();
	};

	handleModerator = async (selectedUser: TUserModel, isModerator: boolean) => {
		try {
			const { room } = this.state;
			await Services.toggleRoomModerator({
				roomId: room.rid,
				t: room.t,
				userId: selectedUser._id,
				isModerator
			});
			const message = isModerator
				? 'User__username__is_now_a_moderator_of__room_name_'
				: 'User__username__removed_from__room_name__moderators';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.setState({
			end: false,
			members: []
		});
		this.currentPage = 0;
		await this.fetchRoomMembersRoles();
		this.fetchMembers('');
	};

	renderSearchBar = () => <SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='room-members-view-search' />;

	setFlatListRef = (ref: FlatList) => (this.flatlist = ref);

	onContentSizeChange = () => this.flatlist?.scrollToEnd({ animated: true });

	renderSelected = () => {
		const { theme } = this.props;
		const { membersSelected } = this.state;

		return (
			<View style={[sharedStyles.footerBox, { maxWidth: '100%' }]}>
				<FlatList
					data={membersSelected}
					ref={this.setFlatListRef}
					onContentSizeChange={this.onContentSizeChange}
					// getItemLayout={getItemLayout}
					keyExtractor={item => item._id}
					style={{ borderColor: themes[theme].separatorColor }}
					contentContainerStyle={{ marginTop: 5, marginBottom: 10, height: 55, marginLeft: 20, paddingRight: 10 }}
					renderItem={this.renderSelectedItem}
					keyboardShouldPersistTaps='always'
					horizontal
				/>
				{![EDIT_MODE.ADD_OWNER, EDIT_MODE.ADD_PDT].includes(this.editMode) && (
					<View style={[sharedStyles.confirmButtonBox, { flex: 0 }]}>
						<Button
							disabled={membersSelected.length === 0}
							style={[sharedStyles.confirmButton, { backgroundColor: membersSelected.length === 0 ? '#64AAFA' : '#3576ED' }]}
							title={`完成(${membersSelected.length})`}
							onPress={this.onConfirm}
						></Button>
					</View>
				)}
			</View>
		);
	};

	onConfirm = async () => {
		const { navigation } = this.props;
		const { membersSelected, room } = this.state;
		if (this.editMode === EDIT_MODE.REMOVE_USER) {
			if (room.t === 'c') {
				await this.handleRemoveUsersFromRoom(membersSelected);
			} else {
				await this.removeUsersFromTeam(membersSelected);
			}
			navigation.navigate('RoomView', {});
			return;
		}
		if (this.editMode === EDIT_MODE.ADD_MODERATOR) {
			// this.handleLeader(selectedUser, !isLeader)
			await this.handleMultiLeader(membersSelected);
			navigation.navigate('RoomView', {});
		}
	};

	handleMultiLeader = async (selectedUsers: TUserModel[]) => {
		// 查找数组B比数组A多的元素（存在于B中，但不存在于A中）
		const addArray = selectedUsers.filter(item => !this.moderatorsSelected.includes(item));

		// 查找数组B比数组A少的元素（存在于A中，但不存在于B中）
		const removeArray = this.moderatorsSelected.filter(item => !selectedUsers.includes(item));

		const { room } = this.state;
		try {
			await Promise.all([
				...removeArray.map(async selectedUser => {
					await Services.toggleRoomModerator({
						roomId: room.rid,
						t: room.t,
						userId: selectedUser._id,
						isModerator: false
					});
				}),
				...addArray.map(async selectedUser => {
					await Services.toggleRoomModerator({
						roomId: room.rid,
						t: room.t,
						userId: selectedUser._id,
						isModerator: true
					});
				})
			]);

			// this.setState({
			//   membersSelected: selectedUsers.filter(item => item._id !== selectedUser._id)
			// });
			// showToast('设置管理员成功');

			this.setState({
				end: false,
				members: [],
				membersSelected: []
			});
			this.currentPage = 0;
			await this.fetchMembers('');
			this.fetchRoomMembersRoles();
		} catch (e) {
			// showToast(e);
			log(e);
		}
		// this.fetchRoomMembersRoles();
	};

	renderSelectedItem = ({ item }: { item: TUserModel; index: number }) => {
		const { theme } = this.props;
		const avatar = item.rid ? getRoomAvatar(item) : item.username;

		return (
			<Pressable
				onPress={() => this._onPressSelectedItem(item)}
				testID={`selected-user-${item.name}`}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }: any) => ({
					backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
				})}
			>
				<View style={{ paddingRight: 15 }}>
					<Avatar text={avatar || item.name} rid={item.rid} type={item.type} size={36} style={{ marginVertical: 12 }} />
				</View>
			</Pressable>
		);
	};

	_onPressSelectedItem = (item: TUserModel) => {
		if (this.isContained(item)) {
			this.setState(prevState => ({
				membersSelected: prevState.membersSelected.filter(el => el.username && el.username !== item.username)
			}));
		} else {
			this.setState(prevState => ({
				membersSelected: [...prevState.membersSelected, item]
			}));
		}
	};

	renderItem = ({ item }: { item: TUserModel }) => {
		const { user } = this.props;
		const disabled =
			(this.editMode === EDIT_MODE.REMOVE_USER && user.id === item._id) ||
			(this.editMode === EDIT_MODE.ADD_MODERATOR && this.isOwners(item.roles));
		return (
			<UserItem
				name={item.name as string}
				username={item.username}
				onPress={() => this.onPressUser(item)}
				testID={`room-members-view-item-${item.username}`}
				hasCheckbox={![EDIT_MODE.ADD_OWNER, EDIT_MODE.ADD_PDT].includes(this.editMode)}
				checked={this.isContained(item)}
				roles={item.roles}
				disabled={disabled}
				t={this.state.room.t}
			/>
		);
	};

	isOwners = (roles?: string[]) => {
		if (roles && roles.length) {
			if (roles.includes('owner')) {
				return true;
			}
			// if (roles.includes('moderator')) {
			// 	return true;
			// }
			return false;
		}
		return false;
	};

	isModerator = (roles?: string[]) => {
		if (roles && roles.length) {
			// if (roles.includes('owner')) {
			// 	return true;
			// }
			if (roles.includes('moderator')) {
				return true;
			}
			return false;
		}
		return false;
	};

	render() {
		const { filtering, members, membersFiltered, isLoading } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView testID='room-members-view' style={{ height: '100%' }}>
				<StatusBar />
				<FlatList
					data={filtering.length !== 0 ? membersFiltered : members}
					renderItem={this.renderItem}
					style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={this.renderSearchBar}
					ListFooterComponent={() => {
						if (isLoading) {
							return <ActivityIndicator />;
						}
						return null;
					}}
					onEndReachedThreshold={0.01}
					onEndReached={() => this.onEndReached()}
					maxToRenderPerBatch={5}
					windowSize={100}
					getItemLayout={(_data, index) => ({ length: 54, offset: 54 * index, index })}
					onScrollBeginDrag={() => {
						console.log('onScrollBeginDrag');
						this.canAction = true;
					}}
					onScrollEndDrag={() => {
						console.log('onScrollEndDrag');
						this.canAction = false;
					}}
					onMomentumScrollBegin={() => {
						console.log('onMomentumScrollBegin');
						this.canAction = true;
					}}
					onMomentumScrollEnd={() => {
						console.log('onMomentumScrollEnd');
						this.canAction = false;
					}}
					{...scrollPersistTaps}
				/>
				{![EDIT_MODE.ADD_OWNER, EDIT_MODE.ADD_PDT].includes(this.editMode) ? this.renderSelected() : null}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	useRealName: state.settings.UI_Use_Real_Name,
	muteUserPermission: state.permissions['mute-user'],
	setLeaderPermission: state.permissions['set-leader'],
	setOwnerPermission: state.permissions['set-owner'],
	setModeratorPermission: state.permissions['set-moderator'],
	removeUserPermission: state.permissions['remove-user'],
	editTeamMemberPermission: state.permissions['edit-team-member'],
	viewAllTeamChannelsPermission: state.permissions['view-all-team-channels'],
	viewAllTeamsPermission: state.permissions['view-all-teams']
});

export default connect(mapStateToProps)(withTheme(withActionSheet(RoomMembersEditView)));
