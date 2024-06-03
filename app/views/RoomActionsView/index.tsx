/* eslint-disable complexity */
import { Q } from '@nozbe/watermelondb';
import { StackNavigationOptions } from '@react-navigation/stack';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { Dimensions, Image, Share, Switch, Text, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { Observable, Subscription } from 'rxjs';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import FastImage from 'react-native-fast-image';

import { deleteRoom, leaveRoom } from '../../actions/room';
import { reset, setLoading } from '../../actions/selectedUsers';
import Avatar from '../../containers/Avatar';
import * as HeaderButton from '../../containers/HeaderButton';
import { BackButton } from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import { MarkdownPreview } from '../../containers/markdown';
// import RoomTypeIcon from '../../containers/RoomTypeIcon';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import {
	IApplicationState,
	IBaseScreen,
	IRoomDepartment,
	IRoomNotifications,
	ISubscription,
	IUser,
	SubscriptionType,
	TSubscriptionModel,
	TUserModel
} from '../../definitions';
import { withDimensions } from '../../dimensions';
import I18n from '../../i18n';
import database from '../../lib/database';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import { getUserSelector } from '../../selectors/login';
import { ChatsStackParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import log, { events, logEvent } from '../../utils/log';
import Touch from '../../utils/touch';
import styles from './styles';
import { ERoomType } from '../../definitions/ERoomType';
import { E2E_ROOM_TYPES, SWITCH_TRACK_COLOR, themes } from '../../lib/constants';
import { compareServerVersion } from '../../lib/methods/helpers/compareServerVersion';
import {
	callJitsi,
	canAutoTranslate as canAutoTranslateMethod,
	getPermalinkChannel,
	getRoomAvatar,
	getRoomTitle,
	getUidDirectMessage,
	hasPermission,
	isGroupChat,
	isIOS
} from '../../lib/methods';
import { Services } from '../../lib/services';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import store from '../../lib/store';
import { updateSchedule } from '../../actions/schedule';
import { closeLivechat } from '../../lib/methods/helpers/closeLivechat';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';
import { ILivechatTag } from '../../definitions/ILivechatTag';
import { DrawerMenu } from '../../containers/DrawerMenu';
import Button from '../../containers/Button';
import { showToast } from '../../lib/methods/helpers/showToast';
import { ISelectedUser } from '../../reducers/selectedUsers';

interface IOnPressTouch {
	<T extends keyof ChatsStackParamList>(item: { route?: T; params?: ChatsStackParamList[T]; event?: Function }): void;
}

interface IRoomActionsViewProps extends IBaseScreen<ChatsStackParamList, 'RoomActionsView'> {
	userId: string;
	jitsiEnabled: boolean;
	jitsiEnableTeams: boolean;
	jitsiEnableChannels: boolean;
	encryptionEnabled: boolean;
	fontScale: number;
	serverVersion: string | null;
	addUserToJoinedRoomPermission?: string[];
	addUserToAnyCRoomPermission?: string[];
	addUserToAnyPRoomPermission?: string[];
	createInviteLinksPermission?: string[];
	addUserToPrivateCRoom?: string[];
	editRoomPermission?: string[];
	toggleRoomE2EEncryptionPermission?: string[];
	viewBroadcastMemberListPermission?: string[];
	transferLivechatGuestPermission?: string[];
	createTeamPermission?: string[];
	addTeamChannelPermission?: string[];
	convertTeamPermission?: string[];
	viewCannedResponsesPermission?: string[];
	livechatAllowManualOnHold?: boolean;
	roomValueProposition?: string;
	livechatRequestComment?: boolean;
	removeUserPermission?: string[];
	enterprise?: string;
	user?: string;
	selectedUsers?: ISelectedUser[];
	username: string;
	accessPMembers: string[];
	accessCMembers: string[];
}

interface IRoomActionsViewState {
	room: TRoomAddNotificationsModel;
	membersCount: number;
	member: Partial<IUser>;
	joined: boolean;
	canViewMembers: boolean;
	canAutoTranslate: boolean;
	canAddUser: boolean;
	canRemoveUser: boolean;
	canInviteUser: boolean;
	canForwardGuest: boolean;
	canReturnQueue: boolean;
	canEdit: boolean;
	canToggleEncryption: boolean;
	canCreateTeam: boolean;
	canAddChannelToTeam: boolean;
	canConvertTeam: boolean;
	canViewCannedResponse: boolean;
	canPlaceLivechatOnHold: boolean;
	isOnHold: boolean;
	members: TUserModel[];
	isShowBottom: boolean;
	departments: IRoomDepartment[];
}
export type TRoomAddNotificationsModel = IRoomNotifications & TSubscriptionModel;
class RoomActionsView extends React.Component<IRoomActionsViewProps, IRoomActionsViewState> {
	private mounted: boolean;
	private rid: string;
	private t: string;
	private joined: boolean;
	private roomObservable?: Observable<TRoomAddNotificationsModel>;
	private subscription?: Subscription;
	private canDeleteRoom?: boolean;
	private owner: string | undefined;
	private ownerOrg: string | undefined;
	private accessedCreateFederation: boolean;
	private isLocal: boolean;
	private isManager: boolean;

	static navigationOptions = ({
		navigation,
		isMasterDetail
	}: Pick<IRoomActionsViewProps, 'navigation' | 'isMasterDetail'>): StackNavigationOptions => {
		const options: StackNavigationOptions = {
			headerTitleAlign: 'center',
			title: I18n.t('Actions'),
			headerLeft: () => <BackButton navigation={navigation} />
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='room-actions-view-close' />;
		}
		return options;
	};

	constructor(props: IRoomActionsViewProps) {
		super(props);
		this.mounted = false;
		this.canDeleteRoom = false;
		const room = props.route.params?.room;
		const member = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.joined = props.route.params?.joined;
		this.isLocal = props.route.params?.isLocal as unknown as boolean;
		this.isManager = props.route.params?.isManager as unknown as boolean;
		this.accessedCreateFederation = (room.t === 'c' ? props.accessCMembers : props.accessPMembers)?.includes(props.username);
		this.state = {
			room: room || { rid: this.rid, t: this.t },
			membersCount: 0,
			member: member || {},
			joined: !!room,
			canViewMembers: false,
			canAutoTranslate: false,
			canAddUser: false,
			canRemoveUser: false,
			canInviteUser: false,
			canForwardGuest: false,
			canReturnQueue: false,
			canEdit: false,
			canToggleEncryption: false,
			canCreateTeam: false,
			canAddChannelToTeam: false,
			canConvertTeam: false,
			canViewCannedResponse: false,
			canPlaceLivechatOnHold: false,
			isOnHold: false,
			members: [],
			isShowBottom: false,
			departments: []
		};
		if (room && room.observe && room.rid) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable.subscribe(changes => {
				if (this.mounted) {
					this.setState({ room: changes, isOnHold: !!changes?.onHold });
				} else {
					// @ts-ignore
					this.state.room = changes;
				}
			});
		}
	}

	getCanDeleteRoom = async () => {
		const { room } = this.state;
		const { t, rid } = room;
		const { permissions } = store.getState();
		if (t !== 'c' && t !== 'p') {
			return;
		}
		const permission = permissions[t === 'c' ? 'delete-c' : 'delete-p'];
		const result = await hasPermission([permission], rid);
		this.canDeleteRoom = result.some(Boolean) && this.isLocal;
	};

	getRoomValueProposition = async (rid: string) => {
		const result = await Services.getRoomInfo(rid);
		this.setState({
			// @ts-ignore
			roomValueProposition: result?.room?.valueProposition?.message
		});
		// @ts-ignore
		store.dispatch(updateSchedule(result?.room?.valueProposition?.message));
	};

	async componentDidMount() {
		this.mounted = true;
		const { room, member } = this.state;
		if (room.rid) {
			if (!room.id) {
				if (room.t === SubscriptionType.OMNICHANNEL) {
					if (!this.isOmnichannelPreview) {
						const result = await getSubscriptionByRoomId(room.rid);
						if (result) {
							this.setState({ room: result });
						}
					}
				} else {
					try {
						const result = await Services.getChannelInfo(room.rid);
						if (result.success) {
							// @ts-ignore
							this.setState({ room: { ...result.channel, rid: result.channel._id } });
						}
					} catch (e) {
						log(e);
					}
				}
			}

			if (room && room.t !== 'd' && (await this.canViewMembers())) {
				try {
					const counters = await Services.getRoomCounters(room.rid, room.t as any);
					if (counters.success) {
						this.setState({ membersCount: counters.members, joined: counters.joined });
					}
				} catch (e) {
					log(e);
				}
			} else if (room.t === 'd' && isEmpty(member)) {
				this.updateRoomMember();
			}

			const canAutoTranslate = canAutoTranslateMethod();
			const canAddUser = await this.canAddUser();
			const canRemoveUser = await this.canRemoveUser();
			const canInviteUser = await this.canInviteUser();
			const canEdit = await this.canEdit();
			const canToggleEncryption = await this.canToggleEncryption();
			const canViewMembers = await this.canViewMembers();
			const canCreateTeam = await this.canCreateTeam();
			const canAddChannelToTeam = await this.canAddChannelToTeam();
			const canConvertTeam = await this.canConvertTeam();

			this.setState({
				canAutoTranslate,
				canAddUser,
				canRemoveUser,
				canInviteUser,
				canEdit,
				canToggleEncryption,
				canViewMembers,
				canCreateTeam,
				canAddChannelToTeam,
				canConvertTeam
			});

			// livechat permissions
			if (room.t === 'l') {
				const canForwardGuest = await this.canForwardGuest();
				const canReturnQueue = await this.canReturnQueue();
				const canViewCannedResponse = await this.canViewCannedResponse();
				const canPlaceLivechatOnHold = this.canPlaceLivechatOnHold();
				this.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
			}
		}
		this.fetchMembers();
		this.getRoomValueProposition(this.rid);
		this.getCanDeleteRoom();
		this.fetchDepartment();
	}

	async componentDidUpdate(prevProps: IRoomActionsViewProps, prevState: IRoomActionsViewState) {
		const { livechatAllowManualOnHold } = this.props;
		const { room, isOnHold, membersCount, joined } = this.state;

		if (
			room.t === 'l' &&
			(isOnHold !== prevState.isOnHold || prevProps.livechatAllowManualOnHold !== livechatAllowManualOnHold)
		) {
			const canPlaceLivechatOnHold = this.canPlaceLivechatOnHold();
			this.setState({ canPlaceLivechatOnHold });
		}

		if (room.t !== 'd' && (await this.canViewMembers()) && prevState.membersCount === membersCount) {
			try {
				const counters = await Services.getRoomCounters(room.rid, room.t as any);
				if (counters.success && (counters.members !== membersCount || counters.joined !== joined)) {
					this.setState({ membersCount: counters.members, joined: counters.joined });
					this.fetchMembers();
				}
			} catch (e) {
				log(e);
			}
		}
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	get isOmnichannelPreview() {
		const { room } = this.state;
		return room.t === 'l' && room.status === 'queued' && !this.joined;
	}

	onPressTouchable: IOnPressTouch = (item: {
		route?: keyof ChatsStackParamList;
		params?: ChatsStackParamList[keyof ChatsStackParamList];
		event?: Function;
	}) => {
		const { route, event, params } = item;
		if (route) {
			/**
			 * TODO: params can vary too much and ts is going to be happy
			 * Instead of playing with this, we should think on a better `logEvent` function
			 */
			// @ts-ignore
			logEvent(events[`RA_GO_${route.replace('View', '').toUpperCase()}${params.name ? params.name.toUpperCase() : ''}`]);
			const { navigation } = this.props;
			navigation.navigate(route, params);
		}
		if (event) {
			return event();
		}
	};

	goSearchView = () => {
		const { room } = this.state;
		const { rid, t, encrypted } = room;
		const { navigation, isMasterDetail } = this.props;
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'SearchMessagesView',
				params: { rid, showCloseModal: true, encrypted }
			});
		} else {
			navigation.navigate('SearchMessagesView', { rid, t: t as SubscriptionType, encrypted });
		}
	};

	canAddUser = async () => {
		const { room, joined } = this.state;
		const { addUserToJoinedRoomPermission } = this.props;
		const { rid } = room;
		let canAddUser = false;

		const userInRoom = joined;
		const permissions = await hasPermission([addUserToJoinedRoomPermission], rid);

		/**
		 const permissions = await hasPermission(
		 [addUserToJoinedRoomPermission, addUserToAnyCRoomPermission, addUserToAnyPRoomPermission, addUserToPrivateCRoom],
		 rid
		 );

		 // 外部群组权限单独做控制, federated 字端存在缺陷，当房间没有外部成员的时候会显示没有 +
		 if (hasShowTagPermission(room.showAppiaTag, APPIA_TAG.external)) {
			if (!userInRoom) return false;
			// 除了主管能添加成员，非主管的 Sponsor(owner) 也可以添加成员
			return this.isManager || room?.roles?.findIndex(item => item === 'owner') !== -1;
		}
		 */
		// 加人权限重做
		if (userInRoom && permissions[0]) {
			canAddUser = true;
		}
		return canAddUser;
	};

	canRemoveUser = async () => {
		const { room } = this.state;
		const { removeUserPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([removeUserPermission], rid);

		console.info(permissions[0], this.isManager);
		const canRemoveUser = permissions[0];
		return canRemoveUser;
	};

	canInviteUser = async () => {
		const { room } = this.state;
		const { createInviteLinksPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([createInviteLinksPermission], rid);

		const canInviteUser = permissions[0];
		return canInviteUser && this.isLocal;
	};

	canEdit = async () => {
		const { room } = this.state;
		const { editRoomPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([editRoomPermission], rid);

		const canEdit = permissions[0];
		return canEdit && this.isLocal;
	};

	canCreateTeam = async () => {
		const { room } = this.state;
		const { createTeamPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([createTeamPermission], rid);

		const canCreateTeam = permissions[0];
		return canCreateTeam && this.isLocal;
	};

	canAddChannelToTeam = async () => {
		const { room } = this.state;
		const { addTeamChannelPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([addTeamChannelPermission], rid);

		const canAddChannelToTeam = permissions[0];
		return canAddChannelToTeam && this.isLocal;
	};

	canConvertTeam = async () => {
		const { room } = this.state;
		const { convertTeamPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([convertTeamPermission], rid);

		const canConvertTeam = permissions[0];
		return canConvertTeam && this.isLocal;
	};

	canToggleEncryption = async () => {
		const { room } = this.state;
		const { toggleRoomE2EEncryptionPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([toggleRoomE2EEncryptionPermission], rid);

		const canToggleEncryption = permissions[0];
		return canToggleEncryption && this.isLocal;
	};

	canViewMembers = async () => {
		const { room } = this.state;
		const { viewBroadcastMemberListPermission } = this.props;
		const { rid, t, broadcast } = room;
		if (broadcast) {
			const permissions = await hasPermission([viewBroadcastMemberListPermission], rid);
			if (!permissions[0]) {
				return false;
			}
		}

		// This method is executed only in componentDidMount and returns a value
		// We save the state to read in render
		const result = t === 'c' || t === 'p';
		return result;
	};

	canForwardGuest = async () => {
		const { room } = this.state;
		const { transferLivechatGuestPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([transferLivechatGuestPermission], rid);
		return permissions[0];
	};

	canViewCannedResponse = async () => {
		const { room } = this.state;
		const { viewCannedResponsesPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([viewCannedResponsesPermission], rid);
		return permissions[0];
	};

	canPlaceLivechatOnHold = (): boolean => {
		const { livechatAllowManualOnHold } = this.props;
		const { room } = this.state;

		return !!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);
	};

	canReturnQueue = async () => {
		try {
			const { returnQueue } = await Services.getRoutingConfig();
			return returnQueue;
		} catch {
			return false;
		}
	};

	renderEncryptedSwitch = () => {
		const { room, canToggleEncryption, canEdit } = this.state;
		const { encrypted } = room;
		const { serverVersion } = this.props;
		let hasPermission = false;
		if (compareServerVersion(serverVersion, 'lowerThan', '3.11.0')) {
			hasPermission = canEdit;
		} else {
			hasPermission = canToggleEncryption;
		}
		return (
			<Switch value={encrypted} trackColor={SWITCH_TRACK_COLOR} onValueChange={this.toggleEncrypted} disabled={!hasPermission} />
		);
	};

	closeLivechat = async () => {
		const {
			room: { rid, departmentId }
		} = this.state;
		const { livechatRequestComment, isMasterDetail, navigation } = this.props;
		let departmentInfo: ILivechatDepartment | undefined;
		let tagsList: ILivechatTag[] | undefined;

		if (departmentId) {
			const result = await Services.getDepartmentInfo(departmentId);
			if (result.success) {
				departmentInfo = result.department as ILivechatDepartment;
			}
		}

		if (departmentInfo?.requestTagBeforeClosingChat) {
			tagsList = await Services.getTagsList();
		}

		if (!livechatRequestComment && !departmentInfo?.requestTagBeforeClosingChat) {
			const comment = I18n.t('Chat_closed_by_agent');
			return closeLivechat({ rid, isMasterDetail, comment });
		}

		navigation.navigate('CloseLivechatView', { rid, departmentId, departmentInfo, tagsList });
	};

	placeOnHoldLivechat = () => {
		const { navigation } = this.props;
		const { room } = this.state;
		showConfirmationAlert({
			title: I18n.t('Are_you_sure_question_mark'),
			message: I18n.t('Would_like_to_place_on_hold'),
			confirmationText: I18n.t('Yes'),
			onPress: async () => {
				try {
					await Services.onHoldLivechat(room.rid);
					navigation.navigate('RoomsListView');
				} catch (e: any) {
					showErrorAlert(e.data?.error, I18n.t('Oops'));
				}
			}
		});
	};

	returnLivechat = () => {
		const {
			room: { rid }
		} = this.state;
		showConfirmationAlert({
			message: I18n.t('Would_you_like_to_return_the_inquiry'),
			confirmationText: I18n.t('Yes'),
			onPress: async () => {
				try {
					await Services.returnLivechat(rid);
				} catch (e: any) {
					showErrorAlert(e.reason, I18n.t('Oops'));
				}
			}
		});
	};

	updateRoomMember = async () => {
		const { room } = this.state;

		try {
			if (!isGroupChat(room)) {
				const roomUserId = getUidDirectMessage(room);
				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					this.setState({ member: result.user as any });
				}
			}
		} catch (e) {
			log(e);
			this.setState({ member: {} });
		}
	};

	addUser = (isFederated?: boolean) => {
		const { room } = this.state;
		const { dispatch, navigation, enterprise, user, selectedUsers } = this.props;
		const { rid, federated } = room;
		try {
			dispatch(setLoading(true));
			if (isFederated) {
				// 添加外部成员 (现在不允许这种情况，即条件不成立)
				Services.joinFederationRoom(rid, (enterprise as unknown as string).toLowerCase(), user as unknown as string, false);

				// @ts-ignore
				if (selectedUsers?.length >= 5) {
					// @ts-ignore
					const time = selectedUsers?.length * 2;
					showToast(`添加外部成员大约需要${time > 60 ? `${Math.round(time / 60)}分钟` : `${time}秒`}，请稍后操作`);
				}

				setTimeout(() => {
					dispatch(setLoading(false));
					navigation.pop(2);
					dispatch(reset());
				}, 2000);
			} else {
				Services.addUsersToRoom(rid, federated);
				navigation.pop();
				dispatch(reset());
			}
		} catch (e) {
			console.info('e', e);
			showToast('添加人员失败');
			log(e);
			dispatch(setLoading(false));
		}
	};

	toggleBlockUser = async () => {
		logEvent(events.RA_TOGGLE_BLOCK_USER);
		const { room } = this.state;
		const { rid, blocker } = room;
		const { member } = this.state;
		try {
			await Services.toggleBlockUser(rid, member._id as string, !blocker);
		} catch (e) {
			logEvent(events.RA_TOGGLE_BLOCK_USER_F);
			log(e);
		}
	};

	toggleEncrypted = async () => {
		logEvent(events.RA_TOGGLE_ENCRYPTED);
		const { room } = this.state;
		const { rid } = room;
		const db = database.active;

		// Toggle encrypted value
		const encrypted = !room.encrypted;
		try {
			// Instantly feedback to the user
			await db.write(async () => {
				await room.update(
					protectedFunction((r: TSubscriptionModel) => {
						r.encrypted = encrypted;
					})
				);
			});

			try {
				// Send new room setting value to server
				const { result } = await Services.saveRoomSettings(rid, { encrypted });
				// If it was saved successfully
				if (result) {
					return;
				}
			} catch {
				// do nothing
			}

			// If something goes wrong we go back to the previous value
			await db.write(async () => {
				await room.update(
					protectedFunction((r: TSubscriptionModel) => {
						r.encrypted = room.encrypted;
					})
				);
			});
		} catch (e) {
			logEvent(events.RA_TOGGLE_ENCRYPTED_F);
			log(e);
		}
	};

	handleShare = () => {
		logEvent(events.RA_SHARE);
		const { room } = this.state;
		const permalink = getPermalinkChannel(room);
		if (!permalink) {
			return;
		}
		Share.share({
			message: permalink
		});
	};

	leaveChannel = () => {
		const { room } = this.state;
		const { dispatch } = this.props;

		showConfirmationAlert({
			message: I18n.t('Are_you_sure_you_want_to_leave_the_room', { room: getRoomTitle(room) }),
			confirmationText: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
			onPress: () => dispatch(leaveRoom(ERoomType.c, room))
		});
	};

	convertTeamToChannel = async () => {
		const { room } = this.state;
		const { navigation, userId } = this.props;

		try {
			if (!room.teamId) {
				return;
			}
			const result = await Services.teamListRoomsOfUser({ teamId: room.teamId, userId });

			if (result.success) {
				if (result.rooms?.length) {
					const teamChannels = result.rooms.map(r => ({
						rid: r._id,
						name: r.name,
						teamId: r.teamId
					}));
					navigation.navigate('SelectListView', {
						title: 'Converting_Team_To_Channel',
						data: teamChannels,
						infoText: 'Select_Team_Channels_To_Delete',
						nextAction: (data: string[]) => this.convertTeamToChannelConfirmation(data)
					});
				} else {
					this.convertTeamToChannelConfirmation();
				}
			}
		} catch (e) {
			this.convertTeamToChannelConfirmation();
		}
	};

	handleConvertTeamToChannel = async (selected: string[]) => {
		logEvent(events.RA_CONVERT_TEAM_TO_CHANNEL);
		try {
			const { room } = this.state;
			const { navigation } = this.props;

			if (!room.teamId) {
				return;
			}
			const result = await Services.convertTeamToChannel({ teamId: room.teamId, selected });

			if (result.success) {
				navigation.navigate('RoomView');
			}
		} catch (e) {
			logEvent(events.RA_CONVERT_TEAM_TO_CHANNEL_F);
			log(e);
		}
	};

	convertTeamToChannelConfirmation = (selected: string[] = []) => {
		showConfirmationAlert({
			title: I18n.t('Confirmation'),
			message: I18n.t('You_are_converting_the_team'),
			confirmationText: I18n.t('Convert'),
			onPress: () => this.handleConvertTeamToChannel(selected)
		});
	};

	leaveTeam = async () => {
		const { room } = this.state;
		const { navigation, dispatch, userId } = this.props;

		try {
			if (!room.teamId) {
				return;
			}
			const result = await Services.teamListRoomsOfUser({ teamId: room.teamId, userId });

			if (result.success) {
				if (result.rooms?.length) {
					const teamChannels = result.rooms.map(r => ({
						rid: r._id,
						name: r.name,
						teamId: r.teamId,
						alert: r.isLastOwner
					}));
					navigation.navigate('SelectListView', {
						title: 'Leave_Team',
						data: teamChannels as any,
						infoText: 'Select_Team_Channels',
						nextAction: data => dispatch(leaveRoom(ERoomType.t, room, data)),
						showAlert: () => showErrorAlert(I18n.t('Last_owner_team_room'), I18n.t('Cannot_leave'))
					});
				} else {
					showConfirmationAlert({
						message: I18n.t('You_are_leaving_the_team', { team: getRoomTitle(room) }),
						confirmationText: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
						onPress: () => dispatch(leaveRoom(ERoomType.t, room))
					});
				}
			}
		} catch (e) {
			showConfirmationAlert({
				message: I18n.t('You_are_leaving_the_team', { team: getRoomTitle(room) }),
				confirmationText: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
				onPress: () => dispatch(leaveRoom(ERoomType.t, room))
			});
		}
	};

	handleConvertToTeam = async () => {
		logEvent(events.RA_CONVERT_TO_TEAM);
		try {
			const { room } = this.state;
			const { navigation } = this.props;
			const result = await Services.convertChannelToTeam({ rid: room.rid, name: room.name, type: room.t as any });

			if (result.success) {
				navigation.navigate('RoomView');
			}
		} catch (e) {
			logEvent(events.RA_CONVERT_TO_TEAM_F);
			log(e);
		}
	};

	convertToTeam = () => {
		showConfirmationAlert({
			title: I18n.t('Confirmation'),
			message: I18n.t('Convert_to_Team_Warning'),
			confirmationText: I18n.t('Convert'),
			onPress: () => this.handleConvertToTeam()
		});
	};

	handleMoveToTeam = async (selected: string[]) => {
		logEvent(events.RA_MOVE_TO_TEAM);
		try {
			const { room } = this.state;
			const { navigation } = this.props;
			const result = await Services.addRoomsToTeam({ teamId: selected?.[0], rooms: [room.rid] });
			if (result.success) {
				navigation.navigate('RoomView');
			}
		} catch (e) {
			logEvent(events.RA_MOVE_TO_TEAM_F);
			log(e);
			showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('moving_channel_to_team') }));
		}
	};

	moveToTeam = async () => {
		try {
			const { navigation } = this.props;
			const db = database.active;
			const subCollection = db.get('subscriptions');
			const teamRooms = await subCollection.query(Q.where('team_main', true)).fetch();

			if (teamRooms.length) {
				const data = teamRooms.map(team => ({
					rid: team.teamId as string,
					t: team.t,
					name: team.name
				}));
				navigation.navigate('SelectListView', {
					title: 'Move_to_Team',
					infoText: 'Move_Channel_Paragraph',
					nextAction: () => {
						navigation.push('SelectListView', {
							title: 'Select_Team',
							data,
							isRadio: true,
							isSearch: true,
							onSearch: onChangeText => this.searchTeam(onChangeText),
							nextAction: selected =>
								showConfirmationAlert({
									title: I18n.t('Confirmation'),
									message: I18n.t('Move_to_Team_Warning'),
									confirmationText: I18n.t('Yes_action_it', { action: I18n.t('move') }),
									onPress: () => this.handleMoveToTeam(selected)
								})
						});
					}
				});
			}
		} catch (e) {
			log(e);
		}
	};

	searchTeam = async (onChangeText: string) => {
		logEvent(events.RA_SEARCH_TEAM);
		try {
			const { addTeamChannelPermission, createTeamPermission } = this.props;
			const QUERY_SIZE = 50;
			const db = database.active;
			const teams = await db
				.get('subscriptions')
				.query(
					Q.where('team_main', true),
					Q.where('name', Q.like(`%${onChangeText}%`)),
					Q.experimentalTake(QUERY_SIZE),
					Q.experimentalSortBy('room_updated_at', Q.desc)
				)
				.fetch();

			const asyncFilter = async (teamArray: TSubscriptionModel[]) => {
				const results = await Promise.all(
					teamArray.map(async team => {
						const permissions = await hasPermission([addTeamChannelPermission, createTeamPermission], team.rid);
						if (!permissions[0]) {
							return false;
						}
						return true;
					})
				);

				return teamArray.filter((_v, index) => results[index]);
			};
			const teamsFiltered = await asyncFilter(teams);
			return teamsFiltered;
		} catch (e) {
			log(e);
		}
	};

	fetchMembers = async () => {
		const { room } = this.state;
		const { t } = room;
		try {
			const membersResult = await Services.getRoomMembers({
				rid: this.rid,
				roomType: t,
				type: 'all',
				filter: '',
				skip: 0,
				limit: 10,
				allUsers: true
			});
			this.setState({
				members: membersResult || []
			});
		} catch (e) {
			log(e);
		}
	};

	fetchDepartment = async () => {
		const { rid } = this.state.room;
		try {
			const res = await Services.getRoomDepartment(rid);
			const { departments = [] } = res?.data;
			this.setState({
				departments
			});
		} catch (e) {
			log(e);
		}
	};

	renderRoomInfo = () => {
		const { room, member, members, canAddUser, canRemoveUser, canViewMembers, departments } = this.state;
		// @ts-ignore
		const newArray: (IRoomDepartment & TUserModel)[] = [...departments, ...members];
		const { rid, name, t } = room;
		const { theme, fontScale, navigation } = this.props;
		const isGroupChatHandler = isGroupChat(room);
		const avatar = getRoomAvatar(room);
		// const avatarSize = 45;
		const avatarSize = (Dimensions.get('window').width - 6 * 16 - 5 * 16) / 6;
		let sliceCout = 12;
		if (canAddUser) {
			sliceCout -= 1;
		}
		if (canRemoveUser) {
			sliceCout -= 1;
		}
		return (
			<List.Section style={[styles.roomInfoContainer, { marginTop: 16 }]}>
				{t === 'd' ? (
					<Touch
						onPress={() =>
							this.onPressTouchable({
								route: 'RoomInfoView',
								// forward room only if room isn't joined
								params: {
									rid,
									t,
									room,
									member
								}
							})
						}
						accessibilityLabel={I18n.t('Room_Info')}
						enabled={!isGroupChatHandler}
						testID='room-actions-info'
						theme={theme}
					>
						<View style={[styles.roomInfoView, { paddingTop: 16, paddingBottom: 16 }]}>
							<Avatar text={avatar} style={styles.avatar} size={46 * fontScale} type={t} rid={rid} />
							<View style={styles.roomTitleContainer}>
								<Text style={[styles.roomTitle, { color: themes[theme].titleText }]} numberOfLines={1}>
									{room.fname}
								</Text>

								<MarkdownPreview msg={`@${name}`} style={[styles.roomDescription, { color: themes[theme].auxiliaryText }]} />
							</View>
							{isGroupChatHandler ? null : <List.Icon name='chevron-right' style={styles.actionIndicator} />}
						</View>
					</Touch>
				) : null}
				{(['c', 'p'].includes(t) && canViewMembers) || isGroupChatHandler ? (
					<>
						<View style={styles.avatarContainer}>
							{newArray.slice(0, sliceCout).map(item => {
								const isDepartment = item.type === 'DEPARTMENT';
								const userOnPress = () => {
									const param = {
										rid: item._id,
										t: 'd'
									};
									// @ts-ignore
									navigation.navigate('RoomInfoView', param);
								};
								return isDepartment ? (
									<FastImage
										style={[{ width: avatarSize, height: avatarSize }, styles.avatar]}
										source={{
											uri: item.avatar,
											headers: RocketChatSettings.customHeaders,
											priority: FastImage.priority.high
										}}
									/>
								) : (
									<Avatar
										text={item.username || item.name}
										size={avatarSize}
										type={item.type}
										rid={rid}
										style={styles.avatar}
										onPress={() => userOnPress()}
									/>
								);
							})}
							{canAddUser && (
								<TouchableOpacity
									style={[{ width: avatarSize, height: avatarSize }, styles.avatar]}
									onPress={() => {
										this.fetchAllMembers();
									}}
								>
									<Image source={require('./image/icon_members_add.png')} style={{ width: avatarSize, height: avatarSize }} />
								</TouchableOpacity>
							)}
							{canRemoveUser && (
								<TouchableOpacity
									style={[{ width: avatarSize, height: avatarSize }, styles.avatar]}
									onPress={() =>
										this.onPressTouchable({ route: 'RoomMembersEditView', params: { rid, room, canAddUser, editMode: 1 } })
									}
								>
									<Image source={require('./image/icon_members_delete.png')} style={{ width: avatarSize, height: avatarSize }} />
								</TouchableOpacity>
							)}
						</View>
						{canViewMembers ? (
							<TouchableOpacity
								style={{ height: 40, alignContent: 'center', justifyContent: 'center' }}
								onPress={() =>
									this.onPressTouchable({
										route: 'RoomMembersView',
										params: {
											rid,
											room,
											canAddUser,
											departments,
											isManager: this.isManager,
											isLocal: this.isLocal
										}
									})
								}
							>
								<Text style={{ textAlign: 'center', fontSize: 16, color: '#666666' }}>{'查看更多成员 >'}</Text>
							</TouchableOpacity>
						) : null}
					</>
				) : null}
			</List.Section>
		);
	};

	renderAvatar = (item: TUserModel) => {
		const { room } = this.state;
		const { rid } = room;
		if (item.type === 'add') {
			<TouchableOpacity style={[{ width: 45, height: 45 }, styles.avatar]} onPress={() => this.fetchAllMembers()}>
				<Image source={require('../RoomActionsView/image/icon_members_add.png')} style={{ width: 45, height: 45 }} />
			</TouchableOpacity>;
		} else if (item.type === 'remove') {
			<Avatar text={item.username || item.name} size={45} type={item.type} rid={rid} style={styles.avatar} />;
		} else {
			<Avatar text={item.username || item.name} size={45} type={item.type} rid={rid} style={styles.avatar} />;
		}
	};

	renderGroupSetting = () => {
		const { room, joined } = this.state;
		const { t, announcement, rid, member } = room;
		const { theme, roomValueProposition, editRoomPermission } = this.props;
		const separator = '\u0001\u0002';
		const allMessage = (announcement?.message ?? '').split(separator);
		const message = allMessage && allMessage.length > 0 ? allMessage[0] : '';
		const mTitle = t === 'p' ? I18n.t('Team') : I18n.t('Channel');
		return ['c', 'p'].includes(t) ? (
			<List.Section style={[styles.roomInfoContainer, { paddingTop: 6, paddingBottom: 6, justifyContent: 'flex-end' }]}>
				<Touch
					theme={theme}
					style={styles.groupSettingContainer}
					onPress={async () => {
						const permissionToEdit = [editRoomPermission];
						const permissions = await hasPermission(permissionToEdit, room.rid);
						if (permissions.some(Boolean) || room.prid) {
							this.onPressTouchable({
								route: 'RoomInfoView',
								// forward room only if room isn't joined
								params: {
									rid,
									t,
									room,
									member
								}
							});
						}
					}}
				>
					<Text style={styles.itemTitle}>{`${mTitle}${t === 'c' ? I18n.t('Topic') : I18n.t('Name')}`}</Text>
					<Text
						style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
						numberOfLines={1}
						ellipsizeMode={'tail'}
					>
						{getRoomTitle(room)}
					</Text>
					<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
				</Touch>
				<List.Separator style={{ marginHorizontal: 15 }} />
				<Touch
					theme={theme}
					style={styles.groupSettingContainer}
					onPress={() =>
						this.onPressTouchable({
							route: 'AnnouncementView',
							params: {
								room
							}
						})
					}
				>
					<Text style={styles.itemTitle} numberOfLines={1}>{`${mTitle}${I18n.t('Announcement')}`}</Text>
					<Text
						style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
						numberOfLines={1}
						ellipsizeMode={'tail'}
					>
						{message ?? I18n.t('Empty_Announcement')}
					</Text>
					<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
				</Touch>
				{t === 'c' ? (
					<>
						<List.Separator style={{ marginHorizontal: 15 }} />
						<Touch
							theme={theme}
							style={styles.groupSettingContainer}
							onPress={() =>
								this.onPressTouchable({
									route: 'ScheduleView',
									params: {
										room,
										roomValueProposition,
										canEdit: true
									}
								})
							}
						>
							<Text style={styles.itemTitle} numberOfLines={1}>
								{I18n.t('Schedule')}
							</Text>
							<Text
								style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
								numberOfLines={1}
								ellipsizeMode={'tail'}
							>
								{roomValueProposition ?? I18n.t('Empty_Schedule')}
							</Text>
							<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
						</Touch>
					</>
				) : null}
				{room?.roles?.includes('owner') ? (
					<>
						<List.Separator style={{ marginHorizontal: 15 }} />
						<Touch
							theme={theme}
							style={styles.groupSettingContainer}
							onPress={() =>
								this.onPressTouchable({
									route: 'RoomGroupManageView',
									params: {
										room,
										rid,
										joined
									}
								})
							}
						>
							<Text style={[styles.itemTitle, { height: 40, alignSelf: 'baseline' }]} numberOfLines={1}>
								{`${mTitle}设置`}
							</Text>
							<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
						</Touch>
					</>
				) : null}
				{/**
				 {canAddUser && this.accessedCreateFederation ? (
					<>
						<List.Separator style={{ marginHorizontal: 15 }} />
						<Touch
							theme={theme}
							style={[styles.groupSettingContainer, { alignItems: 'center', marginBottom: 0 }]}
							onPress={() => {
								this.closeDrawer();
								this.onPressTouchable({
									route: 'ShareChannelView',
									params: {
										room,
										owner: this.owner || '',
										ownerOrg: this.ownerOrg || ''
									}
								});
							}}
						>
							<Text style={[styles.itemTitle, { height: 40, alignSelf: 'baseline' }]} numberOfLines={1}>
								{I18n.t('Share_Channel')}
							</Text>
							<QRCodeIcon />
							<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
						</Touch>
					</>
				) : null}
				 */}
			</List.Section>
		) : null;
	};

	fetchAllMembers = async () => {
		this.closeDrawer();
		const { room } = this.state;
		const { dispatch } = this.props;
		const { t } = room;
		try {
			dispatch(setLoading(true));
			const membersResult = await Services.getRoomMembers({
				rid: this.rid,
				roomType: t,
				type: 'all',
				filter: '',
				skip: 0,
				limit: 0,
				allUsers: true
			});
			dispatch(setLoading(false));
			this.onPressTouchable({
				route: 'SelectedUsersView',
				params: {
					room,
					isManager: this.isManager,
					isLocal: this.isLocal,
					title: I18n.t('Add_users'),
					includeMe: false,
					groupUsers: membersResult,
					nextAction: () => this.addUser(false)
				}
			});
			this.closeDrawer();
		} catch (e) {
			dispatch(setLoading(false));
			log(e);
		}
	};

	fetchExternalMembers = () => {
		this.closeDrawer();
		this.onPressTouchable({
			route: 'SelectedExternalUserView',
			params: {
				title: I18n.t('Add_External_Members'),
				nextAction: () => this.addUser(true),
				addExternal: true,
				rid: this.rid
			}
		});
	};

	closeDrawer = () => this.setState({ isShowBottom: false });

	renderDrawer = () => {
		const { isShowBottom, room } = this.state;
		return (
			<DrawerMenu
				visible={isShowBottom}
				hideModal={this.closeDrawer}
				Height={isIOS ? 180 : 160}
				children={
					<List.Container>
						<Button
							title={I18n.t('Add_Internal_Members')}
							onPress={this.fetchAllMembers}
							style={[{ backgroundColor: '#fff', marginTop: 10, marginBottom: 0 }]}
							styleText={[{ color: '#000', fontSize: 18 }]}
						/>
						<List.Separator />
						<List.Separator />
						<Button
							title={I18n.t('Share_Channel')}
							onPress={() => {
								this.closeDrawer();
								this.onPressTouchable({
									route: 'ShareChannelView',
									params: {
										room,
										owner: this.owner || '',
										ownerOrg: this.ownerOrg || ''
									}
								});
							}}
							style={[{ backgroundColor: '#fff', marginBottom: 0 }]}
							styleText={[{ color: '#000', fontSize: 18 }]}
						/>
						<List.Separator style={{ height: 5 }} />
						<Button
							title={I18n.t('Cancel')}
							onPress={this.closeDrawer}
							style={[{ backgroundColor: '#fff' }]}
							styleText={[{ color: '#000', fontSize: 18 }]}
						/>
					</List.Container>
				}
			/>
		);
	};

	renderChannelAnnouncement = () => {
		const { room } = this.state;
		const { t, prid, announcement } = room;
		const { theme } = this.props;
		const separator = '\u0001\u0002';
		const allMessage = (announcement?.message ?? '').split(separator);
		const message = allMessage && allMessage.length > 0 ? allMessage[0] : '';
		return ['c', 'p'].includes(t) && !prid ? (
			<Touch
				theme={theme}
				onPress={() =>
					this.onPressTouchable({
						route: 'AnnouncementView',
						params: {
							room
						}
					})
				}
			>
				<List.Section
					style={[
						styles.roomInfoContainer,
						{ flexDirection: 'row', paddingTop: 6, paddingBottom: 6, justifyContent: 'flex-end' }
					]}
				>
					<Text style={styles.itemTitle}>{I18n.t('Announcement')}</Text>
					<Text
						style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
						numberOfLines={1}
						ellipsizeMode={'tail'}
					>
						{message ?? I18n.t('Empty_Announcement')}
					</Text>
					<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
				</List.Section>
			</Touch>
		) : null;
	};

	renderSchedule = () => {
		const { room } = this.state;
		const { t, prid } = room;
		const { theme, roomValueProposition } = this.props;
		return ['c'].includes(t) && !prid ? (
			<Touch
				theme={theme}
				onPress={() =>
					this.onPressTouchable({
						route: 'ScheduleView',
						params: {
							room,
							roomValueProposition,
							canEdit: true
						}
					})
				}
			>
				<List.Section
					style={[
						styles.roomInfoContainer,
						{ flexDirection: 'row', paddingTop: 6, paddingBottom: 6, justifyContent: 'flex-end' }
					]}
				>
					<View style={[{ height: 40, alignSelf: 'baseline' }]}>
						<Text style={styles.itemTitle} numberOfLines={1}>
							{I18n.t('Schedule')}
						</Text>
					</View>

					<Text
						style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
						numberOfLines={1}
						ellipsizeMode={'tail'}
					>
						{roomValueProposition ?? I18n.t('Empty_Schedule')}
					</Text>
					<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
				</List.Section>
			</Touch>
		) : null;
	};

	get messageSeacrhItems() {
		const titleArr = [
			{ title: I18n.t('Messages'), icon: require('./image/icon_action_news.png') },
			{ title: I18n.t('Files'), icon: require('./image/icon_action_folder.png') },
			{ title: I18n.t('Media'), icon: require('./image/icon_action_media.png') },
			{ title: I18n.t('Mentions'), icon: require('./image/icon_action_mention.png') }
		];
		return titleArr;
	}

	messagesSearchClick = (selectIndex: number) => {
		const { room } = this.state;
		const { rid, t } = room;
		const { navigation } = this.props;
		let name = '';
		switch (selectIndex) {
			case 0:
				name = 'Messages';
				break;
			case 1:
				name = 'Files';
				break;
			case 2:
				name = 'Media';
				break;
			case 3:
				name = 'Mentions';
				break;
			default:
				name = 'Messages';
				break;
		}
		navigation.navigate('MessagesView', { rid, t, selectIndex, name });
	};
	// 消息搜索
	renderMessagesSearch = () => (
		<View style={styles.roomInfoContainer}>
			<TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => this.messagesSearchClick(0)}>
				<Text
					style={{
						fontSize: 16,
						flex: 1,
						color: 'black',
						includeFontPadding: false,
						textAlignVertical: 'center',
						lineHeight: 40
					}}
				>
					{I18n.t('Search_Messages')}
				</Text>
				<List.Icon name='chevron-right' style={[styles.actionIndicator]} />
			</TouchableOpacity>
		</View>
	);

	// 通知
	renderNotificationSetting = () => (
		<View>
			<List.Separator style={{ marginHorizontal: 15 }} />
			<View style={[styles.itemInner, { marginTop: 5, marginBottom: 5 }]}>
				<Text style={{ flex: 1, fontSize: 16, color: 'black' }}>{I18n.t('Show_Unread_Counter')}</Text>
				{this.renderSwitch('hideUnreadStatus', false)}
			</View>
		</View>
	);

	// 通知
	renderLikeSetting = () => (
		<View>
			<List.Separator style={{ marginHorizontal: 15 }} />
			<View style={[styles.itemInner, { marginTop: 5, marginBottom: 5 }]}>
				<Text style={{ flex: 1, fontSize: 16, color: 'black' }}>{I18n.t('room_like')}</Text>
				{this.renderSwitch('like', false)}
			</View>
		</View>
	);

	gotoChangeFakeNameView = (fakeName: string) => {
		const { navigation } = this.props;
		const { room } = this.state;
		navigation.navigate('RoomChangeFakeNameView', { room, fakeName });
	};

	getDefaultName = (memberNumber?: number) => {
		const { enterprise } = this.props;
		return `${enterprise?.toUpperCase()}-${`${10000 + (memberNumber ?? 0)}`.slice(-3)}`;
	};

	renderCollection = () => {
		const { room, joined } = this.state;
		const { t } = room;
		/*
		const title = room.t === 'c' ? I18n.t('Channel') : I18n.t('Team');
		const fakeName = room.memberName ? room.memberName : this.getDefaultName(room.memberNumber);
		* */
		return (
			<List.Section style={[styles.roomInfoContainer]}>
				<View>
					{this.renderMessagesSearch()}
					{['c', 'p', 'd'].includes(t) && joined ? this.renderNotificationSetting() : null}
					{['c'].includes(t) && joined ? this.renderLikeSetting() : null}
				</View>
			</List.Section>
		);
	};

	renderSwitch = (key: string, setTrue: boolean) => {
		const { room } = this.state;
		return (
			<Switch
				value={setTrue ? !room[key] : room[key]}
				testID={key}
				trackColor={SWITCH_TRACK_COLOR}
				thumbColor={'#fff'}
				onValueChange={value => this.onValueChangeSwitch(key, setTrue ? !value : value)}
			/>
		);
	};

	saveNotificationSettings = async (key: string, value: string | boolean, params: IRoomNotifications) => {
		// @ts-ignore
		logEvent(events[`NP_${key.toUpperCase()}`]);
		const { room } = this.state;
		const db = database.active;

		try {
			await db.write(async () => {
				await room.update(
					protectedFunction((r: IRoomNotifications) => {
						r[key] = value;
					})
				);
			});

			try {
				const result = await Services.saveNotificationSettings(this.rid, params);
				if (result.success) {
					return;
				}
			} catch {
				// do nothing
			}

			await db.write(async () => {
				await room.update(
					protectedFunction((r: IRoomNotifications) => {
						r[key] = room[key];
					})
				);
			});
		} catch (e) {
			// @ts-ignore
			logEvent(events[`NP_${key.toUpperCase()}_F`]);
			log(e);
		}
	};

	onValueChangeSwitch = (key: string, value: string | boolean) => {
		if (key === 'f') {
			const { room } = this.state;
			this.toggleFav(room.rid, room.f);
		} else if (key === 'like') {
			const { room } = this.state;
			this.toggleLike(room.rid, room.like);
		} else {
			this.saveNotificationSettings(key, value, { [key]: value ? '1' : '0' });
			// @ts-ignore
			this.saveNotificationSettings('disableNotifications', value, { disableNotifications: value ? '1' : '0' });
		}
	};

	toggleLike = async (rid: string, like: boolean | undefined): Promise<void> => {
		try {
			const db = database.active;
			const result = await Services.toggleLike(rid, !like);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.like = !like;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			log(e);
		}
	};

	toggleFav = async (rid: string, favorite: boolean): Promise<void> => {
		logEvent(favorite ? events.RL_UNFAVORITE_CHANNEL : events.RL_FAVORITE_CHANNEL);
		try {
			const db = database.active;
			const result = await Services.toggleFavorite(rid, !favorite);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.f = !favorite;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_TOGGLE_FAVORITE_F);
			log(e);
		}
	};

	renderJitsi = () => {
		const { room } = this.state;
		const { jitsiEnabled, jitsiEnableTeams, jitsiEnableChannels } = this.props;

		const isJitsiDisabledForTeams = room.teamMain && !jitsiEnableTeams;
		const isJitsiDisabledForChannels = !room.teamMain && (room.t === 'p' || room.t === 'c') && !jitsiEnableChannels;

		if (!jitsiEnabled || isJitsiDisabledForTeams || isJitsiDisabledForChannels) {
			return null;
		}

		return (
			<List.Section>
				<List.Separator />
				<List.Item
					title='Voice_call'
					onPress={() => callJitsi({ room, cam: true })}
					testID='room-actions-voice'
					left={() => <List.Icon name='phone' />}
					showActionIndicator
				/>
				<List.Separator />
				<List.Item
					title='Video_call'
					onPress={() => callJitsi({ room })}
					testID='room-actions-video'
					left={() => <List.Icon name='camera' />}
					showActionIndicator
				/>
				<List.Separator />
			</List.Section>
		);
	};

	renderE2EEncryption = () => {
		const { room } = this.state;
		const { encryptionEnabled } = this.props;

		// If this room type can be encrypted
		// If e2e is enabled
		if (E2E_ROOM_TYPES[room.t] && encryptionEnabled) {
			return (
				<List.Section>
					<List.Separator />
					<List.Item
						title='Encrypted'
						testID='room-actions-encrypt'
						left={() => <List.Icon name='encrypted' />}
						right={this.renderEncryptedSwitch}
					/>
					<List.Separator />
				</List.Section>
			);
		}
		return null;
	};

	renderChannelType = () => {
		const { room } = this.state;
		const { t, prid } = room;
		const { theme } = this.props;
		const isChannel = t === 'c';
		return ['c', 'p'].includes(t) && !prid ? (
			<Touch
				theme={theme}
				style={[{ marginTop: 0, marginBottom: 12 }]}
				onPress={() =>
					this.onPressTouchable({
						route: 'ChannelTypeView',
						params: {
							room
						}
					})
				}
			>
				<List.Section
					style={[
						styles.roomInfoContainer,
						{ flexDirection: 'row', paddingTop: 6, paddingBottom: 6, justifyContent: 'flex-end', marginTop: 0 }
					]}
				>
					<View style={[{ height: 40, alignSelf: 'baseline' }]}>
						<Text style={styles.itemTitle} numberOfLines={1}>
							{I18n.t('Channel_Type')}
						</Text>
					</View>

					<Text
						style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
						numberOfLines={1}
						ellipsizeMode={'tail'}
					>
						{`${I18n.t(room.federated ? 'External' : 'Inner')}${isChannel ? I18n.t(room.rt ? 'Monographic' : 'Opened') : ''}${
							isChannel ? I18n.t('Channel') : I18n.t('Team')
						}`}
					</Text>
					<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
				</List.Section>
			</Touch>
		) : null;
	};

	renderLastSection = () => {
		const { room, joined } = this.state;
		const { theme } = this.props;
		const { t, blocker } = room;

		if (!joined || t === 'l') {
			return null;
		}

		if (t === 'd' && !isGroupChat(room)) {
			return (
				<List.Section
					style={[
						styles.roomInfoContainer,
						{
							flexDirection: 'row',
							minHeight: 50,
							alignItems: 'center',
							justifyContent: 'center',
							marginTop: -6
						}
					]}
				>
					<TouchableOpacity
						style={{ flexDirection: 'row' }}
						testID='room-actions-leave-channel'
						onPress={() =>
							this.onPressTouchable({
								event: this.toggleBlockUser
							})
						}
					>
						<Text
							style={{
								textAlign: 'center',
								color: themes[theme].dangerColor,
								fontSize: 16
							}}
						>
							{I18n.t(`${blocker ? 'Unblock' : 'Block'}_user`)}
						</Text>
					</TouchableOpacity>
					{/* <List.Item
						title={`${blocker ? 'Unblock' : 'Block'}_user`}
						onPress={() =>
							this.onPressTouchable({
								event: this.toggleBlockUser
							})
						}
						testID='room-actions-block-user'
						left={() => <List.Icon name='ignore' color={themes[theme].dangerColor} />}
						showActionIndicator
						color={themes[theme].dangerColor}
					/> */}
					{/* <List.Separator /> */}
				</List.Section>
			);
		}

		if (t === 'p' || t === 'c') {
			return (
				<List.Section
					style={[
						styles.roomInfoContainer,
						{
							flexDirection: 'row',
							minHeight: 50,
							alignItems: 'center',
							justifyContent: 'center',
							marginTop: -6
						}
					]}
				>
					<TouchableOpacity
						style={{
							flex: 1
						}}
						testID='room-actions-leave-channel'
						onPress={() =>
							this.onPressTouchable({
								event: room.teamMain ? this.leaveTeam : this.leaveChannel
							})
						}
					>
						<Text
							style={{
								textAlign: 'center',
								color: themes[theme].dangerColor,
								fontSize: 16
							}}
						>
							{I18n.t('Leave')}
						</Text>
					</TouchableOpacity>
				</List.Section>
			);
		}

		return null;
	};

	renderDeleteRoom = () => {
		const { room, joined } = this.state;
		const { theme } = this.props;
		const { t } = room;
		if (!joined || (t !== 'c' && t !== 'p')) {
			return null;
		}
		if (this.canDeleteRoom) {
			return (
				<List.Section
					style={[
						styles.roomInfoContainer,
						{
							flexDirection: 'row',
							minHeight: 50,
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: 30,
							marginTop: 6
						}
					]}
				>
					<TouchableOpacity
						style={{
							flex: 1
						}}
						testID='room-actions-Delete-Room'
						onPress={() =>
							this.onPressTouchable({
								event: this.deleteRoom
							})
						}
					>
						<Text
							style={{
								textAlign: 'center',
								color: themes[theme].dangerColor,
								fontSize: 16
							}}
						>
							{I18n.t('Disband')}
						</Text>
					</TouchableOpacity>
				</List.Section>
			);
		}
		return null;
	};

	deleteRoom = () => {
		// todo 删除room操作逻辑
		const { room } = this.state;
		const { dispatch } = this.props;
		showConfirmationAlert({
			message: I18n.t('Are_you_sure_you_want_to_delete_the_room', { room: getRoomTitle(room) }),
			confirmationText: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
			// eslint-disable-next-line no-nested-ternary
			onPress: () => dispatch(deleteRoom(room.t === 'c' ? ERoomType.c : room.t === 'p' ? ERoomType.p : ERoomType.t, room))
		});
	};

	teamChannelActions = (t: string, room: ISubscription) => {
		const { canEdit, canCreateTeam, canAddChannelToTeam } = this.state;
		const canConvertToTeam = canEdit && canCreateTeam && !room.teamMain;
		const canMoveToTeam = canEdit && canAddChannelToTeam && !room.teamId;

		return (
			<>
				{['c', 'p'].includes(t) && canConvertToTeam ? (
					<>
						<List.Item
							title='Convert_to_Team'
							onPress={() =>
								this.onPressTouchable({
									event: this.convertToTeam
								})
							}
							testID='room-actions-convert-to-team'
							left={() => <List.Icon name='teams' />}
							showActionIndicator
						/>
						<List.Separator />
					</>
				) : null}

				{['c', 'p'].includes(t) && canMoveToTeam ? (
					<>
						<List.Item
							title='Move_to_Team'
							onPress={() =>
								this.onPressTouchable({
									event: this.moveToTeam
								})
							}
							testID='room-actions-move-to-team'
							left={() => <List.Icon name='channel-move-to-team' />}
							showActionIndicator
						/>
						<List.Separator />
					</>
				) : null}
			</>
		);
	};

	teamToChannelActions = (t: string, room: ISubscription) => {
		const { canEdit, canConvertTeam } = this.state;
		const canConvertTeamToChannel = canEdit && canConvertTeam && !!room?.teamMain;

		return (
			<>
				{['c', 'p'].includes(t) && canConvertTeamToChannel ? (
					<>
						<List.Item
							title='Convert_to_Channel'
							onPress={() =>
								this.onPressTouchable({
									event: this.convertTeamToChannel
								})
							}
							left={() => <List.Icon name='channel-public' />}
							showActionIndicator
						/>
						<List.Separator />
					</>
				) : null}
			</>
		);
	};

	render() {
		const {
			room,
			canAutoTranslate,
			canForwardGuest,
			canReturnQueue,
			canViewCannedResponse,
			canPlaceLivechatOnHold
			// canAddUser
		} = this.state;
		const { rid, t } = room;
		return (
			<SafeAreaView testID='room-actions-view' style={{ backgroundColor: '#F2F2F2' }}>
				<StatusBar />
				<List.Container testID='room-actions-scrollview'>
					{this.renderRoomInfo()}
					{this.renderJitsi()}
					{this.renderE2EEncryption()}
					{/* {this.renderChannelAnnouncement()}
					{this.renderSchedule()} */}
					{this.renderGroupSetting()}
					{this.renderCollection()}
					<List.Section>
						{['c', 'p', 'd'].includes(t) && canAutoTranslate ? (
							<>
								<List.Item
									title='Auto_Translate'
									onPress={() =>
										this.onPressTouchable({
											route: 'AutoTranslateView',
											params: { rid, room }
										})
									}
									testID='room-actions-auto-translate'
									left={() => <List.Icon name='language' />}
									showActionIndicator
								/>
								<List.Separator />
							</>
						) : null}

						{['l'].includes(t) && !this.isOmnichannelPreview && canViewCannedResponse ? (
							<>
								<List.Item
									title='Canned_Responses'
									onPress={() => this.onPressTouchable({ route: 'CannedResponsesListView', params: { rid } })}
									left={() => <List.Icon name='canned-response' />}
									showActionIndicator
								/>
								<List.Separator />
							</>
						) : null}

						{['l'].includes(t) && !this.isOmnichannelPreview ? (
							<>
								<List.Item
									title='Close'
									onPress={() =>
										this.onPressTouchable({
											event: this.closeLivechat
										})
									}
									left={() => <List.Icon name='close' />}
									showActionIndicator
								/>
								<List.Separator />
							</>
						) : null}

						{['l'].includes(t) && !this.isOmnichannelPreview && canForwardGuest ? (
							<>
								<List.Item
									title='Forward'
									onPress={() =>
										this.onPressTouchable({
											route: 'ForwardLivechatView',
											params: { rid }
										})
									}
									left={() => <List.Icon name='user-forward' />}
									showActionIndicator
								/>
								<List.Separator />
							</>
						) : null}

						{['l'].includes(t) && !this.isOmnichannelPreview && canPlaceLivechatOnHold ? (
							<>
								<List.Item
									title='Place_chat_on_hold'
									onPress={() =>
										this.onPressTouchable({
											event: this.placeOnHoldLivechat
										})
									}
									left={() => <List.Icon name='pause' />}
									showActionIndicator
								/>
								<List.Separator />
							</>
						) : null}

						{['l'].includes(t) && !this.isOmnichannelPreview && canReturnQueue ? (
							<>
								<List.Item
									title='Return'
									onPress={() =>
										this.onPressTouchable({
											event: this.returnLivechat
										})
									}
									left={() => <List.Icon name='undo' />}
									showActionIndicator
								/>
								<List.Separator />
							</>
						) : null}
					</List.Section>

					{/* {joined ? this.renderChannelType() : null} */}
					{this.renderLastSection()}
					{this.renderDeleteRoom()}
					{this.renderDrawer()}
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	userId: getUserSelector(state).id,
	username: getUserSelector(state).username,
	roomValueProposition: state?.schedule?.schedule,
	jitsiEnabled: (state.settings.Jitsi_Enabled || false) as boolean,
	jitsiEnableTeams: (state.settings.Jitsi_Enable_Teams || false) as boolean,
	jitsiEnableChannels: (state.settings.Jitsi_Enable_Channels || false) as boolean,
	encryptionEnabled: state.encryption.enabled,
	serverVersion: state.server.version,
	isMasterDetail: state.app.isMasterDetail,
	enterprise: state.settings.Enterprise_ID,
	user: state.login.user.username,
	addUserToJoinedRoomPermission: state.permissions['add-user-to-joined-room'],
	addUserToAnyCRoomPermission: state.permissions['add-user-to-any-c-room'],
	addUserToAnyPRoomPermission: state.permissions['add-user-to-any-p-room'],
	removeUserPermission: state.permissions['remove-user'],
	createInviteLinksPermission: state.permissions['create-invite-links'],
	addUserToPrivateCRoom: state.permissions['add-user-to-private-c-room'],
	editRoomPermission: state.permissions['edit-room'],
	toggleRoomE2EEncryptionPermission: state.permissions['toggle-room-e2e-encryption'],
	viewBroadcastMemberListPermission: state.permissions['view-broadcast-member-list'],
	transferLivechatGuestPermission: state.permissions['transfer-livechat-guest'],
	createTeamPermission: state.permissions['create-team'],
	addTeamChannelPermission: state.permissions['add-team-channel'],
	convertTeamPermission: state.permissions['convert-team'],
	viewCannedResponsesPermission: state.permissions['view-canned-responses'],
	livechatAllowManualOnHold: state.settings.Livechat_allow_manual_on_hold as boolean,
	livechatRequestComment: state.settings.Livechat_request_comment_when_closing_conversation as boolean,
	selectedUsers: state.selectedUsers.users,
	accessPMembers: (state.settings.Appia_Create_External_Discussion_Members as string)?.split(',') || [],
	accessCMembers: (state.settings.Appia_Create_External_Channel_Members as string)?.split(',') || []
});

// @ts-ignore
export default connect(mapStateToProps)(withTheme(withDimensions(RoomActionsView)));
