import React from 'react';
import {
	InteractionManager,
	NativeModules,
	Text,
	TouchableOpacity,
	View,
	Keyboard,
	Image,
	Dimensions,
	ScrollView,
	NativeEventEmitter,
	EmitterSubscription,
	Modal
} from 'react-native';
import { connect } from 'react-redux';
import parse from 'url-parse';
import moment from 'moment';
import { Q } from '@nozbe/watermelondb';
import { dequal } from 'dequal';
import { EdgeInsets, withSafeAreaInsets } from 'react-native-safe-area-context';
import { Observable, Subscription } from 'rxjs';
import Touchable from 'react-native-platform-touchable';
import { PlatformPressable } from '@react-navigation/elements';
// @ts-ignore
import { WatermarkView } from 'react-native-watermark-component';
import { rgba } from 'color2k';
import { default as EventSource } from 'react-native-sse';

import { getRoutingConfig } from '../../lib/services/restApi';
import Touch from '../../containers/Touch';
import { replyBroadcast } from '../../actions/messages';
import database from '../../lib/database';
import Message from '../../containers/message';
import MessageActions, { IMessageActions } from '../../containers/MessageActions';
import MessageErrorActions, { IMessageErrorActions } from '../../containers/MessageErrorActions';
import MessageBox, { MessageBoxType } from '../../containers/MessageBox';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import RoomHeader from '../../containers/RoomHeader';
import StatusBar from '../../containers/StatusBar';
import ReactionsList from '../../containers/ReactionsList';
import { LISTENER } from '../../containers/Toast';
import { getBadgeColor, isBlocked, makeThreadName } from '../../lib/methods/helpers/room';
import { isReadOnly } from '../../lib/methods/helpers/isReadOnly';
import { showErrorAlert } from '../../lib/methods/helpers/info';
import { withTheme } from '../../theme';
import {
	KEY_COMMAND,
	handleCommandReplyLatest,
	handleCommandRoomActions,
	handleCommandScroll,
	handleCommandSearchMessages,
	IKeyCommandEvent
} from '../../commands';
import { Review } from '../../lib/methods/helpers/review';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/navigation/appNavigation';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../dimensions';
import { takeInquiry, takeResume } from '../../ee/omnichannel/lib';
import { sendLoadingEvent } from '../../containers/Loading';
import getThreadName from '../../lib/methods/getThreadName';
import getRoomInfo from '../../lib/methods/getRoomInfo';
import { ContainerTypes } from '../../containers/UIKit/interfaces';
import RoomServices from './services';
import LoadMore from './LoadMore';
import Banner from './Banner';
import Separator from './Separator';
// import RightButtons from './RightButtons';
import * as HeaderButton from '../../containers/HeaderButton';
// import LeftButtons from './LeftButtons';
import styles from './styles';
import JoinCode, { IJoinCode } from './JoinCode';
import ReactionPicker from './ReactionPicker';
import List, { ListContainerType } from './List';
import { ChatsStackParamList } from '../../stacks/types';
import { getMessageById } from '../../lib/database/services/Message';
import {
	IApplicationState,
	IAttachment,
	IBaseScreen,
	ILastMessage,
	ILoggedUser,
	IMessage,
	IOmnichannelSource,
	ISubscription,
	IVisitor,
	SubscriptionType,
	TAnyMessageModel,
	TMessageModel,
	TSubscriptionModel,
	TThreadModel,
	ICustomEmojis,
	IEmoji,
	TGetCustomEmoji,
	RoomType,
	IRoomAnnouncement,
	attachmentToPhoto,
	IFastModeMessage,
	IMsgData
} from '../../definitions';
import { E2E_MESSAGE_TYPE, E2E_STATUS, MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad, themes } from '../../lib/constants';
import { TListRef } from './List/List';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import {
	callJitsi,
	loadSurroundingMessages,
	loadThreadMessages,
	readMessages,
	sendMessage,
	triggerBlockAction
} from '../../lib/methods';
import {
	isGroupChat,
	getUidDirectMessage,
	getRoomTitle,
	canAutoTranslate as canAutoTranslateMethod,
	debounce,
	isIOS,
	isTablet,
	hasPermission
} from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { withActionSheet, IActionSheetProvider } from '../../containers/ActionSheet';
import { goRoom, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { isUploadActive } from '../../lib/methods/sendFileMessage';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { setMessageMultiSelect, setSelectedMessageIds } from '../../actions/app';
import Avatar from '../../containers/Avatar';
import Button from '../../containers/Button';
import { MissionBot } from './ButtonFooter';
import StaffServiceButton from './StaffServiceButton';
import SideMenuButton from './SideMenuButton';
import { setPageNumber } from '../../actions/cloudDisk';
import { TYPE } from '../CloudDiskView';
import { showToast } from '../../lib/methods/helpers/showToast';
import { createDiscussionRequest, ICreateDiscussionRequestData } from '../../actions/createDiscussion';
import { IError, IResult } from '../CreateDiscussionView/interfaces';
import { ForwardMultiIcon, ForwardOneByOneIcon, TodoSet } from '../../containers/SvgIcons';
import { BUTTON_HIT_SLOP } from '../../containers/HeaderButton/HeaderButtonItem';
import TodoBadge from './components/TodoBadge';
import { IVChatCallMsg, IVCRecordData } from '../../definitions/IVChat';
import { PhoneIcon } from './image/Icon';
import { JOIN_VOICECHAT_EMITTER } from '../../containers/VoiceChatView';
import { IStreamData } from '../../definitions/IFastMode';
import { IDoc } from '../../containers/message/FastModelMsg';
import { DrawerMenu } from '../../containers/DrawerMenu';
import OpenLink from '../../utils/openLink';
import { roomHistoryRequest } from '../../actions/room';
import MeetingTop from './MeetingTop';
import { reset, setLoading } from '../../actions/selectedUsers';
import InputModel from './InputModel';

export const cannotGoDirect = (username: string) => username && username.includes(':');

type TStateAttrsUpdate = keyof IRoomViewState;

const stateAttrsUpdate = [
	'joined',
	'lastOpen',
	'reactionsModalVisible',
	'canAutoTranslate',
	'selectedMessage',
	'loading',
	'editing',
	'replying',
	'readOnly',
	'member',
	'canForwardGuest',
	'canReturnQueue',
	'canViewCannedResponse'
] as TStateAttrsUpdate[];

type TRoomUpdate = keyof TSubscriptionModel;

const roomAttrsUpdate = [
	'f',
	'ro',
	'blocked',
	'blocker',
	'archived',
	'tunread',
	'muted',
	'ignored',
	'jitsiTimeout',
	'announcement',
	'sysMes',
	'topic',
	'name',
	'fname',
	'roles',
	'bannerClosed',
	'visitor',
	'joinCodeRequired',
	'teamMain',
	'teamId',
	'status',
	'lastMessage',
	'onHold',
	't',
	'todoCount',
	'isRoomToDo'
] as TRoomUpdate[];

interface IRoomViewProps extends IActionSheetProvider, IBaseScreen<ChatsStackParamList, 'RoomView'> {
	user: Pick<ILoggedUser, 'id' | 'username' | 'token' | 'showMessageInMainThread'>;
	appState: string;
	useRealName?: boolean;
	isAuthenticated: boolean;
	Message_GroupingPeriod?: number;
	Message_TimeFormat?: string;
	Appia_Message_Read_Receipt_Enabled?: boolean;
	Hide_System_Messages?: string[];
	baseUrl: string;
	serverVersion: string | null;
	customEmojis: ICustomEmojis;
	isMasterDetail: boolean;
	messageMultiSelect: boolean;
	selectedMessageIds: string[];
	replyBroadcast: Function;
	width: number;
	insets: EdgeInsets;
	transferLivechatGuestPermission?: string[]; // TODO: Check if its the correct type
	viewCannedResponsesPermission?: string[]; // TODO: Check if its the correct type
	livechatAllowManualOnHold?: boolean;
	noMessageBoxSet: Set<string>;
	updateRoomLeader: boolean;
	matrixDomain: { org: string; matrixRemote: string };
	loading: boolean;
	result: IResult;
	failure: boolean;
	error: IError;
	addUserToJoinedRoomPermission?: string[];
	addUserToAnyCRoomPermission?: string[];
	addUserToAnyPRoomPermission?: string[];
	addUserToPrivateCRoom?: string[];
	accessPMembers: string[];
	accessCMembers: string[];
	username: string;
	server: string;
}

interface IRoomViewState {
	[key: string]: any;
	joined: boolean;
	room:
		| TSubscriptionModel
		| {
				rid: string;
				t: string;
				name?: string;
				fname?: string;
				prid?: string;
				joinCodeRequired?: boolean;
				status?: string;
				lastMessage?: ILastMessage;
				sysMes?: boolean;
				onHold?: boolean;
				announcement?: IRoomAnnouncement;
				callMsg?: string;
				onCallStatus?: boolean;
				federated?: boolean;
				bot?: boolean;
				welcomeMsg?: string;
				_id?: string;
				robotName?: string;
				showAppiaTag?: number;
				roles?: string[];
		  };
	roomUpdate: {
		[K in TRoomUpdate]?: any;
	};
	member: any;
	lastOpen: Date | null;
	reactionsModalVisible: boolean;
	selectedMessage?: TAnyMessageModel;
	canAutoTranslate: boolean;
	loading: boolean;
	editing: boolean;
	replying: boolean;
	replyWithMention: boolean;
	readOnly: boolean;
	unreadsCount: number | null;
	roomUserId?: string | null;
	isLocal?: boolean;
	conversationId?: string;
	answering?: boolean;
	showWelcomeMsg?: boolean;
	showFastModelRef?: boolean;
	fastModelRef?: string;
	isManager?: boolean;
	mediaMsgs: TMessageModel[];
	inputModalVisible: boolean;
	todoMessage: TAnyMessageModel;
}

class RoomView extends React.Component<IRoomViewProps, IRoomViewState> {
	private rid?: string;
	private t?: string;
	private tmid?: string;
	private jumpToMessageId?: string;
	private jumpToThreadId?: string;
	private fromSearch?: boolean;
	private messagebox: React.RefObject<MessageBoxType>;
	private list: React.RefObject<ListContainerType>;
	private joinCode: React.RefObject<IJoinCode>;
	private flatList: TListRef;
	private mounted: boolean;
	private offset = 0;
	private subObserveQuery?: Subscription;
	private subSubscription?: Subscription;
	private queryUnreads?: Subscription;
	private retryInit = 0;
	private retryInitTimeout?: ReturnType<typeof setTimeout>;
	private retryFindCount = 0;
	private retryFindTimeout?: ReturnType<typeof setTimeout>;
	private messageErrorActions?: IMessageErrorActions | null;
	private messageActions?: IMessageActions | null;
	private replyInDM?: TAnyMessageModel;
	// Type of InteractionManager.runAfterInteractions
	private didMountInteraction?: {
		then: (onfulfilled?: (() => any) | undefined, onrejected?: (() => any) | undefined) => Promise<any>;
		done: (...args: any[]) => any;
		cancel: () => void;
	};
	private sub?: RoomClass;
	private oneByOne = false;
	private owner: string | undefined;
	private ownerOrg: string | undefined;
	private accessedCreateFederation: boolean;
	// FastMode 需要的参数
	private robotId: string | undefined;
	private conversationId: string | undefined;
	private gptTask: EventSource | undefined;
	private botInfo:
		| {
				_id?: string;
				username?: string;
				name?: string;
		  }
		| undefined;
	private showPhotosubscription: EmitterSubscription;
	private canAddUser: boolean | undefined;

	constructor(props: IRoomViewProps) {
		super(props);
		console.time(`${this.constructor.name} init`);
		console.time(`${this.constructor.name} mount`);
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		/**
		 * On threads, we don't have a subscription.
		 * `this.state.room` is going to have only a few properties sent during navigation.
		 * Use `this.tmid` as thread id.
		 */
		this.tmid = props.route.params?.tmid;
		const selectedMessage = props.route.params?.message;
		const name = props.route.params?.name;
		const fname = props.route.params?.fname;
		const prid = props.route.params?.prid;
		const room = props.route.params?.room ?? {
			rid: this.rid as string,
			t: this.t as string,
			name,
			fname,
			prid
		};
		this.jumpToMessageId = props.route.params?.jumpToMessageId;
		this.fromSearch = props.route.params?.fromSearch;
		this.jumpToThreadId = props.route.params?.jumpToThreadId;
		const roomUserId = props.route.params?.roomUserId ?? getUidDirectMessage(room);
		this.replyInDM = props.route.params?.replyInDM;

		this.state = {
			joined: true,
			room,
			roomUpdate: {},
			member: {},
			lastOpen: null,
			reactionsModalVisible: false,
			selectedMessage,
			canAutoTranslate: false,
			loading: true,
			editing: false,
			replying: !!selectedMessage,
			replyWithMention: false,
			readOnly: false,
			unreadsCount: null,
			roomUserId,
			canViewCannedResponse: false,
			canForwardGuest: false,
			canReturnQueue: false,
			canPlaceLivechatOnHold: false,
			isOnHold: false,
			isLocal: false,
			answering: false,
			showWelcomeMsg: false,
			showFastModelRef: false,
			fastModelRef: '',
			isManager: false,
			mediaMsgs: [],
			inputModalVisible: false
		};
		this.accessedCreateFederation = (room.t === 'c' ? props.accessCMembers : props.accessPMembers)?.includes(props.username);
		this.fetchRoomMembersLeader();
		this.setHeader();

		if ('id' in room) {
			// @ts-ignore TODO: type guard isn't helping here :(
			this.observeRoom(room);
		} else if (this.rid) {
			this.findAndObserveRoom(this.rid);
		}

		this.setReadOnly();

		this.messagebox = React.createRef();
		this.list = React.createRef();
		this.joinCode = React.createRef();
		this.flatList = React.createRef();
		this.mounted = false;

		if (this.t === 'l') {
			this.updateOmnichannel();
		}

		// we don't need to subscribe to threads
		if (this.rid && !this.tmid) {
			this.sub = new RoomClass(this.rid);
		}
		if (room.bot) {
			this.getRobotId();
			this.getConversationId();
		}
		console.timeEnd(`${this.constructor.name} init`);

		this.queryMediaMsgs();
	}

	setShowWelcomeMsg = (showWelcomeMsg: boolean) => {
		this.setState({
			showWelcomeMsg
		});
	};

	componentDidMount() {
		this.mounted = true;
		this.getLocal();
		this.getIsManager();
		// this.panGesture = Gesture.Pan().onBegin(() => {

		// 	console.log("更多操作", this.messagebox?.current);
		// })

		this.didMountInteraction = InteractionManager.runAfterInteractions(() => {
			const { isAuthenticated } = this.props;
			this.setHeader();
			if (this.rid) {
				this.sub?.subscribe?.();
				if (isAuthenticated) {
					this.init();
				} else {
					EventEmitter.addEventListener('connected', this.handleConnected);
				}
			}
			if (this.jumpToMessageId) {
				this.jumpToMessage(this.jumpToMessageId);
			}
			if (this.jumpToThreadId && !this.jumpToMessageId) {
				this.navToThread({ tmid: this.jumpToThreadId });
			}
			if (isIOS && this.rid) {
				this.updateUnreadCount();
			}
			if (this.replyInDM) {
				this.onReplyInit(this.replyInDM, false);
			}
		});

		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
		EventEmitter.addEventListener('ROOM_REMOVED', this.handleRoomRemoved);
		console.timeEnd(`${this.constructor.name} mount`);

		this.checkUploadFileStatus();
	}

	shouldComponentUpdate(nextProps: IRoomViewProps, nextState: IRoomViewState) {
		const { state } = this;
		const {
			roomUpdate,
			member,
			isOnHold,
			roomLeader,
			showWelcomeMsg,
			answering,
			showFastModelRef,
			fastModelRef,
			mediaMsgs,
			isLocal,
			isManager,
			inputModalVisible
		} = state;

		const { appState, theme, insets, route, messageMultiSelect, selectedMessageIds, updateRoomLeader, loading } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		if (appState !== nextProps.appState) {
			return true;
		}
		if (member.statusText !== nextState.member.statusText) {
			return true;
		}
		if (messageMultiSelect !== nextProps.messageMultiSelect) {
			return true;
		}
		if (selectedMessageIds.length !== nextProps.selectedMessageIds.length) {
			return true;
		}
		if (roomLeader?.u?.username !== nextState.roomLeader?.u?.username) {
			return true;
		}
		if (isOnHold !== nextState.isOnHold) {
			return true;
		}
		if (updateRoomLeader !== nextProps.updateRoomLeader) {
			return true;
		}
		if (showWelcomeMsg !== nextState.showWelcomeMsg) {
			return true;
		}
		if (mediaMsgs !== nextState.mediaMsgs) {
			return true;
		}
		const stateUpdated = stateAttrsUpdate.some(key => nextState[key] !== state[key]);
		if (stateUpdated) {
			return true;
		}
		if (!dequal(nextProps.insets, insets)) {
			return true;
		}
		if (!dequal(nextProps.route?.params, route?.params)) {
			return true;
		}
		if (answering !== nextState.answering) {
			return true;
		}
		if (isLocal !== nextState.isLocal) {
			return true;
		}
		if (isManager !== nextState.isManager) {
			return true;
		}
		if (showFastModelRef !== nextState.showFastModelRef) {
			return true;
		}
		if (fastModelRef !== nextState.fastModelRef) {
			return true;
		}
		if (loading !== nextProps.loading) {
			return true;
		}
		if (inputModalVisible !== nextState.inputModalVisible) {
			return true;
		}
		return roomAttrsUpdate.some(key => !dequal(nextState.roomUpdate[key], roomUpdate[key]));
	}

	componentDidUpdate(prevProps: IRoomViewProps, prevState: IRoomViewState) {
		const { roomUpdate, joined, mediaMsgs } = this.state;
		const {
			appState,
			insets,
			route,
			messageMultiSelect,
			selectedMessageIds,
			updateRoomLeader,
			loading,
			failure,
			result,
			error,
			isMasterDetail
		} = this.props;

		if (route?.params?.jumpToMessageId && route?.params?.jumpToMessageId !== prevProps.route?.params?.jumpToMessageId) {
			this.jumpToMessage(route?.params?.jumpToMessageId);
		}

		if (updateRoomLeader !== prevProps.updateRoomLeader) {
			this.fetchRoomMembersLeader();
		}
		if (route?.params?.jumpToThreadId && route?.params?.jumpToThreadId !== prevProps.route?.params?.jumpToThreadId) {
			this.navToThread({ tmid: route?.params?.jumpToThreadId });
		}

		if (appState === 'foreground' && appState !== prevProps.appState && this.rid) {
			// Fire List.query() just to keep observables working
			if (this.list && this.list.current && !isIOS) {
				this.list.current?.query();
			}
		}
		// If it's a livechat room
		if (this.t === 'l') {
			if (
				!dequal(prevState.roomUpdate.lastMessage?.token, roomUpdate.lastMessage?.token) ||
				!dequal(prevState.roomUpdate.visitor, roomUpdate.visitor) ||
				!dequal(prevState.roomUpdate.status, roomUpdate.status) ||
				prevState.joined !== joined
			) {
				this.updateOmnichannel();
			}
		}
		if (roomAttrsUpdate.some(key => !dequal(prevState.roomUpdate[key], roomUpdate[key]))) this.setHeader();
		if (insets.left !== prevProps.insets.left || insets.right !== prevProps.insets.right) {
			this.setHeader();
		}
		if (
			insets.left !== prevProps.insets.left ||
			insets.right !== prevProps.insets.right ||
			messageMultiSelect !== prevProps.messageMultiSelect ||
			selectedMessageIds !== prevProps.selectedMessageIds
		) {
			this.setHeader();
		}
		this.setReadOnly();
		if (mediaMsgs !== prevState.mediaMsgs && prevState.mediaMsgs.length !== 0) {
			this.updateShowPhoto();
		}

		if (loading !== prevProps.loading) {
			sendLoadingEvent({ visible: loading });
			if (!loading) {
				if (failure) {
					const msg = error.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_discussion') });
					showErrorAlert(msg);
				} else {
					const { rid, t, prid } = result;
					const item = {
						rid,
						name: getRoomTitle(result),
						t,
						prid
					};
					goRoom({ item, isMasterDetail, popToRoot: true });
				}
			}
		}
	}

	getRobotId = () => {
		const { room } = this.state;

		// @ts-ignore
		if (room?.robotName) {
			this.robotId = room.name;
			this.botInfo = {
				// @ts-ignore
				name: room?.robotName,
				username: room.name || room.fname,
				_id: room._id
			};
			return;
		}
		// @ts-ignore
		const { usernames, uids, fname } = room;
		const { user } = this.props;
		if (usernames && usernames.length > 0) {
			this.robotId = usernames.filter((item: string) => item !== user.username)[0] as unknown as string;
			const _id = uids.filter((item: string) => item !== user.id)[0] as unknown as string;
			this.botInfo = {
				name: fname,
				username: this.robotId,
				_id
			};
		}
	};

	getConversationId = () => {
		const { lastMessage } = this.state.room;
		const msgData: IMsgData = lastMessage?.msgData && JSON.parse(lastMessage?.msgData);
		const ts = lastMessage?.ts;
		if (!ts || !msgData) return;
		const gapTime = new Date().getTime() - new Date(ts).getTime();
		// // 间隔时间大于一小时取新的Id
		this.conversationId = gapTime > 3600 * 1000 ? undefined : msgData.conversationId;
	};

	updateOmnichannel = async () => {
		const canForwardGuest = await this.canForwardGuest();
		const canPlaceLivechatOnHold = this.canPlaceLivechatOnHold();
		const canReturnQueue = await this.canReturnQueue();
		const canViewCannedResponse = await this.canViewCannedResponse();
		this.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
		if (this.mounted) {
			this.setHeader();
		}
	};

	checkUploadFileStatus = async () => {
		const db = database.active;
		const uploadsCollection = db.get('uploads');
		const uploads = await uploadsCollection.query(Q.where('rid', this.state.room.rid));
		uploads.forEach(async (upload: any) => {
			const { id, path } = upload;
			if (!isUploadActive(path, id)) {
				const messageRecord = await getMessageById(id);
				if (messageRecord && messageRecord.attachments) {
					const attachment = messageRecord.attachments[0];
					attachment.uploadFail = true;
					attachment.uploadProgress = 0;
					await db.write(async () => {
						await messageRecord.update(m => {
							m.attachments = [attachment];
						});
					});
				}
				await db.write(async () => {
					await upload.destroyPermanently();
				});
			}
		});
	};

	async componentWillUnmount() {
		const { dispatch } = this.props;
		const { editing, room } = this.state;
		const db = database.active;
		this.mounted = false;
		if (!editing && this.messagebox && this.messagebox.current) {
			const { text } = this.messagebox.current;
			let obj: TSubscriptionModel | TThreadModel | null = null;
			if (this.tmid) {
				try {
					const threadsCollection = db.get('threads');
					obj = await threadsCollection.find(this.tmid);
				} catch (e) {
					// Do nothing
				}
			} else {
				obj = room as TSubscriptionModel;
			}
			if (obj) {
				try {
					const object = obj;
					await db.write(async () => {
						await object.update(r => {
							r.draftMessage = text;
						});
					});
				} catch (error) {
					// Do nothing
				}
			}
		}
		this.unsubscribe();
		if (this.didMountInteraction && this.didMountInteraction.cancel) {
			this.didMountInteraction.cancel();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}

		if (this.subObserveQuery && this.subObserveQuery.unsubscribe) {
			this.subObserveQuery.unsubscribe();
		}
		if (this.queryUnreads && this.queryUnreads.unsubscribe) {
			this.queryUnreads.unsubscribe();
		}
		this.unMediascribeMessages();
		if (this.retryInitTimeout) {
			clearTimeout(this.retryInitTimeout);
		}
		EventEmitter.removeListener('connected', this.handleConnected);
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		EventEmitter.removeListener('ROOM_REMOVED', this.handleRoomRemoved);
		dispatch(setMessageMultiSelect(false));
		console.countReset(`${this.constructor.name}.render calls`);
		if (this.gptTask) {
			this.gptTask.removeAllEventListeners();
			this.gptTask.close();
		}
		if (this.showPhotosubscription) {
			this.showPhotosubscription.remove();
		}
	}

	getLocal = async () => {
		const { room } = this.state;
		try {
			const res = await Services.getAppiaRoomInfo(room.rid);
			this.setState(
				{
					isLocal: res?.data?.isLocal
				},
				() => this.setHeader()
			);
		} catch (e) {
			log(e);
		}
	};

	getIsManager = async () => {
		try {
			const res = await Services.me();
			this.setState(
				{
					isManager: res.isManager
				},
				() => this.setHeader()
			);
		} catch (e) {
			log(e);
		}
	};

	canForwardGuest = async () => {
		const { transferLivechatGuestPermission } = this.props;
		const permissions = await hasPermission([transferLivechatGuestPermission], this.rid);
		return permissions[0] as boolean;
	};

	canPlaceLivechatOnHold = () => {
		const { livechatAllowManualOnHold } = this.props;
		const { room } = this.state;
		return !!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);
	};

	canViewCannedResponse = async () => {
		const { viewCannedResponsesPermission } = this.props;
		const permissions = await hasPermission([viewCannedResponsesPermission], this.rid);
		return permissions[0] as boolean;
	};

	canReturnQueue = async () => {
		try {
			const { returnQueue } = await getRoutingConfig();
			return returnQueue;
		} catch {
			return false;
		}
	};

	observeSubscriptions = () => {
		try {
			const db = database.active;
			const observeSubCollection = db
				.get('subscriptions')
				.query(Q.where('rid', this.rid as string))
				.observe();
			this.subObserveQuery = observeSubCollection.subscribe(data => {
				if (data[0]) {
					if (this.subObserveQuery && this.subObserveQuery.unsubscribe) {
						this.observeRoom(data[0]);
						this.setState({ room: data[0], joined: true });
						this.subObserveQuery.unsubscribe();
					}
				}
			});
		} catch (e) {
			console.log("observeSubscriptions: Can't find subscription to observe");
		}
	};

	get isOmnichannel() {
		const { room } = this.state;
		return room.t === 'l';
	}

	setHeader = () => {
		// const { room, unreadsCount, roomUserId, joined } = this.state;
		const { room, roomUserId } = this.state;
		// const { navigation, isMasterDetail, theme, baseUrl, user, insets, route } = this.props;
		const { navigation, route, messageMultiSelect } = this.props;
		// const selectIdsLength = selectedMessageIds.length;
		const { tmid } = this;
		if (!room.rid) {
			return;
		}

		const prid = room?.prid;
		const isGroupChatConst = isGroupChat(room as ISubscription);
		let title = route.params?.name;
		let parentTitle = '';
		// TODO: I think it's safe to remove this, but we need to test tablet without rooms
		if (!tmid) {
			title = getRoomTitle(room);
		}
		if (tmid) {
			parentTitle = getRoomTitle(room);
		}
		let subtitle: string | undefined;
		let t: string;
		let teamMain: boolean | undefined;
		// let teamId: string | undefined;
		// let encrypted: boolean | undefined;
		// let userId: string | undefined;
		// let token: string | undefined;
		// let avatar: string | undefined;
		let visitor: IVisitor | undefined;
		let sourceType: IOmnichannelSource | undefined;
		if ('id' in room) {
			subtitle = room.topic;
			t = room.t;
			teamMain = room.teamMain;
			// teamId = room.teamId;
			// encrypted = room.encrypted;
			// ({ id: userId, token } = user);
			// avatar = room.name;
			visitor = room.visitor;
		}

		if ('source' in room) {
			t = room.t;
			sourceType = room.source;
			visitor = room.visitor;
		}
		let numIconsRight = 2;
		this.canAddUser = ['c', 'p'].includes(room.t);
		if (this.canAddUser) {
			numIconsRight = 3;
		}
		const screen = Dimensions.get('window');
		navigation.setOptions({
			headerShown: true,
			headerTitleAlign: 'center',
			headerTitleContainerStyle: {
				maxWidth: screen.width - numIconsRight * 2 * 35
			},
			headerLeft: () =>
				messageMultiSelect ? (
					<Text style={{ marginLeft: 15, fontSize: 16 }} onPress={this.onMultiSelectCancel}>
						{I18n.t('Cancel')}
					</Text>
				) : (
					<HeaderButton.BackButton navigation={navigation}></HeaderButton.BackButton>
				),
			headerTitle: () => (
				<RoomHeader
					prid={prid}
					tmid={tmid}
					title={title}
					teamMain={teamMain}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					roomUserId={roomUserId}
					visitor={visitor}
					isGroupChat={isGroupChatConst}
					onPress={this.goRoomActionsView}
					testID={`room-view-title-${title}`}
					sourceType={sourceType}
					showAppiaTag={room?.showAppiaTag}
				/>
			),
			headerRight: () => {
				if (room.bot) return <HeaderButton.Item iconName='meatballs' onPress={() => this.goBotInfoView()} />;
				return messageMultiSelect ? null : (
					<HeaderButton.Container>
						{!roomUserId?.includes('.bot') && room.todoCount > 0 ? (
							<PlatformPressable onPress={this.goToTodoList} hitSlop={BUTTON_HIT_SLOP} style={{ padding: 6 }}>
								<View>
									{room.todoCount ? <TodoBadge todo={room.todoCount || 0} /> : null}
									<TodoSet />
								</View>
							</PlatformPressable>
						) : null}
						{/* {this.canAddUser ? (
							<PlatformPressable onPress={this.goToSelectedUsersView} hitSlop={BUTTON_HIT_SLOP} style={{ padding: 6 }}>
								<AddUserIcon />
							</PlatformPressable>
						) : null} */}
						<HeaderButton.Item iconName='meatballs' onPress={() => this.goRoomActionsView()} />
					</HeaderButton.Container>
				);
			}
		});
	};

	goBotInfoView = () => {
		const { navigation } = this.props;
		const { welcomeMsg } = this.state.room;
		navigation.navigate('FastModelBotInfoView', {
			botName: this.botInfo?.name as unknown as string,
			botId: this.robotId as unknown as string,
			welcomeMsg: welcomeMsg as unknown as string,
			rid: this.rid
		});
	};

	goToTodoList = () => {
		const { navigation } = this.props;
		const { room } = this.state;

		navigation.navigate('TodoListView', {
			rid: room.rid
		});
	};

	addUser = () => {
		const { room } = this.state;
		const { dispatch, navigation } = this.props;
		const { rid, federated } = room;
		try {
			dispatch(setLoading(true));
			Services.addUsersToRoom(rid, federated);
			dispatch(setLoading(false));
			navigation.pop();
			dispatch(reset());
		} catch (e) {
			console.info('e', e);
			showToast('添加人员失败');
			log(e);
			dispatch(setLoading(false));
		}
	};

	goToSelectedUsersView = () => {
		const { navigation, dispatch } = this.props;
		const { room, isLocal, isManager } = this.state;
		dispatch(reset());
		navigation.navigate('SelectedUsersView', {
			room: room as unknown as TSubscriptionModel,
			isManager,
			isLocal,
			title: I18n.t('Add_users'),
			includeMe: false,
			nextAction: () => this.addUser(),
			fromRoomView: true
		});
	};

	goRoomActionsView = (screen?: keyof ModalStackParamList) => {
		logEvent(events.ROOM_GO_RA);
		const {
			room,
			member,
			joined,
			canForwardGuest,
			canReturnQueue,
			canViewCannedResponse,
			canPlaceLivechatOnHold,
			isLocal,
			isManager
		} = this.state;
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			// @ts-ignore
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: this.rid as string,
					t: this.t as SubscriptionType,
					room: room as ISubscription,
					member,
					showCloseModal: !!screen,
					joined,
					omnichannelPermissions: { canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold }
				}
			});
		} else if (this.rid && this.t) {
			navigation.push('RoomActionsView', {
				rid: this.rid,
				t: this.t as SubscriptionType,
				room: room as TSubscriptionModel,
				member,
				joined,
				leaderViewState: this.leaderViewState,
				omnichannelPermissions: { canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold },
				isLocal,
				isManager
			});
		}
	};

	setReadOnly = async () => {
		const { room } = this.state;
		const { user } = this.props;
		const readOnly = await isReadOnly(room as ISubscription, user.username as string);
		this.setState({ readOnly });
	};

	init = async () => {
		try {
			this.setState({ loading: true });
			const { room, joined } = this.state;
			if (!this.rid) {
				return;
			}
			if (this.tmid) {
				await loadThreadMessages({ tmid: this.tmid, rid: this.rid });
			} else {
				const newLastOpen = new Date();
				await RoomServices.getMessages({
					rid: room.rid,
					t: room.t as RoomType,
					...('lastOpen' in room && room.lastOpen ? { lastOpen: room.lastOpen } : {})
				});

				// if room is joined
				if (joined && 'id' in room) {
					if (room.alert || room.unread || room.userMentions) {
						this.setLastOpen(room.ls);
					} else {
						this.setLastOpen(null);
					}
					readMessages(room.rid, newLastOpen, true).catch(e => console.log(e));
				}
			}

			const canAutoTranslate = canAutoTranslateMethod();
			const member = await this.getRoomMember();

			this.setState({ canAutoTranslate, member, loading: false });
		} catch (e) {
			this.setState({ loading: false });
			this.retryInit += 1;
			if (this.retryInit <= 1) {
				this.retryInitTimeout = setTimeout(() => {
					this.init();
				}, 300);
			}
		}
	};

	getRoomMember = async () => {
		const { room } = this.state;
		const { t } = room;

		if ('id' in room && t === 'd' && !isGroupChat(room)) {
			try {
				const roomUserId = getUidDirectMessage(room);
				this.setState({ roomUserId }, () => this.setHeader());

				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					return result.user;
				}
			} catch (e) {
				log(e);
			}
		}

		return {};
	};

	findAndObserveRoom = async (rid: string) => {
		try {
			const db = database.active;
			const subCollection = await db.get('subscriptions');
			const room = await subCollection.find(rid);
			this.setState({ room });
			if (!this.tmid) {
				this.setHeader();
			}
			this.observeRoom(room);
		} catch (error) {
			if (this.t !== 'd') {
				console.log('Room not found');
				this.internalSetState({ joined: false });
			}
			if (this.rid) {
				this.observeSubscriptions();
			}
		}
	};

	unsubscribe = async () => {
		if (this.sub && this.sub.unsubscribe) {
			await this.sub.unsubscribe();
		}
		delete this.sub;
	};

	observeRoom = (room: TSubscriptionModel) => {
		const observable = room.observe();
		this.subSubscription = observable.subscribe(changes => {
			const roomUpdate = roomAttrsUpdate.reduce((ret: any, attr) => {
				ret[attr] = changes[attr];
				return ret;
			}, {});
			if (this.mounted) {
				this.internalSetState({ room: changes, roomUpdate, isOnHold: !!changes?.onHold });
			} else {
				// @ts-ignore
				this.state.room = changes;
				// @ts-ignore
				this.state.roomUpdate = roomUpdate;
			}
		});
	};

	handleCloseEmoji = (action?: Function, params?: any) => {
		if (this.messagebox?.current) {
			return this.messagebox?.current.closeEmojiAndAction(action, params);
		}
		if (action) {
			return action(params);
		}
	};

	errorActionsShow = (message: TAnyMessageModel) => {
		this.handleCloseEmoji(this.messageErrorActions?.showMessageErrorActions, message);
	};

	showActionSheet = (options: any) => {
		const { showActionSheet } = this.props;
		this.handleCloseEmoji(showActionSheet, options);
	};

	onEditInit = (message: TAnyMessageModel) => {
		const newMessage = {
			id: message.id,
			subscription: {
				// @ts-ignore TODO: we can remove this after we merge a PR separating IMessage vs IMessageFromServer
				id: message.subscription.id
			},
			msg: message?.attachments?.[0]?.description || message.msg
		} as TMessageModel;
		this.setState({ selectedMessage: newMessage, editing: true });
	};

	onEditCancel = () => {
		this.setState({ selectedMessage: undefined, editing: false });
	};

	onEditRequest = async (message: TAnyMessageModel) => {
		this.setState({ selectedMessage: undefined, editing: false });
		try {
			await Services.editMessage(message);
		} catch (e) {
			log(e);
		}
	};

	onMultiSelectInit = (msgId: string, oneByOne?: boolean) => {
		this.oneByOne = !!oneByOne;
		const { dispatch } = this.props;
		dispatch(setMessageMultiSelect(true));
		dispatch(setSelectedMessageIds([msgId]));
	};

	onMultiSelectCancel = () => {
		const { dispatch } = this.props;
		dispatch(setMessageMultiSelect(false));
		// dispatch(setSelectedMessageIds([]));
	};

	onForwardInit = (msgId: string) => {
		this.directForwardTo([msgId], false);
	};

	// onMessageChecked = (selectedMsgIds: string[]) => {
	// 	this.setState({ selectedMsgIds });
	// };

	onPressForward = (isOneByOne: boolean) => {
		const { selectedMessageIds } = this.props;
		if (selectedMessageIds.length > 0) {
			this.directForwardTo(selectedMessageIds, !isOneByOne);
		}
	};

	directForwardTo = (msgIds: string[], isMerged: boolean) => {
		let isOk = false;
		Navigation.navigate('SelectedUsersView', {
			msgIds,
			title: I18n.t('Forward_to'),
			buttonText: I18n.t('Confirm'),
			hasRooms: true,
			maxUsers: 10,
			includeMe: false,
			nextAction: async (navigation: any, list: ISelectedUser[]) => {
				if (!isOk) {
					isOk = true;
					await Services.forwardMessage({
						forwardUsers: list.filter(a => a?.isUser || !a.rid).map(a => a._id),
						forwardRooms: list.filter(a => !a?.isUser && !!a.rid).map(a => a.rid as string),
						forwardMessageIds: msgIds,
						isForwardMessage: true,
						isForwardMerged: isMerged
					});
					navigation?.pop();
					this.onMultiSelectCancel();
				}
			}
		});
	};

	onReplyInit = (message: TAnyMessageModel, mention: boolean) => {
		// If there's a thread already, we redirect to it
		if (mention && !!message.tlm) {
			return this.onThreadPress(message);
		}
		this.setState({
			selectedMessage: message,
			replying: true,
			replyWithMention: mention
		});
	};

	onReplyCancel = () => {
		this.setState({ selectedMessage: undefined, replying: false, replyWithMention: false });
	};

	showReactionPicker = () => {
		const { showActionSheet } = this.props;
		const { selectedMessage } = this.state;
		setTimeout(() => {
			showActionSheet({
				children: (
					<ReactionPicker message={selectedMessage} onEmojiSelected={this.onReactionPress} reactionClose={this.onReactionClose} />
				),
				snaps: [400],
				enableContentPanningGesture: false
			});
		}, 100);
	};

	onReactionInit = (message: TAnyMessageModel) => {
		this.handleCloseEmoji(() => {
			this.setState({ selectedMessage: message }, this.showReactionPicker);
		});
	};

	onDeleteMsgId = (messageId: string) => {
		this.sub?.onPushDeleteMessageId(messageId);
	};

	onReactionClose = () => {
		const { hideActionSheet } = this.props;
		this.setState({ selectedMessage: undefined }, hideActionSheet);
	};

	onMessageLongPress = (message: TAnyMessageModel) => {
		// if it's a thread message on main room, we disable the long press
		if (message.tmid && !this.tmid) {
			return;
		}
		// 已经在多选状态下不弹出 MessageActions 弹窗
		const { messageMultiSelect } = this.props;
		if (messageMultiSelect) {
			return;
		}
		this.handleCloseEmoji(this.messageActions?.showMessageActions, message);
	};

	private topMsgId = '';
	private slideDirection = '';
	showAttachment = (attachment: IAttachment) => {
		Keyboard.dismiss();
		const { mediaMsgs } = this.state;
		// 组装数据源
		let mediaIndex = -1;
		const photos = mediaMsgs.map((item, index) => {
			const subAttachments = item.attachments;
			if (subAttachments && subAttachments.length) {
				const subAttachment = subAttachments[0];
				if (subAttachment.image_url && subAttachment.image_url === attachment.image_url) {
					mediaIndex = index;
				}
				if (subAttachment.video_url && subAttachment.video_url === attachment.video_url) {
					mediaIndex = index;
				}
				const photo = attachmentToPhoto(subAttachment);
				return photo;
			}
			return null;
		});

		const JSToNativeManager = NativeModules?.JSToNativeManager;
		if (mediaIndex < 0) {
			JSToNativeManager.showPhoto(attachmentToPhoto(attachment));
			return;
		}

		const { NativeToJSManager } = NativeModules;

		// 增加图片翻页的监听
		const NativeToJSEmitter = new NativeEventEmitter(NativeToJSManager);
		if (this.showPhotosubscription) {
			this.showPhotosubscription.remove();
		}
		this.showPhotosubscription = NativeToJSEmitter.addListener('slidePhoto', reminder => {
			const { slideDirection } = reminder;
			if (slideDirection === 'previous') {
				const topMsg = this.list.current?.getTopMsg() as TAnyMessageModel;
				const msgId = topMsg.id;
				if (msgId !== this.topMsgId) {
					this.slideDirection = 'previous';
					this.topMsgId = msgId;
					this.list.current?.onEndReached();
					this.loadHistoryData(msgId);
				}
			} else {
				this.slideDirection = '';
				console.info('reminder', slideDirection);
			}
		});
		// 显示图片
		JSToNativeManager.showPhotoBrowser(mediaIndex, photos);
	};

	updateShowPhoto = () => {
		if (!isIOS) {
			//  android手机 JS 退到后台进去预览图片页面，新来的消息无法写入数据库，无法做到更新
			return;
		}
		const { mediaMsgs } = this.state;
		// 组装数据源
		const photos = mediaMsgs.map(item => {
			const subAttachments = item.attachments;
			if (subAttachments && subAttachments.length) {
				const subAttachment = subAttachments[0];
				const photo = attachmentToPhoto(subAttachment);
				return photo;
			}
			return null;
		});
		const JSToNativeManager = NativeModules?.JSToNativeManager;
		JSToNativeManager?.changePhoto(this.slideDirection === 'previous' ? 1 : 0, photos);
		this.slideDirection = '';
	};

	loadHistoryData = (loaderId: string) => {
		const { dispatch } = this.props;
		const { room } = this.state;
		const { rid, t } = room;
		dispatch(roomHistoryRequest({ rid, t: t as RoomType, loaderId }));
	};

	private mediaMessagesSubscription?: Subscription;
	private mediaMessagesObservable?: Observable<TMessageModel[]>;
	queryMediaMsgs = () => {
		const { room } = this.state;
		const { rid } = room;
		const db = database.active;

		// const count = 1000;

		if (rid) {
			const whereClause = [
				Q.where('rid', rid),
				Q.or(
					Q.where('attachments', Q.like(`%${Q.sanitizeLikeString('image_type')}%`)),
					Q.where('attachments', Q.like(`%${Q.sanitizeLikeString('video_type')}%`))
				),
				Q.where('attachments', Q.notLike(`%${Q.sanitizeLikeString('author_name')}%`)),
				Q.experimentalSortBy('ts', Q.asc),
				Q.experimentalSkip(0)
				// Q.experimentalTake(count)
			] as (Q.WhereDescription | Q.Or)[];

			this.mediaMessagesObservable = db
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		if (rid) {
			this.unMediascribeMessages();
			this.mediaMessagesSubscription = this.mediaMessagesObservable?.subscribe(messages => {
				this.internalSetState({
					mediaMsgs: messages
				});
			});
		}
	};

	unMediascribeMessages = () => {
		if (this.mediaMessagesSubscription && this.mediaMessagesSubscription.unsubscribe) {
			this.mediaMessagesSubscription.unsubscribe();
		}
	};

	onMessagePress = (message: TAnyMessageModel) => {
		const { messageMultiSelect, selectedMessageIds, dispatch } = this.props;
		const tempArr = [...selectedMessageIds];
		if (messageMultiSelect) {
			const index = tempArr.indexOf(message.id);

			if (index === -1) {
				tempArr.push(message.id);
			} else {
				tempArr.splice(index, 1);
			}
			dispatch(setSelectedMessageIds(tempArr));
		}
		this.messagebox.current?.resetKeyboard();
	};

	onMessagePressIn = () => {
		this.messagebox.current?.resetKeyboard();
	};

	onReeditMessage = (recallMessage: string) => {
		this.messagebox.current?.setReEditMessage(recallMessage);
	};

	onReactionPress = async (emoji: IEmoji, messageId: string) => {
		try {
			let shortname = '';
			if (typeof emoji === 'string') {
				shortname = emoji;
			} else {
				shortname = emoji.name;
			}
			await Services.setReaction(shortname, messageId);
			this.onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	createDiscussion = ({ message, channel }: { message: TAnyMessageModel; channel: TSubscriptionModel }) => {
		const { dispatch } = this.props;
		const params: ICreateDiscussionRequestData = {
			prid: ('prid' in channel && channel.prid) || channel.rid,
			pmid: message._id,
			t_name: message.msg || I18n.t('Untitled_Topic'),
			users: [],
			md: message.md
		};

		dispatch(createDiscussionRequest(params));
	};

	handleToggleTodo = (message: TAnyMessageModel, type: string) => {
		if (type === 'h') {
			this.setState({ inputModalVisible: true, todoMessage: message });
		} else {
			Services.toggleTodoMessage(message._id || message?._raw.id, 1, '', 'd')
				.then(res => {
					console.info('添加成功 =', res);
				})
				.catch(err => {
					console.info('添加失败 =', err);
				});
		}
	};

	onReactionLongPress = (message: TAnyMessageModel) => {
		this.setState({ selectedMessage: message });
		const { showActionSheet } = this.props;
		const { selectedMessage } = this.state;
		this.handleCloseEmoji(showActionSheet, {
			children: <ReactionsList reactions={selectedMessage?.reactions} getCustomEmoji={this.getCustomEmoji} />,
			snaps: ['50%'],
			enableContentPanningGesture: false
		});
	};

	onEncryptedPress = () => {
		logEvent(events.ROOM_ENCRYPTED_PRESS);
		const { navigation, isMasterDetail } = this.props;

		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } };

		if (isMasterDetail) {
			// @ts-ignore
			return navigation.navigate('ModalStackNavigator', screen);
		}
		// @ts-ignore
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	};

	onDiscussionPress = debounce(
		async (item: TAnyMessageModel) => {
			const { isMasterDetail } = this.props;
			if (!item.drid) return;
			const sub = await getRoomInfo(item.drid);
			if (sub) {
				goRoom({
					item: sub as TGoRoomItem,
					isMasterDetail,
					popToRoot: true
				});
			}
		},
		1000,
		true
	);

	// eslint-disable-next-line react/sort-comp
	updateUnreadCount = async () => {
		if (!this.rid) {
			return;
		}
		const db = database.active;
		const observable = await db
			.get('subscriptions')
			.query(Q.where('archived', false), Q.where('open', true), Q.where('rid', Q.notEq(this.rid)))
			.observeWithColumns(['unread']);

		this.queryUnreads = observable.subscribe(data => {
			const { unreadsCount } = this.state;
			const newUnreadsCount = data.filter(s => s.unread > 0).reduce((a, b) => a + (b.unread || 0), 0);
			if (unreadsCount !== newUnreadsCount) {
				this.setState({ unreadsCount: newUnreadsCount }, () => this.setHeader());
			}
		});
	};

	onThreadPress = debounce((item: TAnyMessageModel) => this.navToThread(item), 1000, true);

	shouldNavigateToRoom = (message: IMessage) => {
		if (message.tmid && message.tmid === this.tmid) {
			return false;
		}
		if (!message.tmid && message.rid === this.rid) {
			return false;
		}
		return true;
	};

	jumpToMessageByUrl = async (messageUrl?: string) => {
		if (!messageUrl) {
			return;
		}
		try {
			const parsedUrl = parse(messageUrl, true);
			const messageId = parsedUrl.query.msg;
			if (messageId) {
				await this.jumpToMessage(messageId);
			}
		} catch (e) {
			log(e);
		}
	};

	jumpToMessage = async (messageId: string) => {
		try {
			sendLoadingEvent({ visible: true, onCancel: this.cancelJumpToMessage });

			const message = await Promise.race([
				RoomServices.getMessageInfo(messageId),
				new Promise((_, reject) => {
					setTimeout(() => reject(new Error('time out')), 15000);
				})
			]);

			if (!message) {
				this.cancelJumpToMessage();
				return;
			}

			if (this.shouldNavigateToRoom(message)) {
				if (message.rid !== this.rid) {
					this.navToRoom(message);
				} else {
					this.navToThread(message);
				}
			} else if (!message.tmid && message.rid === this.rid && this.t === 'thread' && !message.replies) {
				/**
				 * if the user is within a thread and the message that he is trying to jump to, is a message in the main room
				 */
				return this.navToRoom(message);
			} else {
				/**
				 * if it's from server, we don't have it saved locally and so we fetch surroundings
				 * we test if it's not from threads because we're fetching from threads currently with `loadThreadMessages`
				 */
				if (!message.tmid && this.rid) {
					if (this.fromSearch) {
						try {
							const res = await Promise.race([
								loadSurroundingMessages({ messageId, rid: this.rid, fromSearch: this.fromSearch }),
								new Promise((_, reject) => {
									setTimeout(() => reject(new Error('time out')), 15000);
								})
							]);
							if (res) {
								await this.list.current?.updateJumpMessages(res, message.id);
							}
						} catch (error) {
							this.cancelJumpToMessage();
							showToast(I18n.t('TimeOut_Retry'));
						}
						return;
					}
					if (message.fromServer) {
						await loadSurroundingMessages({ messageId, rid: this.rid });
					}
				}
				await Promise.race([this.list.current?.jumpToMessage(message.id), new Promise(res => setTimeout(res, 15000))]);
				this.cancelJumpToMessage();
			}
		} catch (e) {
			log(e);
			this.cancelJumpToMessage();
		}
	};

	cancelJumpToMessage = () => {
		this.list.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	replyBroadcast = (message: IMessage) => {
		const { dispatch } = this.props;
		dispatch(replyBroadcast(message));
	};

	handleConnected = () => {
		this.init();
		EventEmitter.removeListener('connected', this.handleConnected);
	};

	handleRoomRemoved = ({ rid }: { rid: string }) => {
		const { room } = this.state;
		if (rid === this.rid) {
			Navigation.navigate('RoomsListView');
			!this.isOmnichannel &&
				showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: getRoomTitle(room) }), I18n.t('Oops'));
		}
	};

	internalSetState = (...args: any[]) => {
		if (!this.mounted) {
			return;
		}
		// @ts-ignore TODO: TS is complaining about this, but I don't feel like changing rn since it should be working
		this.setState(...args);
	};

	handleEventSource = (message: string) => {
		// 建立 sse 请求流式数据， 其他的 fetch 方法在 RN 上无法获取流式数据
		const { user, server } = this.props;
		const { room } = this.state;
		let fastModeMessage: IFastModeMessage;
		const es = new EventSource(`${server}/api/v1/bot.sendToFastModel`, {
			method: 'post',
			headers: {
				'content-type': 'application/json',
				'x-auth-token': user.token,
				'x-user-id': user.id
			},
			body: JSON.stringify({
				prompt: message,
				stream: true,
				robotId: this.robotId,
				conversation_id: this.conversationId ? this.conversationId : null,
				toUsername: user.username,
				use_citation: true
			})
		});

		es.addEventListener('open', () => {
			console.info('Open SSE connection.');
		});

		es.addEventListener('message', event => {
			console.info('New message event:', event.data);
			if (!event.data) {
				es.removeAllEventListeners();
				es.close();
			}
			const data = JSON.parse(event.data || '') as unknown as IStreamData;
			if (!this.conversationId) {
				this.conversationId = data.conversation_id;
			}
			const { results } = data;
			const { content } = results[0];
			// 拼接流式消息
			if (fastModeMessage) {
				if (content && content.length > 0) {
					fastModeMessage.msg = `${fastModeMessage.msg}${content}`;
				}
			} else {
				fastModeMessage = { msg: content, _id: data.task_id, rid: this.rid || room.rid, u: this.botInfo };
			}

			this.list.current?.updateFastModeMessage(fastModeMessage);
			// 根据标志消息结束流式请求
			if (results[0].finish_reason) {
				fastModeMessage.ts = new Date().getTime();
				es.removeAllEventListeners();
				es.close();
				this.list.current?.setAnswering(false);
				this.setState({
					answering: false
				});
			}
		});

		es.addEventListener('error', event => {
			if (event.type === 'error') {
				console.error('Connection error:', event.message);
			} else if (event.type === 'exception') {
				console.error('Error:', event.message, event.error);
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		es.addEventListener('close', event => {
			es.removeAllEventListeners();
			es.close();
			console.log('Close SSE connection.');
		});

		this.gptTask = es;
	};

	handleSendMessage = async (message: string, tmid?: string, tshow?: boolean) => {
		logEvent(events.ROOM_SEND_MESSAGE);
		console.info('handleSendMessage asdafsdfasdfa');
		const { rid, bot } = this.state.room;
		const { user } = this.props;
		await sendMessage(rid, message, this.tmid || tmid, user, tshow).then(() => {
			if (this.list && this.list.current) {
				this.list.current?.update();
			}
			this.setLastOpen(null);
			Review.pushPositiveEvent();
		});
		if (bot && !!message) {
			this.setState({
				answering: true
			});
			this.list.current?.setAnswering(true);
			this.handleEventSource(message);
		}
	};

	getCustomEmoji: TGetCustomEmoji = name => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	setLastOpen = (lastOpen: Date | null) => this.setState({ lastOpen });

	onJoin = () => {
		this.internalSetState({
			joined: true
		});
		this.list.current?.setState({
			inRoom: true
		});
	};

	joinRoom = async () => {
		logEvent(events.ROOM_JOIN);
		try {
			const { room } = this.state;

			if (this.isOmnichannel) {
				if ('_id' in room) {
					await takeInquiry(room._id);
				}
				this.onJoin();
			} else {
				const { joinCodeRequired, rid } = room;
				if (joinCodeRequired) {
					this.joinCode.current?.show();
				} else {
					const { federated, t } = room;
					if (federated) {
						const { user, matrixDomain } = this.props;
						const res = await Services.getFederationInfo(rid);
						const federationInfo = res.success ? res.data : { mri: '', rt: '' };
						await Services.joinFederationSharedRoom(
							[`${user.username}:${matrixDomain.matrixRemote}`],
							user.username || '',
							matrixDomain.org,
							t,
							federationInfo.mri,
							federationInfo.rt
						);
					} else {
						await Services.joinRoom(rid, null, this.t as any);
					}
					this.onJoin();
				}
			}
		} catch (e) {
			showToast('加入房间失败');
			log(e);
		}
	};

	resumeRoom = async () => {
		logEvent(events.ROOM_RESUME);
		try {
			const { room } = this.state;

			if (this.isOmnichannel) {
				if ('rid' in room) {
					await takeResume(room.rid);
				}
				this.onJoin();
			}
		} catch (e) {
			log(e);
		}
	};

	getThreadName = (tmid: string, messageId: string) => {
		const { rid } = this.state.room;
		return getThreadName(rid, tmid, messageId);
	};

	toggleFollowThread = async (isFollowingThread: boolean, tmid?: string) => {
		try {
			const threadMessageId = tmid ?? this.tmid;
			if (!threadMessageId) {
				return;
			}
			await Services.toggleFollowMessage(threadMessageId, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	};

	getBadgeColor = (messageId: string) => {
		const { room } = this.state;
		const { theme } = this.props;
		return getBadgeColor({ subscription: room, theme, messageId });
	};

	navToRoomInfo = (navParam: any) => {
		const { navigation, user, isMasterDetail } = this.props;
		const { room } = this.state;

		logEvent(events[`ROOM_GO_${navParam.t === 'd' ? 'USER' : 'ROOM'}_INFO`]);
		if (navParam.rid === user.id) {
			return;
		}
		navParam.fromRid = room.rid;
		if (isMasterDetail) {
			navParam.showCloseModal = true;
			// @ts-ignore
			navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: navParam });
		} else {
			navigation.navigate('RoomInfoView', navParam);
		}
	};

	navToThread = async (item: TAnyMessageModel | { tmid: string }) => {
		const { roomUserId } = this.state;
		const { navigation } = this.props;

		if (!this.rid) {
			return;
		}

		if (item.tmid) {
			let name = '';
			let jumpToMessageId = '';
			if ('id' in item) {
				name = item.tmsg ?? '';
				jumpToMessageId = item.id;
			}
			sendLoadingEvent({ visible: true, onCancel: this.cancelJumpToMessage });
			if (!name) {
				const result = await this.getThreadName(item.tmid, jumpToMessageId);
				// test if there isn't a thread
				if (!result) {
					sendLoadingEvent({ visible: false });
					return;
				}
				name = result;
			}
			if ('id' in item && item.t === E2E_MESSAGE_TYPE && item.e2e !== E2E_STATUS.DONE) {
				name = I18n.t('Encrypted_message');
			}
			if (!jumpToMessageId) {
				setTimeout(() => {
					sendLoadingEvent({ visible: false });
				}, 300);
			}
			return navigation.push('RoomView', {
				rid: this.rid,
				tmid: item.tmid,
				name,
				t: SubscriptionType.THREAD,
				roomUserId,
				jumpToMessageId
			});
		}

		if ('tlm' in item) {
			return navigation.push('RoomView', {
				rid: this.rid,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId
			});
		}
	};

	navToRoom = async (message: TAnyMessageModel) => {
		const { isMasterDetail } = this.props;
		const roomInfo = await getRoomInfo(message.rid);

		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			jumpToMessageId: message.id
		});
	};

	// OLD METHOD - support versions before 5.0.0
	handleEnterCall = () => {
		const { room } = this.state;
		if ('id' in room) {
			const { jitsiTimeout } = room;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				callJitsi({ room });
			}
		}
	};

	handleCommands = ({ event }: { event: IKeyCommandEvent }) => {
		if (this.rid) {
			const { input } = event;
			if (handleCommandScroll(event)) {
				const offset = input === 'UIKeyInputUpArrow' ? 100 : -100;
				this.offset += offset;
				this.flatList?.current?.scrollToOffset({ offset: this.offset });
			} else if (handleCommandRoomActions(event)) {
				this.goRoomActionsView();
			} else if (handleCommandSearchMessages(event)) {
				this.goRoomActionsView('SearchMessagesView');
			} else if (handleCommandReplyLatest(event)) {
				if (this.list && this.list.current) {
					const message = this.list.current.getLastMessage();
					if (message) {
						this.onReplyInit(message, false);
					}
				}
			}
		}
	};

	blockAction = ({
		actionId,
		appId,
		value,
		blockId,
		rid,
		mid
	}: {
		actionId: string;
		appId: string;
		value: any;
		blockId: string;
		rid: string;
		mid: string;
	}) =>
		triggerBlockAction({
			blockId,
			actionId,
			value,
			mid,
			rid,
			appId,
			container: {
				type: ContainerTypes.MESSAGE,
				id: mid
			}
		});

	closeBanner = async () => {
		const { room } = this.state;
		if ('id' in room) {
			try {
				const db = database.active;
				await db.write(async () => {
					await room.update(r => {
						r.bannerClosed = true;
					});
				});
			} catch {
				// do nothing
			}
		}
		const { announcement } = room;
		if (room.rid && announcement && announcement._id) {
			try {
				await Services.roomAnnouncementRead(room.rid, announcement._id);
			} catch (e) {
				// do nothing
			}
		}
	};

	isIgnored = (message: TAnyMessageModel): boolean => {
		const { room } = this.state;
		if ('id' in room) {
			return room?.ignored?.includes?.(message?.u?._id) ?? false;
		}
		return false;
	};

	goToCannedResponses = () => {
		const { room } = this.state;
		Navigation.navigate('CannedResponsesListView', { rid: room.rid });
	};

	renderItem = (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => {
		const { room, lastOpen, canAutoTranslate } = this.state;
		const { user, Message_GroupingPeriod, Message_TimeFormat, useRealName, baseUrl, Appia_Message_Read_Receipt_Enabled, theme } =
			this.props;
		let dateSeparator = null;
		let showUnreadSeparator = false;

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = moment(item.ts).isAfter(lastOpen);
		} else {
			showUnreadSeparator =
				(lastOpen && moment(item.ts).isSameOrAfter(lastOpen) && moment(previousItem.ts).isBefore(lastOpen)) ?? false;
			if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
				dateSeparator = item.ts;
			}
		}
		let content = null;
		if (item.t && MESSAGE_TYPE_ANY_LOAD.includes(item.t as MessageTypeLoad)) {
			content = (
				<LoadMore
					rid={room.rid}
					t={room.t as RoomType}
					loaderId={item.id}
					type={item.t}
					runOnRender={item.t === MessageTypeLoad.MORE && !previousItem}
				/>
			);
		} else {
			content = (
				<Message
					item={item}
					user={user as any}
					rid={room.rid}
					archived={'id' in room && room.archived}
					broadcast={'id' in room && room.broadcast}
					status={item.status}
					isThreadRoom={!!this.tmid}
					isIgnored={this.isIgnored(item)}
					previousItem={previousItem}
					fetchThreadName={this.getThreadName}
					onPress={this.onMessagePress}
					onPressIn={this.onMessagePressIn}
					onReactionPress={this.onReactionPress}
					onReactionLongPress={this.onReactionLongPress}
					onLongPress={this.onMessageLongPress}
					onEncryptedPress={this.onEncryptedPress}
					onDiscussionPress={this.onDiscussionPress}
					onThreadPress={this.onThreadPress}
					onAnswerButtonPress={this.handleSendMessage}
					showAttachment={this.showAttachment}
					reactionInit={this.onReactionInit}
					replyBroadcast={this.replyBroadcast}
					errorActionsShow={this.errorActionsShow}
					isSystemMessage={room.sysMes as boolean}
					baseUrl={baseUrl}
					Message_GroupingPeriod={Message_GroupingPeriod}
					timeFormat={Message_TimeFormat}
					useRealName={useRealName}
					isReadReceiptEnabled={Appia_Message_Read_Receipt_Enabled}
					autoTranslateRoom={canAutoTranslate && 'id' in room && room.autoTranslate}
					autoTranslateLanguage={'id' in room ? room.autoTranslateLanguage : undefined}
					navToRoomInfo={this.navToRoomInfo}
					roomType={room.t}
					getCustomEmoji={this.getCustomEmoji}
					handleEnterCall={this.handleEnterCall}
					blockAction={this.blockAction}
					threadBadgeColor={this.getBadgeColor(item?.id)}
					toggleFollowThread={this.toggleFollowThread}
					// jumpToMessage={this.jumpToMessageByUrl}
					highlighted={highlightedMessage === item.id}
					theme={theme}
					closeEmojiAndAction={this.handleCloseEmoji}
					reeditMessage={this.onReeditMessage}
					fastModeMessage={item.msg}
					showRefer={this.showRefer}
				/>
			);
		}

		if (showUnreadSeparator || dateSeparator) {
			return (
				<>
					<Separator ts={dateSeparator} unread={showUnreadSeparator} />
					{content}
				</>
			);
		}

		return content;
	};

	renderFooter = () => {
		const {
			joined,
			room,
			selectedMessage,
			editing,
			replying,
			replyWithMention,
			readOnly,
			loading,
			canViewCannedResponse,
			answering
		} = this.state;
		const { navigation, theme, route, messageMultiSelect, noMessageBoxSet, selectedMessageIds } = this.props;

		const usedCannedResponse = route?.params?.usedCannedResponse;

		if (!this.rid || (room?.name && noMessageBoxSet.has(room.name))) {
			return null;
		}

		if (room?.name === 'mission.bot') {
			return <MissionBot />;
		}

		if (messageMultiSelect) {
			const enable = selectedMessageIds.length > 0 ? '#5f5f5f' : 'rgba(141,141,141,0.7)';
			return (
				<View style={styles.forwardFooter}>
					<Text style={[styles.buttonText, { color: '#8d8d8d' }]}>{`已选中${selectedMessageIds.length}条消息`}</Text>
					<View style={styles.buttonContainer}>
						<Touchable onPress={() => this.onPressForward(true)}>
							<View style={styles.forwardButton}>
								<ForwardOneByOneIcon color={enable} fontSize={18} />
								<Text style={[styles.buttonText, { color: enable }]}>{I18n.t('Forward_one-by-one')}</Text>
							</View>
						</Touchable>
						<Touchable onPress={() => this.onPressForward(false)}>
							<View style={styles.forwardButton}>
								<ForwardMultiIcon fontSize={18} color={enable} />
								<Text style={[styles.buttonText, { color: enable }]}>{I18n.t('Forward_combine')}</Text>
							</View>
						</Touchable>
					</View>
				</View>
			);
		}

		if ('onHold' in room && room.onHold) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-chat-on-hold' testID='room-view-chat-on-hold'>
					<Text accessibilityLabel={I18n.t('Chat_is_on_hold')} style={[styles.previewMode, { color: themes[theme].titleText }]}>
						{I18n.t('Chat_is_on_hold')}
					</Text>
					<Touch
						onPress={this.resumeRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].actionTintColor }]}
						enabled={!loading}
					>
						<Text style={[styles.joinRoomText, { color: themes[theme].buttonText }]} testID='room-view-chat-on-hold-button'>
							{I18n.t('Resume')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (!joined) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
					<Text
						accessibilityLabel={I18n.t('You_are_in_preview_mode')}
						style={[styles.previewMode, { color: themes[theme].titleText }]}
					>
						{I18n.t('You_are_in_preview_mode')}
					</Text>
					<Touch
						onPress={this.joinRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].actionTintColor }]}
						enabled={!loading}
					>
						<Text style={[styles.joinRoomText, { color: themes[theme].buttonText }]} testID='room-view-join-button'>
							{I18n.t(this.isOmnichannel ? 'Take_it' : 'Join')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (readOnly) {
			return (
				<View style={styles.readOnly}>
					<Text
						style={[styles.previewMode, { color: themes[theme].titleText }]}
						accessibilityLabel={I18n.t('This_room_is_read_only')}
					>
						{I18n.t('This_room_is_read_only')}
					</Text>
				</View>
			);
		}
		if ('id' in room && isBlocked(room)) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].titleText }]}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}
		return (
			<MessageBox
				ref={this.messagebox}
				goToCannedResponses={canViewCannedResponse ? this.goToCannedResponses : null}
				onSubmit={answering ? null : this.handleSendMessage}
				rid={this.rid}
				tmid={this.tmid}
				joined={joined}
				roomType={room.t}
				isFocused={navigation.isFocused}
				theme={theme}
				message={selectedMessage}
				editing={editing}
				editRequest={this.onEditRequest}
				editCancel={this.onEditCancel}
				replying={replying}
				replyWithMention={replyWithMention}
				replyCancel={this.onReplyCancel}
				getCustomEmoji={this.getCustomEmoji}
				navigation={navigation}
				usedCannedResponse={usedCannedResponse}
				onAttachmentShow={(show: boolean) => {
					this.list.current?.jumpToOffsetByShow(show);
				}}
				cloudDisk={this.goCloudDiskView}
				federated={room.federated}
				isBot={room.bot}
				answering={answering}
			/>
		);
	};

	goCloudDiskView = () => {
		const { navigation, dispatch } = this.props;
		dispatch(setPageNumber(1));
		navigation.navigate('CloudDiskView', { type: TYPE.CONVERSATION });
	};

	renderActions = () => {
		const { room, readOnly, isManager } = this.state;
		const { user } = this.props;
		if (!('id' in room)) {
			return null;
		}
		if (room.bot) {
			return null;
		}
		return (
			<>
				<MessageActions
					ref={ref => (this.messageActions = ref)}
					tmid={this.tmid}
					room={room}
					user={user}
					editInit={this.onEditInit}
					replyInit={this.onReplyInit}
					forwardInit={this.onForwardInit}
					multiSelectInit={this.onMultiSelectInit}
					reactionInit={this.onReactionInit}
					onReactionPress={this.onReactionPress}
					createDiscussion={this.createDiscussion}
					onDeleteMsgId={this.onDeleteMsgId}
					handleToggleTodo={this.handleToggleTodo}
					isReadOnly={readOnly}
					isManager={isManager}
				/>
				<MessageErrorActions ref={ref => (this.messageErrorActions = ref)} tmid={this.tmid} />
			</>
		);
	};

	leaderViewState = (isShow: boolean) => {
		this.setState({
			isShow
		});
	};

	fetchRoomMembersLeader = async () => {
		try {
			const { room } = this.state;
			const type = room.t as SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL;
			const result = await Services.getRoomRoles(room.rid, type);
			if (result?.success) {
				this.setState({
					roomLeader: result.roles.find(r => r.roles.includes('leader'))
				});
			}
		} catch (e) {
			log(e);
		}
	};

	toMessage = async (messageId: string) => {
		sendLoadingEvent({ visible: true, onCancel: this.cancelJumpToMessage });
		const message = await RoomServices.getMessageInfo(messageId);
		this.list.current
			?.jumpToMessage(message.id)
			.then(res => {
				console.log(res);
			})
			.catch(err => {
				console.log(err);
			});
		this.cancelJumpToMessage();
	};
	renderTop = () => {
		const { room } = this.state;
		const { user } = this.props;
		let bannerClosed;
		let announcement;

		if ('id' in room) {
			({ bannerClosed, announcement } = room);
		}
		if (!bannerClosed && announcement && announcement.readUsers) {
			announcement.readUsers.forEach(username => {
				if (username && user.username === username) {
					bannerClosed = true;
				}
			});
		}

		if (room.name === 'meeting.bot' && room.rid !== undefined) {
			return <MeetingTop roomId={room.rid} toMessage={this.toMessage} username={user.username} />;
		}

		return announcement && announcement.message && !bannerClosed ? (
			<Banner
				title={I18n.t('Announcement')}
				text={announcement && announcement.message}
				username={announcement && announcement.u && (announcement.u.name || announcement.u.username)}
				bannerClosed={bannerClosed}
				closeBanner={this.closeBanner}
			/>
		) : (
			this.renderLeader()
		);
	};

	renderWelcomeMsg = () => {
		const { showWelcomeMsg, room } = this.state;
		if (!room.welcomeMsg || !showWelcomeMsg) return null;
		return (
			<View style={styles.welcomeMsgContainer}>
				<Image source={require('./image/announce.png')} />
				<Text style={styles.welcomeMsgText}>{room.welcomeMsg}</Text>
			</View>
		);
	};

	renderLeader = () => {
		const { roomLeader } = this.state;
		const canGoDirect = !cannotGoDirect(roomLeader?.u?.username);
		return roomLeader ? (
			<View style={styles.leaderContainer}>
				<View style={styles.avatarContainer}>
					<Avatar text={roomLeader.u.username} rid={roomLeader.rid} size={44} style={styles.avatar} />
					<Text style={styles.leaderName}> {roomLeader.u.name} </Text>
				</View>
				{canGoDirect ? (
					<Button title={'现在聊天'} onPress={() => this.goLeaderRoom(roomLeader)} style={styles.leaderButton} />
				) : null}
			</View>
		) : null;
	};

	goLeaderRoom = async (roomLeader: any) => {
		const name = roomLeader.u?.username;
		const result = await Services.createDirectMessage(name);

		if (result.success) {
			const { room } = result;
			const params = {
				rid: room.rid,
				t: room.t,
				name: roomLeader.u?.name,
				roomUserId: name
			};
			Navigation.replace('RoomView', params);
		}
	};

	showRefer = async (doc: IDoc) => {
		if (doc.type.toUpperCase() === 'UUID') {
			this.setState({
				showFastModelRef: true
			});
			try {
				const res = await Services.getFastModelRef(doc.uuid, this.robotId || '');
				this.setState({
					fastModelRef: res.result.text
				});
			} catch (e) {
				console.info('获取引文失败', e);
			}
		} else if (doc.type.toUpperCase() === 'URL') {
			await OpenLink(doc.url);
		}
	};

	renderFastModelRef = () => {
		const { showFastModelRef, fastModelRef } = this.state;
		return (
			<DrawerMenu
				visible={showFastModelRef}
				hideModal={() => this.setState({ showFastModelRef: false })}
				Height={'80%'}
				menuPosition={'bottom'}
				children={
					fastModelRef ? (
						<ScrollView>
							<Text style={styles.refText}>{fastModelRef}</Text>
						</ScrollView>
					) : (
						<Text>文献获取失败</Text>
					)
				}
			/>
		);
	};

	callView = () => {
		const { room } = this.state;
		const { user } = this.props;
		let msgData: IVChatCallMsg = undefined;
		let isShow = false;
		let showText = '';

		if (room.t === 'p' && room.callMsg) {
			msgData = JSON.parse(room.callMsg) as IVChatCallMsg;
			if (msgData.recordData && typeof msgData.recordData === 'string') {
				msgData.recordData = JSON.parse(msgData.recordData) as IVCRecordData;
			}
			const currentUserStatus = msgData.userStatus?.filter(u => u.username === user.username);
			const currentUsers = msgData.userStatus?.filter(u => u.status === 'in');
			if (currentUserStatus && currentUserStatus.length > 0 && currentUsers && currentUsers.length > 0) {
				if (
					(msgData.status === 'talking' && currentUserStatus[0].status !== 'in') ||
					(msgData.status === 'calling' && currentUserStatus[0].operation === 'reject')
				) {
					isShow = true;
				}
			}
			if (isShow) {
				showText = I18n.t('Room_Join_Voice_Chat', { num: currentUsers?.length });
			}
		}

		return isShow ? (
			<TouchableOpacity
				style={{ width: '100%', height: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}
				onPress={() => {
					EventEmitter.emit(JOIN_VOICECHAT_EMITTER, { callMsg: room?.callMsg });
				}}
			>
				<PhoneIcon />
				<Text style={{ marginLeft: 5, fontSize: 14 }}>{showText}</Text>
			</TouchableOpacity>
		) : null;
	};

	todoInputView = () => {
		const { inputModalVisible } = this.state;

		return (
			<Modal animationType='fade' transparent={true} visible={inputModalVisible} style={{ backgroundColor: rgba(0, 0, 0, 0.5) }}>
				<InputModel
					title={I18n.t('To_Do_Reminder')}
					placeholder={I18n.t('To_Do_Placeholder')}
					closePress={() => {
						this.setState({ inputModalVisible: false });
					}}
					okPress={text => {
						try {
							console.info('text = ', text);
							this.setState({ inputModalVisible: false });
							Services.toggleTodoMessage(this.state.todoMessage._id || this.state.todoMessage?._raw.id, 1, text, 'h')
								.then(res => {
									console.info('添加成功 =', res);
								})
								.catch(err => {
									console.info('添加失败 =', err);
								});
						} catch (e) {
							log(e);
						}
					}}
				/>
			</Modal>
		);
	};

	render() {
		const { room, loading } = this.state;
		const { user, theme, navigation, Hide_System_Messages, serverVersion } = this.props;
		const { rid, t, name, unread } = room;
		let sysMes;
		let bannerClosed;
		let announcement;
		let tunread;
		let ignored;
		if ('id' in room) {
			({ sysMes, bannerClosed, announcement, tunread, ignored } = room);
		}

		if (!bannerClosed && announcement && announcement.readUsers) {
			announcement.readUsers.forEach(username => {
				if (username && user.username === username) {
					bannerClosed = true;
				}
			});
		}

		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='room-view'>
				<StatusBar />
				{this.todoInputView()}
				{this.callView()}
				{this.renderWelcomeMsg()}
				{this.renderTop()}
				<WatermarkView
					foreground
					watermark={user.username}
					itemWidth={Dimensions.get('window').width / 2}
					itemHeight={160}
					rotateZ={-30}
					watermarkTextStyle={{ color: rgba(0, 0, 0, 0.04) }}
				>
					<List
						ref={this.list}
						listRef={this.flatList}
						rid={rid}
						t={t}
						tmid={this.tmid}
						tunread={tunread}
						unread={unread}
						ignored={ignored}
						renderRow={this.renderItem}
						loading={loading}
						navigation={navigation}
						hideSystemMessages={Array.isArray(sysMes) ? sysMes : Hide_System_Messages}
						showMessageInMainThread={user.showMessageInMainThread ?? false}
						serverVersion={serverVersion}
						onJoin={this.joinRoom}
						setShowWelcomeMsg={this.setShowWelcomeMsg}
						onScrollBeginDrag={() => {
							// 因为没有关闭动画，所以暂时先不处理上传文件的情况
							isIOS && this.messagebox.current?.resetKeyboard();
						}}
					/>
					{this.renderFooter()}
					{this.renderActions()}
					{this.renderFastModelRef()}
					<StaffServiceButton name={name} rid={rid} />
					<SideMenuButton rid={rid} />
					<JoinCode ref={this.joinCode} onJoin={this.onJoin} rid={rid} t={t} theme={theme} />
				</WatermarkView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	messageMultiSelect: state.app.messageMultiSelect,
	selectedMessageIds: state.app.selectedMessageIds,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	noMessageBoxSet: new Set(((state.settings.Appia_NoMessageBox_Robots as string) || '').split(',').filter((v: string) => v)),
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod as number,
	Message_TimeFormat: state.settings.Message_TimeFormat as string,
	customEmojis: state.customEmojis,
	baseUrl: state.server.server,
	serverVersion: state.server.version,
	Appia_Message_Read_Receipt_Enabled: state.settings.Appia_Message_Read_Receipt_Enabled as boolean,
	Hide_System_Messages: state.settings.Hide_System_Messages as string[],
	transferLivechatGuestPermission: state.permissions['transfer-livechat-guest'],
	viewCannedResponsesPermission: state.permissions['view-canned-responses'],
	livechatAllowManualOnHold: state.settings.Livechat_allow_manual_on_hold as boolean,
	updateRoomLeader: state.room.updateRoomLeader,
	matrixDomain: JSON.parse((state.settings.Org_Matrix_Domain as string) || '[]').find(
		(item: any) => item.org.toLowerCase() === (state.settings.Enterprise_ID as string).toLowerCase()
	),
	error: state.createDiscussion.error as IError,
	failure: state.createDiscussion.failure,
	loading: state.createDiscussion.isFetching,
	result: state.createDiscussion.result as IResult,
	addUserToJoinedRoomPermission: state.permissions['add-user-to-joined-room'],
	addUserToAnyCRoomPermission: state.permissions['add-user-to-any-c-room'],
	addUserToAnyPRoomPermission: state.permissions['add-user-to-any-p-room'],
	addUserToPrivateCRoom: state.permissions['add-user-to-private-c-room'],
	accessPMembers: (state.settings.Appia_Create_External_Discussion_Members as string)?.split(',') || [],
	accessCMembers: (state.settings.Appia_Create_External_Channel_Members as string)?.split(',') || [],
	username: getUserSelector(state).username,
	server: state.server.server
});

export default connect(mapStateToProps)(withDimensions(withTheme(withSafeAreaInsets(withActionSheet(RoomView)))));
