import { Q } from '@nozbe/watermelondb';
import React from 'react';
import { FlatList, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import { Observable, Subscription } from 'rxjs';

import { themes } from '../../lib/constants';
import { TActionSheetOptions, TActionSheetOptionsItem, withActionSheet } from '../../containers/ActionSheet';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import { LISTENER } from '../../containers/Toast';
import {
	IApplicationState,
	IBaseScreen,
	IEnterprise,
	IRoomDepartment,
	IUser,
	SubscriptionType,
	TSubscriptionModel,
	TUserModel
} from '../../definitions';
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
import { getRoomTitle, hasPermission, isGroupChat, RoomTypes } from '../../lib/methods';
import styles from './styles';
import { Services } from '../../lib/services';
import { setLoading } from '../../actions/selectedUsers';
import Navigation from '../../lib/navigation/appNavigation';
import debounce from '../../utils/debounce';
import { updateRoomLeader } from '../../actions/room';
import { cannotGoDirect } from '../RoomView';
import DepartmentItem from '../../containers/DepartmentItem';
import { CustomIcon } from '../../containers/CustomIcon';
import { APPIA_TAG, hasShowTagPermission } from '../../utils/Federation';
import { showToast } from '../../lib/methods/helpers/showToast';
import CollapsedList from './components/CollapsedList';
import { TopLeader } from './TopLeader';

const PAGE_SIZE = 50;

interface IRoomMembersViewProps extends IBaseScreen<ModalStackParamList, 'RoomMembersView'> {
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
	setPDTPermission: string[];
	setModeratorPermission: string[];
	removeUserPermission: string[];
	editTeamMemberPermission: string[];
	viewAllTeamChannelsPermission: string[];
	viewAllTeamsPermission: string[];
	accessPMembers: string[];
	accessCMembers: string[];
	username: string;
}

interface IRoomMembersViewState {
	isLoading: boolean;
	allUsers: boolean;
	filtering: string;
	rid: string;
	members: TUserModel[];
	federatedMembers: IEnterprise[];
	membersFiltered: TUserModel[];
	room: TSubscriptionModel;
	end: boolean;
}

class RoomMembersView extends React.Component<IRoomMembersViewProps, IRoomMembersViewState> {
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
	private departments: IRoomDepartment[];
	private isManager: boolean | undefined;
	private isLocal: boolean | undefined;
	private realFederated: boolean;

	constructor(props: IRoomMembersViewProps) {
		super(props);
		this.mounted = false;
		this.permissions = {};
		this.moreTimer = null;
		this.firstLoad = true;
		this.canAction = false;
		this.currentPage = 0;
		// @ts-ignore
		this.departments = props.route.params?.departments;
		const rid = props.route.params?.rid;
		const room = props.route.params?.room;
		this.isManager = props.route.params?.isManager;
		this.isLocal = props.route.params?.isLocal;
		this.realFederated = hasShowTagPermission(room?.showAppiaTag, APPIA_TAG.external);
		this.state = {
			isLoading: false,
			allUsers: true,
			filtering: '',
			rid,
			members: [],
			federatedMembers: [],
			membersFiltered: [],
			room: room || ({} as TSubscriptionModel),
			end: false
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
		this.realFederated ? this.fetchFederatedMembers() : this.fetchMembers('');
		// this.fetchDepartment();

		if (isGroupChat(room)) {
			return;
		}
		await this.fetchPermission();
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

	fetchPermission = async () => {
		const { room } = this.state;
		const {
			muteUserPermission,
			setLeaderPermission,
			setOwnerPermission,
			setPDTPermission,
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
				setPDTPermission,
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
			'set-pdt': result[5],
			...(room.teamMain
				? {
						'edit-team-member': result[5],
						'view-all-team-channels': result[6],
						'view-all-teams': result[7]
				  }
				: {})
		};
		console.info('permission', setModeratorPermission, this.permissions['set-moderator']);
	};

	setHeader = () => {
		// const { allUsers } = this.state;
		const { navigation } = this.props;
		// const toggleText = allUsers ? I18n.t('Online') : I18n.t('All');
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Members'),
			headerLeft: () => <HeaderButton.BackButton navigation={navigation} />,
			headerRight: () =>
				this.props.route.params?.canAddUser && (
					<HeaderButton.Container>
						<HeaderButton.Item title={I18n.t('Add')} onPress={this.addUserClick} />
					</HeaderButton.Container>
				)
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
				room,
				fromCreatGroup: false,
				isManager: this.isManager,
				isLocal: this.isLocal,
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
		if (this.realFederated) {
			this.handleSearchFederatedMembers(text);
			return;
		}
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

	handleRemoveFromTeam = async (selectedUser: TUserModel) => {
		try {
			const { navigation } = this.props;
			const { room } = this.state;

			const result = await Services.teamListRoomsOfUser({ teamId: room.teamId as string, userId: selectedUser._id });

			if (result.success) {
				if (result.rooms?.length) {
					const teamChannels = result.rooms.map((r: any) => ({
						rid: r._id,
						name: r.name,
						teamId: r.teamId,
						alert: r.isLastOwner
					}));
					navigation.navigate('SelectListView', {
						title: 'Remove_Member',
						infoText: 'Remove_User_Team_Channels',
						data: teamChannels,
						nextAction: (selected: any) => this.removeFromTeam(selectedUser, selected),
						showAlert: () => showErrorAlert(I18n.t('Last_owner_team_room'), I18n.t('Cannot_remove'))
					});
				} else {
					showConfirmationAlert({
						message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
						confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
						onPress: () => this.removeFromTeam(selectedUser)
					});
				}
			}
		} catch (e) {
			showConfirmationAlert({
				message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
				confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
				onPress: () => this.removeFromTeam(selectedUser)
			});
		}
	};

	notifyMembers = (userId: string) => {
		if (this.realFederated) {
			const { federatedMembers } = this.state;
			const newFederatedMembers = federatedMembers.map(item => {
				if (item.isLocal) {
					item.members = item.members.filter(member => member._id !== userId);
				}
				return item;
			});
			this.setState({
				federatedMembers: newFederatedMembers
			});
		} else {
			const { members, membersFiltered } = this.state;
			const newMembers = members.filter(member => member._id !== userId);
			const newMembersFiltered = membersFiltered.filter(member => member._id !== userId);
			this.setState({
				members: newMembers,
				membersFiltered: newMembersFiltered
			});
		}
	};

	removeFromTeam = async (selectedUser: IUser, selected?: any) => {
		try {
			const { room } = this.state;
			const { navigation } = this.props;

			const userId = selectedUser._id;
			const result = await Services.removeTeamMember({
				teamId: room.teamId,
				userId,
				...(selected && { rooms: selected })
			});
			if (result.success) {
				const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
				EventEmitter.emit(LISTENER, { message });
				this.notifyMembers(userId);
				// @ts-ignore - This is just to force a reload
				navigation.navigate('RoomMembersView');
			}
		} catch (e: any) {
			log(e);
			showErrorAlert(
				e.data.error ? I18n.t(e.data.error) : I18n.t('There_was_an_error_while_action', { action: I18n.t('removing_team') }),
				I18n.t('Cannot_remove')
			);
		}
	};

	onPressUser = (selectedUser: TUserModel) => {
		const { room } = this.state;
		const { showActionSheet, theme } = this.props;
		const canGoDirect = !cannotGoDirect(selectedUser?.username);

		const options: TActionSheetOptionsItem[] = canGoDirect
			? [
					{
						icon: 'message',
						title: I18n.t('Direct_message'),
						onPress: () => this.navToDirectMessage(selectedUser)
					}
			  ]
			: [];

		// Ignore
		/*
		if (selectedUser._id !== user.id) {
			const { ignored } = room;
			const isIgnored = ignored?.includes?.(selectedUser._id);
			options.push({
				icon: 'ignore',
				title: I18n.t(isIgnored ? 'Unignore' : 'Ignore'),
				onPress: () => this.handleIgnore(selectedUser, !isIgnored),
				testID: 'action-sheet-ignore-user'
			});
		}
		if (this.permissions['mute-user']) {
			const { muted = [] } = room;
			const userIsMuted = muted.find?.(m => m === selectedUser.username);
			selectedUser.muted = !!userIsMuted;
			options.push({
				icon: userIsMuted ? 'audio' : 'audio-disabled',
				title: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t(`The_user_${userIsMuted ? 'will' : 'wont'}_be_able_to_type_in_roomName`, {
							roomName: getRoomTitle(room)
						}),
						confirmationText: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
						onPress: () => this.handleMute(selectedUser)
					});
				},
				testID: 'action-sheet-mute-user'
			});
		}
		 */

		const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
		const isOwner = userRoleResult?.roles.includes('owner');
		// Owner
		if (this.permissions['set-owner']) {
			options.push({
				icon: 'microphone',
				title: room.t === 'c' ? I18n.t('Owner_Channel') : I18n.t('Owner'),
				onPress: () => this.handleOwner(selectedUser, !isOwner),
				right: () => (
					<CustomIcon
						testID={isOwner ? 'action-sheet-set-owner-checked' : 'action-sheet-set-owner-unchecked'}
						name={isOwner ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isOwner ? themes[theme].tintActive : themes[theme].auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-owner'
			});
		}

		// Moderator
		if (this.permissions['set-moderator'] && !isOwner) {
			const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isModerator = userRoleResult?.roles.includes('moderator');
			options.push({
				icon: 'shield-alt',
				title: room.t === 'c' ? I18n.t('Moderator_Channel') : I18n.t('Moderator'),
				onPress: () => this.handleModerator(selectedUser, !isModerator),
				right: () => (
					<CustomIcon
						testID={isModerator ? 'action-sheet-set-moderator-checked' : 'action-sheet-set-moderator-unchecked'}
						name={isModerator ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isModerator ? themes[theme].tintActive : themes[theme].auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-moderator'
			});
		}

		// PDT
		if (this.permissions['set-pdt'] && room.t === 'p') {
			const isPDT = selectedUser?.roles?.includes('pdt') ?? false;
			options.push({
				icon: 'shield-alt',
				title: I18n.t('PDT_Manager'),
				onPress: () => this.handlePDT(selectedUser, isPDT),
				right: () => (
					<CustomIcon
						name={isPDT ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isPDT ? themes[theme].tintActive : themes[theme].auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-moderator'
			});
		}

		// Leader
		if (this.permissions['set-leader'] && !(selectedUser?.federated || cannotGoDirect(selectedUser.username))) {
			const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isLeader = userRoleResult?.roles.includes('leader');
			options.push({
				icon: <TopLeader />,
				title: isLeader ? I18n.t('UnpinToTop') : I18n.t('PinToTop'),
				onPress: () => this.handleLeader(selectedUser, !isLeader),
				testID: 'action-sheet-set-leader'
			});
		}

		// Remove from team
		if (this.permissions['edit-team-member']) {
			options.push({
				icon: 'logout',
				danger: true,
				title: I18n.t('Remove_from_Team'),
				onPress: () => this.handleRemoveFromTeam(selectedUser),
				testID: 'action-sheet-remove-from-team'
			});
		}

		const canRemoveUser = this.permissions['remove-user'] && !room.teamMain;
		// Remove from room
		if (canRemoveUser && !isOwner) {
			options.push({
				icon: 'logout',
				title: I18n.t('Remove_from_room'),
				danger: true,
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t('The_user_will_be_removed_from_s', { s: getRoomTitle(room) }),
						confirmationText: I18n.t('Yes_remove_user'),
						onPress: () => this.handleRemoveUserFromRoom(selectedUser)
					});
				},
				testID: 'action-sheet-remove-from-room'
			});
		}

		showActionSheet({
			options,
			hasCancel: true
		});
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
				this.filterRoles([]);
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

	fetchFederatedMembers = async () => {
		const { rid } = this.state;
		this.setState({ isLoading: true });
		try {
			const memberResult = await Services.getFederatedRoomMembers(rid);
			this.setState({
				federatedMembers: memberResult.data
			});
		} catch (e) {
			log(e);
		} finally {
			this.setState({ isLoading: false });
		}
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
			newMembers = newMembers.map(item => {
				if (!this.roleIds.includes(item._id) && item.roles && item.roles.length > 0 && !item.roles.includes('pdt')) {
					return { ...item, roles: [] };
				}
				return item;
			});
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
		this.realFederated ? this.fetchFederatedMembers() : null;
		this.fetchRoomMembersRoles();
	};

	handlePDT = async (selectedUser: TUserModel, isPDT: boolean) => {
		try {
			const { room } = this.state;
			let message = '';
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
		this.realFederated ? this.fetchFederatedMembers() : this.fetchMembers('');
	};

	handleLeader = async (selectedUser: TUserModel, isLeader: boolean) => {
		try {
			const { dispatch } = this.props;
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
			dispatch(updateRoomLeader());
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
			// @ts-ignore
			showToast(I18n.t(e.data.errorType));
			log(e);
		}
		// todo 这里存在风险，内外群组都是用的同一个 fetchRoomMembersRoles（）接口，这个接口只能获取群组中内部的角色
		// 后续如果可以对外部成员进行操作的时候，那么就会出错
		if (this.realFederated) {
			this.fetchFederatedMembers();
		} else {
			this.setState({
				end: false,
				members: []
			});
			this.currentPage = 0;
			this.fetchMembers('');
		}
		this.fetchRoomMembersRoles();
	};

	handleIgnore = async (selectedUser: TUserModel, ignore: boolean) => {
		try {
			const { room } = this.state;
			await Services.ignoreUser({
				rid: room.rid,
				userId: selectedUser._id,
				ignore
			});
			const message = I18n.t(ignore ? 'User_has_been_ignored' : 'User_has_been_unignored');
			EventEmitter.emit(LISTENER, { message });
		} catch (e) {
			log(e);
		}
	};

	handleRemoveUserFromRoom = async (selectedUser: TUserModel) => {
		try {
			const { room } = this.state;
			const userId = selectedUser._id;
			// TODO: interface SubscriptionType on IRoom is wrong
			await Services.removeUserFromRoom({ roomId: room.rid, t: room.t as RoomTypes, userId });
			const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
			EventEmitter.emit(LISTENER, { message });
			this.notifyMembers(userId);
		} catch (e) {
			// @ts-ignore
			showToast(I18n.t(e.data.errorType));
			log(e);
		}
	};

	renderSearchBar = () => <SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='room-members-view-search' />;

	renderItem = ({ item }: { item: any }) => {
		const canOperate = this.permissions['remove-user'];
		const isDepartment = item.type === 'DEPARTMENT';
		return isDepartment ? (
			<DepartmentItem
				avatar={item.avatar}
				count={item.count}
				name={item.departmentName}
				onPress={() => {}}
				disabled={!canOperate}
			/>
		) : (
			<UserItem
				name={item.name as string}
				username={item.username}
				onPress={() => (item.username && item.username.includes(':') ? null : this.onPressUser(item))}
				testID={`room-members-view-item-${item.username}`}
				roles={item.roles}
				_id={item._id}
				t={this.state.room.t}
				style={{ backgroundColor: '#fafafa', paddingStart: 30 }}
				isFederated={item?.federated || cannotGoDirect(item.username)}
			/>
		);
	};

	handleSearchFederatedMembers = (text: string) => {
		const { federatedMembers } = this.state;
		const pattern = new RegExp(text, 'i');
		const result = [] as TUserModel[];
		federatedMembers?.forEach(item => {
			item?.members?.forEach(member => {
				if (pattern.test(member.username) || pattern.test(member.name ?? '')) {
					result.push(member);
				}
			});
		});
		this.setState({
			membersFiltered: result,
			filtering: text
		});
	};

	renderFederatedMembers = () => {
		const { federatedMembers, filtering, membersFiltered } = this.state;
		const { theme } = this.props;
		const memberCollapse = () => (
			<ScrollView>
				<>
					{federatedMembers?.map(item => (
						<CollapsedList
							members={item.members}
							renderItem={this.renderItem}
							title={item.org}
							isLocal={item.isLocal}
							logo={item.logo}
						></CollapsedList>
					))}
				</>
			</ScrollView>
		);

		const memberSearch = () => (
			<FlatList
				data={membersFiltered}
				renderItem={this.renderItem}
				style={[{ backgroundColor: themes[theme].backgroundColor }]}
				keyExtractor={item => item._id}
				ItemSeparatorComponent={List.Separator}
				maxToRenderPerBatch={5}
				windowSize={100}
				getItemLayout={(_data, index) => ({ length: 54, offset: 54 * index, index })}
			/>
		);
		return (
			<>
				{this.renderSearchBar()}
				{filtering.length !== 0 ? memberSearch() : memberCollapse()}
			</>
		);
	};

	renderLocalMembers = () => {
		const { filtering, members, membersFiltered, isLoading } = this.state;
		const newArray = [...this.departments, ...members];
		const { theme } = this.props;

		return (
			<FlatList
				data={filtering.length !== 0 ? membersFiltered : newArray}
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
		);
	};

	render() {
		return (
			<SafeAreaView testID='room-members-view' style={{ height: '100%', backgroundColor: '#fff' }}>
				<StatusBar />
				{this.realFederated ? this.renderFederatedMembers() : this.renderLocalMembers()}
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
	setPDTPermission: state.permissions['set-pdt'],
	setModeratorPermission: state.permissions['set-moderator'],
	removeUserPermission: state.permissions['remove-user'],
	editTeamMemberPermission: state.permissions['edit-team-member'],
	viewAllTeamChannelsPermission: state.permissions['view-all-team-channels'],
	viewAllTeamsPermission: state.permissions['view-all-teams'],
	accessPMembers: (state.settings.Appia_Create_External_Discussion_Members as string)?.split(',') || [],
	accessCMembers: (state.settings.Appia_Create_External_Channel_Members as string)?.split(',') || [],
	username: getUserSelector(state).username
});

export default connect(mapStateToProps)(withTheme(withActionSheet(RoomMembersView)));
