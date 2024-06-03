import React from 'react';
import {
	BackHandler,
	FlatList,
	Keyboard,
	NativeEventSubscription,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
	Dimensions,
	Image,
	AppState
} from 'react-native';
import { batch, connect } from 'react-redux';
import { dequal } from 'dequal';
import Orientation from 'react-native-orientation-locker';
import { Q } from '@nozbe/watermelondb';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { Subscription } from 'rxjs';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { Header } from '@react-navigation/elements';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { Dispatch } from 'redux';
import RNFetchBlob from 'react-native-blob-util';
import NetInfo from '@react-native-community/netinfo';
import FastImage from 'react-native-fast-image';

import database from '../../lib/database';
import RoomItem, { ROW_HEIGHT, ROW_HEIGHT_CONDENSED } from '../../containers/RoomItem';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import I18n from '../../i18n';
import { closeSearchHeader, closeServerDropdown, openSearchHeader, roomsRequest, setSearch } from '../../actions/rooms';
import { appStart } from '../../actions/app';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { serverInitAdd } from '../../actions/server';
import { animateNextTransition } from '../../lib/methods/helpers/layoutAnimation';
import { TSupportedThemes, withTheme } from '../../theme';
import EventEmitter from '../../lib/methods/helpers/events';
import { themedHeader } from '../../lib/methods/helpers/navigation';
import {
	KEY_COMMAND,
	handleCommandAddNewServer,
	handleCommandNextRoom,
	handleCommandPreviousRoom,
	handleCommandSearching,
	handleCommandSelectRoom,
	handleCommandShowNewMessage,
	handleCommandShowPreferences,
	IKeyCommandEvent
} from '../../commands';
import { getUserSelector } from '../../selectors/login';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../dimensions';
import { getInquiryQueueSelector } from '../../ee/omnichannel/selectors/inquiry';
import {
	IApplicationState,
	ICompany,
	ISubscription,
	IUser,
	RootEnum,
	SectionHeaderType,
	SubscriptionType,
	TSubscriptionModel
} from '../../definitions';
import styles from './styles';
import ServerDropdown from './ServerDropdown';
import ListHeader, { TEncryptionBanner } from './ListHeader';
import RoomsListHeaderView from './Header';
import { ChatsStackParamList, DrawerParamList } from '../../stacks/types';
import { RoomTypes, allSearch } from '../../lib/methods';
import {
	getRoomAvatar,
	getRoomTitle,
	getUidDirectMessage,
	hasPermission,
	debounce,
	isIOS,
	isTablet
} from '../../lib/methods/helpers';
import { E2E_BANNER_TYPE, DisplayMode, SortBy, MAX_SIDEBAR_WIDTH, themes } from '../../lib/constants';
import { Services } from '../../lib/services';
import { fetchCompaniesRequest, toggleCompanies } from '../../actions/company';
import ListIcon from '../../containers/Icon/List';
import Navigation from '../../lib/navigation/appNavigation';
import MorePopWidows from './MorePopWindows';
import VersionModal, { IVersionData } from '../../containers/UpdateView';
import { getReadableVersion } from '../../utils/deviceInfo';
import { getFanweiHeaderToken, getUnreadMsgs, postUnreadViewed } from '../../lib/services/restApi';
import UserPreferences from '../../lib/methods/userPreferences';
import { createChannelRequest } from '../../actions/createChannel';
import { Review } from '../../utils/review';
import { sendLoadingEvent } from '../../containers/Loading';
import store from '../../lib/store';
import { loginWithToken } from '../../actions/login';
import { IUnreadMsgs } from '../../definitions/rest/v1/common';
import SearchRenderList from './component/searchRenderList';
import GptItemView from './GptItemView';
import { showToast } from '../../lib/methods/helpers/showToast';
import SectionHeaderView from './component/SectionHeaderView';
import ToDoFooterView from './component/ToDoFooterView';

export type TNavigation = CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'RoomsListView'>,
	CompositeNavigationProp<StackNavigationProp<ChatsStackParamList>, StackNavigationProp<DrawerParamList>>
>;

interface IOtherUser {
	_id: string;
	name: string;
	fname: string;
}

export interface IBot {
	_id: string;
	_updatedAt: string;
	enable: boolean;
	fastModelApiKey: string;
	fastModelBotId: string;
	robotId: string;
	robotName: string;
	welcomeMsg: string;
}

interface IRoomsListViewProps {
	navigation: TNavigation;
	route: RouteProp<ChatsStackParamList, 'RoomsListView'>;
	theme: TSupportedThemes;
	dispatch: Dispatch;

	[key: string]: IUser | string | boolean | ISubscription[] | number | object | TEncryptionBanner;

	user: IUser;
	server: string;
	searchText: string;
	changingServer: boolean;
	loadingServer: boolean;
	showServerDropdown: boolean;
	sortBy: string;
	groupByType: boolean;
	showFavorites: boolean;
	showUnread: boolean;
	refreshing: boolean;
	StoreLastMessage: boolean;
	useRealName: boolean;
	isMasterDetail: boolean;
	notificationPresenceCap: boolean;
	subscribedRoom: string;
	width: number;
	insets: {
		left: number;
		right: number;
	};
	queueSize: number;
	inquiryEnabled: boolean;
	encryptionBanner: TEncryptionBanner;
	showAvatar: boolean;
	displayMode: string;
	createTeamPermission: [];
	createDirectMessagePermission: [];
	createPublicChannelPermission: [];
	createPrivateChannelPermission: [];
	createDiscussionPermission: [];
	toggle: boolean;
	companies: ICompany[];
	// @ts-ignore
	isChannel?: boolean;
	// @ts-ignore
	isBots?: boolean;
	isFetching: boolean;
	selectedUsers: IOtherUser[];
	getUnreadMsgsInterval: number;
	messageUnread: number;
	channelUnread: number;
	messageBage: number;
	channelBage: number;
	gptUrl: string;
	showDot: boolean;
	channelDotColor: string;
	discussionDotColor: string;
	teamDotColor: string;
}

let id = Date.now();
const getId = (): number => ++id;

interface IRoomsListViewState {
	searching?: boolean;
	search?: IRoomItem[];
	loading?: boolean;
	chatsUpdate?: string[] | { rid: string; alert?: boolean }[];
	omnichannelsUpdate?: string[];
	chats?: IRoomItem[];
	item?: ISubscription;
	canCreateRoom?: boolean;
	version?: number;
	isShow: boolean;
	versionData?: IVersionData | undefined;
	isShowPopWindow: boolean;
	otherMsgCount: IUnreadMsgs[];
	networkIsConnected?: boolean;
	appState: AppState['currentState'];
}

interface IRoomItem extends ISubscription {
	search?: boolean;
	outside?: boolean;
}

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
const CHATS_HEADER = 'Chats';
const QUERY_SIZE = 20;

const filterIsToDo = (s: TSubscriptionModel) => Boolean(s.todoCount && s.todoCount > 0);
const filterHasDraft = (s: TSubscriptionModel) => Boolean(s.draftMessage);
const filterIsHighToDo = (s: TSubscriptionModel) => Boolean(s.highTodoCount && s.highTodoCount > 0);

const shouldUpdateProps = [
	'searchText',
	'loadingServer',
	'showServerDropdown',
	'useRealName',
	'StoreLastMessage',
	'theme',
	'isMasterDetail',
	'notificationPresenceCap',
	'queueSize',
	'inquiryEnabled',
	'encryptionBanner',
	'createTeamPermission',
	'createDirectMessagePermission',
	'createPublicChannelPermission',
	'createPrivateChannelPermission',
	'createDiscussionPermission',
	'connecting',
	'isFetching',
	'connected',
	'messageUnread',
	'channelUnread',
	'messageBage',
	'channelBage'
];

const sortPreferencesShouldUpdate = ['sortBy', 'groupByType', 'showFavorites', 'showUnread'];

const displayPropsShouldUpdate = ['showAvatar', 'displayMode'];

const getItemLayout = (data: ISubscription[] | null | undefined, index: number, height: number) => ({
	length: height,
	offset: height * index,
	index
});
const keyExtractor = (item: ISubscription) => item.rid;

class RoomsListView extends React.Component<IRoomsListViewProps, IRoomsListViewState> {
	private animated: boolean;
	private mounted: boolean;
	private unreadInterval?: any;
	private count: number;
	private unsubscribeFocus?: () => void;
	private unsubscribeBlur?: () => void;
	private sortPreferencesChanged?: boolean;
	private shouldUpdate?: boolean;
	private backHandler?: NativeEventSubscription;
	private querySubscription?: Subscription;
	private scroll?: FlatList;
	private useRealName?: boolean;
	private readonly deviceVersion: string;
	// private isSwitching: boolean;
	private previousChannelCount = 0;
	private previousDiscussionCount = 0;
	private networkUnsubscribe?: any;
	private appStateSubscription?: any;
	private allBots?: IBot[];

	private todoHeaderItem: TSubscriptionModel;
	private todoFooterItem: TSubscriptionModel;
	private messageHeaderItem: TSubscriptionModel;
	private todoList: TSubscriptionModel[] | undefined;
	private messageList: TSubscriptionModel[] | undefined;
	private sponsorHeaderItem: TSubscriptionModel;
	private likeHeaderItem: TSubscriptionModel;
	private normalHeaderItem: TSubscriptionModel;
	private sponsorChannels: TSubscriptionModel[] | undefined;
	private likeChannels: TSubscriptionModel[] | undefined;
	private normalChannels: TSubscriptionModel[] | undefined;

	private partition<T>(array: T[], predicate: (element: T) => boolean): [T[], T[]] {
		return array.reduce<[T[], T[]]>(
			(acc, item) => {
				if (predicate(item)) {
					acc[0].push(item);
				} else {
					acc[1].push(item);
				}
				return acc;
			},
			[[], []]
		);
	}

	constructor(props: IRoomsListViewProps) {
		super(props);
		console.time(`${this.constructor.name} init`);
		console.time(`${this.constructor.name} mount`);

		this.animated = false;
		this.mounted = false;
		this.count = 0;
		// this.isSwitching = false;
		this.state = {
			searching: false,
			search: [],
			loading: true,
			chatsUpdate: [] as TSubscriptionModel[],
			omnichannelsUpdate: [],
			chats: [],
			item: {} as ISubscription,
			canCreateRoom: false,
			isShow: false,
			isShowPopWindow: false,
			otherMsgCount: [],
			networkIsConnected: true,
			appState: 'unknown'
		};
		this.todoHeaderItem = {
			isHeadClose: false,
			headTitle: I18n.t('Room_List_ToDo'),
			rowNum: 0,
			showRowNum: true,
			isCanClose: false,
			headerType: SectionHeaderType.TODO
		} as TSubscriptionModel;

		this.todoFooterItem = { isHeadClose: false } as TSubscriptionModel;

		this.messageHeaderItem = {
			isHeadClose: false,
			headTitle: I18n.t('Room_List_Message'),
			rowNum: 0,
			isCanClose: true,
			headerType: SectionHeaderType.MESSAGE
		} as TSubscriptionModel;

		this.sponsorHeaderItem = {
			isHeadClose: false,
			headTitle: I18n.t('Room_List_Sponsor'),
			rowNum: 0,
			isCanClose: true,
			headerType: SectionHeaderType.SPONSOR,
			isSubHeader: true,
			showRowNum: true
		} as TSubscriptionModel;

		this.likeHeaderItem = {
			isHeadClose: false,
			headTitle: I18n.t('Room_List_Like'),
			rowNum: 0,
			isCanClose: true,
			headerType: SectionHeaderType.LIKE,
			isSubHeader: true,
			showRowNum: true
		} as TSubscriptionModel;

		this.normalHeaderItem = {
			isHeadClose: false,
			headTitle: I18n.t('Room_List_Normal'),
			rowNum: 0,
			isCanClose: true,
			headerType: SectionHeaderType.LIKE,
			isSubHeader: true,
			showRowNum: true
		} as TSubscriptionModel;

		this.setHeader();
		this.getSubscriptions();
		this.getLastestVersion();
	}

	componentDidMount() {
		const { navigation, dispatch } = this.props;
		this.handleHasPermission();
		this.mounted = true;
		this.deviceVersion = getReadableVersion;
		this.getOtherCompanyUnreadMessages();
		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
		this.unsubscribeFocus = navigation.addListener('focus', () => {
			Orientation.unlockAllOrientations();
			this.changeTabViewedStatus();
			this.animated = true;
			// Check if there were changes with sort preference, then call getSubscription to remount the list
			if (this.sortPreferencesChanged) {
				this.getSubscriptions();
				this.sortPreferencesChanged = false;
			}
			// Check if there were changes while not focused (it's set on sCU)
			if (this.shouldUpdate) {
				this.forceUpdate();
				this.shouldUpdate = false;
			}

			this.cancelSearch();

			this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.animated = false;
			dispatch(closeServerDropdown());
			this.cancelSearch();
			if (this.backHandler && this.backHandler.remove) {
				this.backHandler.remove();
			}
		});

		EventEmitter.addEventListener('connected', this.loginSuccess);
		EventEmitter.addEventListener('getHomepageList', this.getSubscriptions);
		console.timeEnd(`${this.constructor.name} mount`);

		// Subscribe
		this.networkUnsubscribe = NetInfo.addEventListener(state => {
			this.setState({
				networkIsConnected: state.isConnected!
			});
			if (this.props.companies?.length === 0) {
				dispatch(fetchCompaniesRequest());
			}
		});
		this.appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);
	}

	_handleAppStateChange = (nextAppState: AppState['currentState']) => {
		const { appState, chats } = this.state;
		if (appState.match(/inactive|background/) && nextAppState === 'active' && chats?.length === 0) {
			console.log('App has come to the foreground!');
			this.onRefresh();
		}
		this.setState({ appState: nextAppState });
	};

	getAllBots = async () => {
		try {
			const res = await Services.getAllBots();
			this.allBots = res.data;
		} catch (e) {
			console.info('getAllBots', e);
		}
	};

	loginSuccess = () => {
		this.requestFanweiHeaderToken();
		EventEmitter.removeListener('connected', this.loginSuccess);

		const cleanIconCache = UserPreferences.getString('cleanIconCacheV5');
		if (!cleanIconCache) {
			FastImage.clearDiskCache();
			FastImage.clearMemoryCache();
			UserPreferences.setString('cleanIconCacheV5', '1');
		}
	};

	requestFanweiHeaderToken = async () => {
		try {
			const token = await getFanweiHeaderToken();
			UserPreferences.setString('fwToken', token);
			UserPreferences.setString('fwTokenTime', `${new Date().getTime()}`);
		} catch (error) {
			console.info('error1', error);
		}
	};

	UNSAFE_componentWillReceiveProps(nextProps: IRoomsListViewProps) {
		const { loadingServer, searchText, server, changingServer } = this.props;

		// when the server is changed
		if (server !== nextProps.server && loadingServer !== nextProps.loadingServer && nextProps.loadingServer) {
			this.setState({ loading: true });
		}
		// when the server is changing and stopped loading
		if (changingServer && loadingServer !== nextProps.loadingServer && !nextProps.loadingServer) {
			this.getSubscriptions();
		}
		if (searchText !== nextProps.searchText) {
			this.handleSearch(nextProps.searchText);
		}
	}

	// eslint-disable-next-line complexity
	shouldComponentUpdate(nextProps: IRoomsListViewProps, nextState: IRoomsListViewState) {
		const {
			chatsUpdate,
			searching,
			item,
			canCreateRoom,
			omnichannelsUpdate,
			version,
			isShow,
			isShowPopWindow,
			otherMsgCount,
			networkIsConnected
		} = this.state;
		const propsUpdated = shouldUpdateProps.some(key => nextProps[key] !== this.props[key]);

		if (nextState.isShowPopWindow !== isShowPopWindow) return true;

		if (nextState.isShow !== isShow) {
			return true;
		}

		if (nextState.version !== version) {
			return true;
		}

		if (nextState.networkIsConnected !== networkIsConnected) {
			return true;
		}

		if (propsUpdated) {
			return true;
		}

		if (JSON.stringify(nextState.otherMsgCount) !== JSON.stringify(otherMsgCount)) {
			return true;
		}

		// check if some display props are changed to force update when focus this view again
		const displayUpdated = displayPropsShouldUpdate.some(key => nextProps[key] !== this.props[key]);
		if (displayUpdated) {
			this.shouldUpdate = true;
		}

		// check if some sort preferences are changed to getSubscription() when focus this view again
		const sortPreferencesUpdate = sortPreferencesShouldUpdate.some(key => nextProps[key] !== this.props[key]);
		if (sortPreferencesUpdate) {
			this.sortPreferencesChanged = true;
		}

		// Compare changes only once
		const chatsNotEqual = !dequal(nextState.chatsUpdate, chatsUpdate);

		// If they aren't equal, set to update if focused
		if (chatsNotEqual) {
			this.shouldUpdate = true;
		}

		const omnichannelsNotEqual = !dequal(nextState.omnichannelsUpdate, omnichannelsUpdate);

		if (omnichannelsNotEqual) {
			this.shouldUpdate = true;
		}

		if (nextState.searching !== searching) {
			return true;
		}

		if (nextState.canCreateRoom !== canCreateRoom) {
			return true;
		}

		if (nextState.item?.rid !== item?.rid) {
			return true;
		}

		// Abort if it's not focused
		if (!nextProps.navigation.isFocused()) {
			return false;
		}

		const { loading, search } = this.state;
		const { width, insets, subscribedRoom, companies, server, messageUnread, channelUnread, refreshing, navigation } = this.props;
		if (nextState.loading !== loading) {
			return true;
		}

		if (nextProps.refreshing !== refreshing && navigation.isFocused()) {
			return true;
		}

		if (nextProps.width !== width) {
			return true;
		}
		if (nextProps.companies !== companies) {
			// this.isSwitching = false;
			return true;
		}
		if (nextProps.server !== server) {
			// this.isSwitching = false;
			return true;
		}

		if (nextProps.messageUnread !== messageUnread) {
			this.previousDiscussionCount = messageUnread;
			return true;
		}

		if (nextProps.channelUnread !== channelUnread) {
			this.previousChannelCount = channelUnread;
			return true;
		}

		if (!dequal(nextState.search, search)) {
			return true;
		}
		if (nextProps.subscribedRoom !== subscribedRoom) {
			return true;
		}
		if (!dequal(nextProps.insets, insets)) {
			return true;
		}
		// If it's focused and there are changes, update
		if (chatsNotEqual || omnichannelsNotEqual) {
			this.shouldUpdate = false;
			return true;
		}
		if (nextState.chats !== this.state.chats) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps: IRoomsListViewProps) {
		const {
			sortBy,
			groupByType,
			showFavorites,
			showUnread,
			subscribedRoom,
			isMasterDetail,
			notificationPresenceCap,
			insets,
			createTeamPermission,
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createDirectMessagePermission,
			createDiscussionPermission,
			showAvatar,
			isFetching,
			displayMode
		} = this.props;
		const { item } = this.state;

		if (
			!(
				prevProps.sortBy === sortBy &&
				prevProps.groupByType === groupByType &&
				prevProps.showFavorites === showFavorites &&
				prevProps.showUnread === showUnread &&
				prevProps.showAvatar === showAvatar &&
				prevProps.displayMode === displayMode
			)
		) {
			this.getSubscriptions();
		}
		// Update current item in case of another action triggers an update on room subscribed reducer
		if (isMasterDetail && item?.rid !== subscribedRoom && subscribedRoom !== prevProps.subscribedRoom) {
			this.setState({ item: { rid: subscribedRoom } as ISubscription });
		}
		if (
			insets.left !== prevProps.insets.left ||
			insets.right !== prevProps.insets.right ||
			notificationPresenceCap !== prevProps.notificationPresenceCap
		) {
			this.setHeader();
		}

		if (
			!dequal(createTeamPermission, prevProps.createTeamPermission) ||
			!dequal(createPublicChannelPermission, prevProps.createPublicChannelPermission) ||
			!dequal(createPrivateChannelPermission, prevProps.createPrivateChannelPermission) ||
			!dequal(createDirectMessagePermission, prevProps.createDirectMessagePermission) ||
			!dequal(createDiscussionPermission, prevProps.createDiscussionPermission)
		) {
			this.handleHasPermission();
			this.setHeader();
		}

		if (isFetching !== prevProps.isFetching) {
			sendLoadingEvent({ visible: isFetching });
		}
	}

	componentWillUnmount() {
		if (this.appStateSubscription) {
			this.appStateSubscription.remove();
		}
		this.unsubscribeQuery();
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (this.backHandler && this.backHandler.remove) {
			this.backHandler.remove();
		}
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		if (this.unreadInterval) {
			clearInterval(this.unreadInterval);
		}

		EventEmitter.removeListener('getHomepageList', this.getSubscriptions);
		EventEmitter.removeListener('connected', this.loginSuccess);

		this.networkUnsubscribe();

		console.countReset(`${this.constructor.name}.render calls`);
	}

	handleHasPermission = async () => {
		const {
			createTeamPermission,
			createDirectMessagePermission,
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createDiscussionPermission
		} = this.props;
		const permissions = [
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createTeamPermission,
			createDirectMessagePermission,
			createDiscussionPermission
		];
		const permissionsToCreate = await hasPermission(permissions);
		const canCreateRoom = permissionsToCreate.filter((r: boolean) => r === true).length > 0;
		this.setState({ canCreateRoom }, () => this.setHeader());
	};

	toggle = () => {
		this.props.dispatch(toggleCompanies(!this.props.toggle));
	};

	getHeader = () => {
		const { searching, canCreateRoom } = this.state;
		// const { navigation, isMasterDetail, insets, theme } = this.props;
		const { enterpriseName } = this.props;
		// const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: searching ? 0 : 3 });

		return {
			headerTitleAlign: searching ? 'left' : 'center',
			headerLeft: () => (
				<TouchableOpacity onPress={this.toggle} style={{ paddingHorizontal: 12 }}>
					<ListIcon />
				</TouchableOpacity>
			),
			headerTitle: searching ? () => <RoomsListHeaderView /> : enterpriseName,
			headerRight: () =>
				searching ? (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.cancelSearch} />
					</HeaderButton.Container>
				) : (
					<HeaderButton.Container>
						<HeaderButton.Item iconName='search' onPress={this.initSearching} testID='rooms-list-view-search' />
						{canCreateRoom ? (
							<HeaderButton.Item
								iconName='add'
								onPress={() => this.showPopWindow(true)}
								testID='rooms-list-view-create-channel'
							/>
						) : null}
						{/* <HeaderButton.Item iconName='directory' onPress={this.goDirectory} testID='rooms-list-view-directory' /> */}
					</HeaderButton.Container>
				)
		};
	};

	showPopWindow = (isShowPopWindow: boolean) => {
		this.setState({
			isShowPopWindow
		});
	};

	setHeader = () => {
		const { navigation } = this.props;
		const options = this.getHeader() as Partial<StackNavigationOptions>;
		navigation.setOptions(options);
	};

	internalSetState = (
		state:
			| ((
					prevState: Readonly<IRoomsListViewState>,
					props: Readonly<IRoomsListViewProps>
			  ) => Pick<IRoomsListViewState, keyof IRoomsListViewState> | IRoomsListViewState | null)
			| (Pick<IRoomsListViewState, keyof IRoomsListViewState> | IRoomsListViewState | null),
		callback?: () => void
	) => {
		if (this.animated) {
			animateNextTransition();
		}
		this.setState(state, callback);
	};

	addRoomsGroup = (data: TSubscriptionModel[], header: string, allData: TSubscriptionModel[]) => {
		if (data.length > 0) {
			if (header) {
				allData.push({ rid: header, separator: true } as TSubscriptionModel);
			}
			allData = allData.concat(data);
		}
		return allData;
	};

	getSubscriptions = async () => {
		this.unsubscribeQuery();

		const { sortBy, isChannel, isBots } = this.props;
		if (isBots) {
			await this.getAllBots();
		}
		const db = database.active;
		let observable;
		let roomType;

		if (isChannel) {
			roomType = [Q.where('t', 'c'), Q.where('bot', Q.notEq(true))];
		} else if (isBots) {
			roomType = [Q.where('bot', true)];
		} else {
			roomType = [Q.where('t', Q.notEq('c')), Q.where('bot', Q.notEq(true))];
		}

		const defaultWhereClause = [Q.where('archived', false), Q.where('open', true), ...roomType] as (
			| Q.WhereDescription
			| Q.SortBy
		)[];

		if (sortBy === SortBy.Alphabetical) {
			defaultWhereClause.push(Q.experimentalSortBy(`${this.useRealName ? 'fname' : 'name'}`, Q.asc));
		} else {
			defaultWhereClause.push(Q.experimentalSortBy('room_updated_at', Q.desc));
		}

		// When we're grouping by something
		if (this.isGrouping) {
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause)
				.observeWithColumns(['alert', 'on_hold', 'f', 'isRoomToDo', 'todoCount', 'draft_message', 'like']);
			// When we're NOT grouping
		} else {
			this.count += QUERY_SIZE;
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause, Q.experimentalSkip(0), Q.experimentalTake(this.count))
				.observeWithColumns(['on_hold', 'f', 'isRoomToDo', 'todoCount', 'draft_message', 'like']);
		}

		this.querySubscription = observable.subscribe(data => {
			let tempChats = [] as TSubscriptionModel[];
			let chats = data;

			chats.sort((a, b) => {
				// 比较 tSearch 和 room_updated_at，选择最大的值进行比较
				const maxA = Math.max(a.tSearch, a.roomUpdatedAt);
				const maxB = Math.max(b.tSearch, b.roomUpdatedAt);
				return maxB - maxA; // 降序排列
			});

			// todo  高优待办+草稿 > 高优待办 > 待办+草稿 > 待办

			const toDos = chats
				.filter(s => filterIsToDo(s))
				.map(todo => {
					todo.isSubItem = false; // 或者任何你需要设置的值
					return todo;
				});
			const [highToDoList, defaultToDoList] = this.partition(toDos, filterIsHighToDo);
			const [highTodDoHasDraft, highToDoNoDraft] = this.partition(highToDoList, filterHasDraft);
			const [defaultToDoHasDraft, defaultToDoNoDraft] = this.partition(defaultToDoList, filterHasDraft);

			chats = chats.filter(s => !filterIsToDo(s));
			this.todoList = [...highTodDoHasDraft, ...highToDoNoDraft, ...defaultToDoHasDraft, ...defaultToDoNoDraft];
			// type
			tempChats = this.addRoomsGroup(chats, CHATS_HEADER, tempChats);

			const chatsUpdate = tempChats.map(item => item.rid);

			if (isBots && this.allBots && this.allBots.length > 0) {
				let arrBots;
				if (tempChats && tempChats.length > 0) {
					arrBots = this.allBots?.filter((item: any) => !tempChats.some(chat => chat && chat?.name === item?.robotId));
				} else {
					arrBots = this.allBots;
				}

				const arrBotChat = arrBots?.map(item => ({
					...item,
					status: true,
					username: item.robotId,
					name: item.robotId,
					statusText: '',
					avatarETag: '',
					fname: item.robotName,
					outside: true,
					rid: item.robotId,
					t: 'd',
					search: true,
					bot: true
				}));
				tempChats = [...tempChats, ...arrBotChat];
			}

			if (isChannel) {
				const sponsorHasDraft: TSubscriptionModel[] = [];
				const sponsorNoDraft: TSubscriptionModel[] = [];
				const likeHasDraft: TSubscriptionModel[] = [];
				const likeNoDraft: TSubscriptionModel[] = [];
				const normalHasDraft: TSubscriptionModel[] = [];
				const normalNoDraft: TSubscriptionModel[] = [];

				tempChats.forEach(item => {
					item.isSubItem = true; // 假设这个属性的设置是必要的

					const isSponsor = item.roles?.includes('owner');
					const isLike = item?.like;
					const hasDraft = !!item.draftMessage; // 转换为布尔值

					// 根据条件分类
					if (isSponsor) {
						hasDraft ? sponsorHasDraft.push(item) : sponsorNoDraft.push(item);
					} else if (isLike) {
						hasDraft ? likeHasDraft.push(item) : likeNoDraft.push(item);
					} else {
						hasDraft ? normalHasDraft.push(item) : normalNoDraft.push(item);
					}
				});

				// 使用解构赋值简化合并
				this.sponsorChannels = [...sponsorHasDraft, ...sponsorNoDraft];
				this.likeChannels = [...likeHasDraft, ...likeNoDraft];
				this.normalChannels = [...normalHasDraft, ...normalNoDraft];
			} else {
				const [messageHasDraft, messageNoDraft] = this.partition(tempChats, filterHasDraft);
				this.messageList = [...messageHasDraft, ...messageNoDraft];
			}

			tempChats = [];

			const todoCounts = this.todoList.reduce((total, currentItem) => total + currentItem.todoCount, 0);

			this.todoHeaderItem.rowNum = todoCounts;
			this.messageHeaderItem.isUnderline = false;
			if (this.todoList.length > 0) {
				tempChats.push(this.todoHeaderItem);
				if (!this.todoHeaderItem.isHeadClose || this.todoList.length <= 2) {
					tempChats.push(...this.todoList);
				} else {
					tempChats.push(...this.todoList.slice(0, 2));
				}
				this.todoFooterItem.isHeadClose = this.todoHeaderItem.isHeadClose;

				if (this.todoList.length > 2) {
					tempChats.push(this.todoFooterItem);
					this.messageHeaderItem.isUnderline = true;
				}
			}
			tempChats.push(this.messageHeaderItem);
			if (!this.messageHeaderItem.isHeadClose && isChannel) {
				if (this.sponsorChannels && this.sponsorChannels.length > 0) {
					this.sponsorHeaderItem.rowNum = this.sponsorChannels.length;
					tempChats.push(this.sponsorHeaderItem);
					if (!this.sponsorHeaderItem.isHeadClose) {
						tempChats.push(...this.sponsorChannels);
					}
				}
				if (this.likeChannels && this.likeChannels.length > 0) {
					this.likeHeaderItem.rowNum = this.likeChannels.length;
					tempChats.push(this.likeHeaderItem);
					if (!this.likeHeaderItem.isHeadClose) {
						tempChats.push(...this.likeChannels);
					}
				}
				if (this.normalChannels && this.normalChannels.length > 0) {
					this.normalHeaderItem.rowNum = this.normalChannels.length;
					tempChats.push(this.normalHeaderItem);
					if (!this.normalHeaderItem.isHeadClose) {
						tempChats.push(...this.normalChannels);
					}
				}
			} else if (!this.messageHeaderItem.isHeadClose) {
				tempChats.push(...this.messageList);
			}

			this.setState({
				searching: false,
				chats: tempChats.length > 2 ? tempChats : [],
				chatsUpdate,
				loading: false,
				version: getId()
			});
		});
	};

	unsubscribeQuery = () => {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	};

	initSearching = () => {
		logEvent(events.RL_SEARCH);
		const { dispatch, showServerDropdown } = this.props;
		this.internalSetState({ searching: true }, () => {
			if (showServerDropdown) {
				dispatch(closeServerDropdown());
			}
			dispatch(openSearchHeader());
			// 如果上次输入的结果和这次相同，就会导致不出结果
			dispatch(setSearch(''));
			this.handleSearch('');
			this.setHeader();
		});
	};

	cancelSearch = () => {
		const { searching } = this.state;
		const { dispatch } = this.props;

		if (!searching) {
			return;
		}

		Keyboard.dismiss();

		this.setState({ searching: false, search: [] }, () => {
			this.setHeader();
			dispatch(closeSearchHeader());
			setTimeout(() => {
				this.scrollToTop();
			}, 200);
		});
	};

	handleBackPress = () => {
		const { searching } = this.state;
		if (searching) {
			this.cancelSearch();
			return true;
		}
		return false;
	};

	// eslint-disable-next-line react/sort-comp
	handleSearch = debounce(async (text: string) => {
		if (text === '') {
			this.internalSetState({
				search: [],
				searching: true
			});
			return;
		}
		const result = await allSearch({ text });

		// if the search was cancelled before the promise is resolved
		const { searching } = this.state;
		if (!searching) {
			return;
		}
		this.internalSetState({
			search: result as IRoomItem[],
			searching: true
		});
		this.scrollToTop();
	}, 300);

	isSwipeEnabled = (item: IRoomItem) => !(item?.search || item?.joinCodeRequired || item?.outside);

	get isGrouping() {
		const { showUnread, showFavorites, groupByType } = this.props;
		return showUnread || showFavorites || groupByType;
	}

	onPressItem = (item = {} as ISubscription) => {
		const { navigation, isMasterDetail } = this.props;
		if (!navigation.isFocused()) {
			return;
		}

		this.cancelSearch();

		this.goRoom({ item, isMasterDetail });
	};

	onSearchPressItem = (item = {} as ISubscription) => {
		const { navigation, isMasterDetail } = this.props;
		if (!navigation.isFocused()) {
			return;
		}

		this.cancelSearch();
		const db = database.active;
		const subCollection = db.get('subscriptions');
		db.write(async () => {
			try {
				const subRecord = await subCollection.find(item.rid);
				await subRecord.update(sub => {
					const date = new Date();
					sub.roomUpdatedAt = date;
					sub.tSearch = date;
				});
			} catch (e) {
				console.info('写入失败', e);
			}
		});

		this.goRoom({ item, isMasterDetail });
	};

	scrollToTop = () => {
		if (this.scroll?.scrollToOffset) {
			this.scroll.scrollToOffset({ offset: 0 });
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

	toggleRoomToDo = async (rid: string, tIsToDo: boolean) => {
		try {
			const db = database.active;
			const result = await Services.toggleTodoRoom(rid, tIsToDo ? 0 : 1);

			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.isRoomToDo = !tIsToDo;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_TOGGLE_READ_F);
			console.info('设置失败 = ', e);
		}
	};

	hideChannel = async (rid: string, type: SubscriptionType) => {
		logEvent(events.RL_HIDE_CHANNEL);
		try {
			const db = database.active;
			const result = await Services.hideRoom(rid, type as RoomTypes);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.destroyPermanently();
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_HIDE_CHANNEL_F);
			log(e);
		}
	};

	goDirectory = () => {
		logEvent(events.RL_GO_DIRECTORY);
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'DirectoryView' });
		} else {
			navigation.navigate('DirectoryView');
		}
	};

	goQueue = () => {
		logEvent(events.RL_GO_QUEUE);
		const { navigation, isMasterDetail, inquiryEnabled } = this.props;

		if (!inquiryEnabled) {
			return;
		}

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'QueueListView' });
		} else {
			navigation.navigate('QueueListView');
		}
	};

	goRoom = ({ item, isMasterDetail }: { item: ISubscription; isMasterDetail: boolean }) => {
		logEvent(events.RL_GO_ROOM);
		const { item: currentItem } = this.state;
		const { subscribedRoom } = this.props;

		if (currentItem?.rid === item.rid || subscribedRoom === item.rid) {
			return;
		}
		// Only mark room as focused when in master detail layout
		if (isMasterDetail) {
			this.setState({ item });
		}

		// console.log(item, "itemitemitemitem")
		goRoom({ item, isMasterDetail });
	};

	goRoomByIndex = (index: number) => {
		const { chats } = this.state;
		const { isMasterDetail } = this.props;
		const filteredChats = chats ? chats.filter(c => !c.separator) : [];
		const room = filteredChats[index - 1];
		if (room) {
			this.goRoom({ item: room, isMasterDetail });
		}
	};

	findOtherRoom = (index: number, sign: number): ISubscription | void => {
		const { chats } = this.state;
		const otherIndex = index + sign;
		const otherRoom = chats?.length ? chats[otherIndex] : ({} as IRoomItem);
		if (!otherRoom) {
			return;
		}
		if (otherRoom.separator) {
			return this.findOtherRoom(otherIndex, sign);
		}
		return otherRoom;
	};

	// Go to previous or next room based on sign (-1 or 1)
	// It's used by iPad key commands
	goOtherRoom = (sign: number) => {
		const { item } = this.state;
		if (!item) {
			return;
		}

		// Don't run during search
		const { search } = this.state;
		if (search && search?.length > 0) {
			return;
		}

		const { chats } = this.state;
		const { isMasterDetail } = this.props;

		if (!chats?.length) {
			return;
		}

		const index = chats.findIndex(c => c.rid === item.rid);
		const otherRoom = this.findOtherRoom(index, sign);
		if (otherRoom) {
			this.goRoom({ item: otherRoom, isMasterDetail });
		}
	};

	createDiscussion = (chooseAll = false, isTeam: boolean) => {
		const { selectedUsers, isFetching, dispatch } = this.props;
		if (isFetching) {
			return;
		}

		const data = {
			name: '',
			users: selectedUsers.map(user => user.name),
			type: isTeam,
			readOnly: false,
			broadcast: false,
			encrypted: false,
			isTeam,
			federated: false,
			teamId: undefined,
			all: chooseAll,
			rt: ''
		};
		dispatch(createChannelRequest(data));
		Review.pushPositiveEvent();
	};

	goToNewMessage = (isChannel: boolean) => {
		logEvent(events.RL_GO_NEW_MSG);
		const { navigation, isMasterDetail } = this.props;

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView' });
		} else {
			const params = {
				fromCreatGroup: true,
				includeMe: true,
				isChannel,
				nextAction: (navigation: any, isChooseAllUser?: boolean) => {
					navigation.navigate('CreateChannelView', { isTeam: !isChannel, isChooseAllUser });
				}
			};
			navigation.navigate('NewMessageStackNavigator', { screen: 'SelectedUsersViewCreateChannel', params });
		}
	};

	goToCreateChannel = (isChannel: boolean) => {
		if (isChannel) {
			// const { navigation } = this.props;
			// navigation.navigate('CreateChannelView', { isTeam: !isChannel });
			const params = {
				fromCreatGroup: true,
				includeMe: true,
				isChannel: true,
				nextAction: (chooseAll: boolean) => {
					this.createDiscussion(chooseAll, false);
				}
			};
			this.props.navigation.navigate('NewMessageStackNavigator', {
				screen: 'SelectedUsersViewCreateChannel',
				params
			});
		} else {
			const params = {
				fromCreatGroup: true,
				includeMe: true,
				isChannel: false,
				nextAction: (chooseAll: boolean) => {
					this.createDiscussion(chooseAll, true);
				}
			};
			this.props.navigation.navigate('NewMessageStackNavigator', {
				screen: 'SelectedUsersViewCreateChannel',
				params
			});
		}
	};

	goEncryption = () => {
		logEvent(events.RL_GO_E2E_SAVE_PASSWORD);
		const { navigation, isMasterDetail, encryptionBanner } = this.props;

		const isSavePassword = encryptionBanner === E2E_BANNER_TYPE.SAVE_PASSWORD;
		if (isMasterDetail) {
			const screen = isSavePassword ? 'E2ESaveYourPasswordView' : 'E2EEnterYourPasswordView';
			navigation.navigate('ModalStackNavigator', { screen });
		} else {
			const screen = isSavePassword ? 'E2ESaveYourPasswordStackNavigator' : 'E2EEnterYourPasswordStackNavigator';
			navigation.navigate(screen);
		}
	};

	handleCommands = ({ event }: { event: IKeyCommandEvent }) => {
		const { navigation, server, isMasterDetail, dispatch } = this.props;
		const { input } = event;
		if (handleCommandShowPreferences(event)) {
			navigation.navigate('SettingsView');
		} else if (handleCommandSearching(event)) {
			this.initSearching();
		} else if (handleCommandSelectRoom(event)) {
			this.goRoomByIndex(input);
		} else if (handleCommandPreviousRoom(event)) {
			this.goOtherRoom(-1);
		} else if (handleCommandNextRoom(event)) {
			this.goOtherRoom(1);
		} else if (handleCommandShowNewMessage(event)) {
			if (isMasterDetail) {
				navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView' });
			} else {
				navigation.navigate('NewMessageStack');
			}
		} else if (handleCommandAddNewServer(event)) {
			batch(() => {
				dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
				dispatch(serverInitAdd(server));
			});
		}
	};

	onRefresh = () => {
		const { searching } = this.state;
		const { dispatch, companies } = this.props;
		if (searching) {
			return;
		}
		if (companies.length === 0) {
			dispatch(fetchCompaniesRequest());
		}
		dispatch(roomsRequest({ allData: true }));
	};

	onEndReached = () => {
		// Run only when we're not grouping by anything
		if (!this.isGrouping) {
			this.getSubscriptions();
		}
	};

	getScrollRef = (ref: FlatList) => (this.scroll = ref);

	goScan = () => {
		Navigation.navigate('ScannerView');
	};

	removeUnreads = async () => {
		const { enterpriseID, user, isChannel } = this.props;
		const { username } = user;
		await Services.removeMyUnread(`${enterpriseID}`, isChannel ? 'channel' : 'talk', username);
	};

	renderPopWindow = () => {
		const { isShowPopWindow } = this.state;
		return (
			<MorePopWidows
				show={isShowPopWindow}
				width={132}
				height={184}
				closeModal={this.showPopWindow}
				goPageView={this.goScan}
				goToNewMessage={this.goToCreateChannel}
				removeUnreads={this.removeUnreads}
			/>
		);
	};

	renderListHeader = () => {
		const { searching } = this.state;
		const { queueSize, inquiryEnabled, encryptionBanner, user, isBots } = this.props;
		return isBots ? (
			this.renderGptItem()
		) : (
			<ListHeader
				searching={searching as boolean}
				goEncryption={this.goEncryption}
				goQueue={this.goQueue}
				queueSize={queueSize}
				inquiryEnabled={inquiryEnabled}
				encryptionBanner={encryptionBanner}
				user={user}
			/>
		);
	};

	renderHeader = () => {
		const { isMasterDetail, theme } = this.props;

		if (!isMasterDetail) {
			return null;
		}

		const options = this.getHeader();
		return <Header title='' {...themedHeader(theme)} {...options} />;
	};

	renderItem = ({ item }: { item: IRoomItem }) => {
		if (item.separator) {
			// return this.renderSectionHeader(item.rid);
			return null;
		}

		const { item: currentItem, searching } = this.state;
		const {
			user: { username },
			StoreLastMessage,
			useRealName,
			isMasterDetail,
			width,
			showAvatar,
			displayMode,
			showDot,
			channelDotColor,
			discussionDotColor,
			teamDotColor,
			isBots
		} = this.props;
		const id = getUidDirectMessage(item);
		const swipeEnabled = this.isSwipeEnabled(item);

		if (
			item === this.todoHeaderItem ||
			item === this.messageHeaderItem ||
			item === this.sponsorHeaderItem ||
			item === this.likeHeaderItem ||
			item === this.normalHeaderItem
		) {
			return (
				<SectionHeaderView
					item={item as TSubscriptionModel}
					onPress={() => {
						this.updateList(item as TSubscriptionModel);
					}}
				/>
			);
		}

		if (item === this.todoFooterItem) {
			return (
				<ToDoFooterView
					item={item as TSubscriptionModel}
					onPress={() => {
						this.updateList(item as TSubscriptionModel);
					}}
				/>
			);
		}

		return (
			<View style={{ marginLeft: item.isSubItem ? 15 : 0 }}>
				<RoomItem
					item={item}
					id={id}
					username={username}
					showLastMessage={StoreLastMessage}
					onPress={this.onPressItem}
					width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
					toggleFav={this.toggleFav}
					toggleToDo={this.toggleRoomToDo}
					hideChannel={this.hideChannel}
					useRealName={useRealName}
					getRoomTitle={getRoomTitle}
					getRoomAvatar={getRoomAvatar}
					isFocused={currentItem?.rid === item.rid}
					swipeEnabled={swipeEnabled}
					showAvatar={showAvatar}
					displayMode={displayMode}
					showDot={showDot}
					channelDotColor={channelDotColor}
					discussionDotColor={discussionDotColor}
					teamDotColor={teamDotColor}
					borderRadius={isBots ? 4 : null}
					isSearch={searching}
				/>
			</View>
		);
	};

	updateList = (item: TSubscriptionModel) => {
		const addTodoList = (tempChats: TSubscriptionModel[]) => {
			this.todoList && this.todoList.length > 0 && tempChats.push(this.todoHeaderItem);
			if (!this.todoHeaderItem.isHeadClose) {
				this.todoList && tempChats.push(...this.todoList);
			} else if (this.todoList && this.todoList.length > 2) {
				tempChats.push(...this.todoList.slice(0, 2));
			} else {
				this.todoList && tempChats.push(...this.todoList);
			}
			if (this.todoList && this.todoList.length > 2) {
				tempChats.push(this.todoFooterItem);
			}
		};

		if (item === this.todoFooterItem) {
			this.todoHeaderItem.isHeadClose = !this.todoHeaderItem.isHeadClose;
			this.todoFooterItem.isHeadClose = this.todoHeaderItem.isHeadClose;
		} else {
			item.isHeadClose = !item.isHeadClose;
		}

		if (!this.props.isChannel) {
			const tempChats: TSubscriptionModel[] = [];
			addTodoList(tempChats);

			tempChats.push(this.messageHeaderItem);
			if (!this.messageHeaderItem.isHeadClose) {
				this.messageList && tempChats.push(...this.messageList);
			}
			this.setState({ chats: [...tempChats] });
		} else {
			const tempChats: TSubscriptionModel[] = [];
			addTodoList(tempChats);

			tempChats.push(this.messageHeaderItem);
			if (!this.messageHeaderItem.isHeadClose) {
				if (this.sponsorChannels && this.sponsorChannels.length > 0) {
					tempChats.push(this.sponsorHeaderItem);
					if (!this.sponsorHeaderItem.isHeadClose) {
						tempChats.push(...this.sponsorChannels);
					}
				}
				if (this.likeChannels && this.likeChannels.length > 0) {
					tempChats.push(this.likeHeaderItem);
					if (!this.likeHeaderItem.isHeadClose) {
						tempChats.push(...this.likeChannels);
					}
				}
				if (this.normalChannels && this.normalChannels.length > 0) {
					tempChats.push(this.normalHeaderItem);
					if (!this.normalHeaderItem.isHeadClose) {
						tempChats.push(...this.normalChannels);
					}
				}
			}
			this.setState({ chats: [...tempChats] });
		}
	};

	renderSectionHeader = (header: string) => {
		const { theme } = this.props;
		return (
			<View style={[styles.groupTitleContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.groupTitle, { color: themes[theme].controlText }]}>{I18n.t(header)}</Text>
			</View>
		);
	};

	getOtherCompanyUnreadMessages = () => {
		// const { user } = this.props;
		const requestMsgs = async (firstLoad = false) => {
			try {
				const data = await getUnreadMsgs();
				this.setState({
					otherMsgCount: data
				});

				if (firstLoad) {
					const currentCompany = data.filter(ele => ele.org === this.props.enterpriseID);
					const currentTabItem = currentCompany[0];
					this.previousChannelCount = currentTabItem.recentChannelViewed ? currentTabItem?.unreadChannelCount : 0;
					this.previousDiscussionCount = currentTabItem.recentTalkViewed ? currentTabItem?.unreadTalkCount : 0;
					this.forceUpdate();
				}
			} catch (error) {
				// console.info('error2', error);
			}
		};
		this.unreadInterval && clearInterval(this.unreadInterval);
		requestMsgs(true);

		this.unreadInterval = setInterval(() => {
			requestMsgs();
		}, this.props.getUnreadMsgsInterval || 60000);
	};

	changeTabViewedStatus = async () => {
		const { isChannel, enterpriseID, channelUnread, messageUnread } = this.props;
		this.previousChannelCount = channelUnread;
		this.previousDiscussionCount = messageUnread;

		this.shouldUpdate = true;
		await postUnreadViewed(enterpriseID as string, isChannel ? 'channel' : 'talk');
	};

	renderTabItem = (item: any) => {
		const current = this.props.server === item.item.appiaUrl;
		const onPress = () => {
			console.info('=====================switchStart=====================', new Date());
			if (!current) {
				// this.isSwitching = true;
				if (!this.state.networkIsConnected) {
					showToast(I18n.t('NetworkError'));
					return;
				}
				const data = item.item;
				store.dispatch(loginWithToken(data));
			}
		};

		let { width } = Dimensions.get('window');
		const num = this.props.companies.length;
		width = num <= 3 ? width / num : width / 3;
		const { otherMsgCount } = this.state;
		const currentCompany = otherMsgCount.filter(ele => ele.org === item.item.companyName);
		let channelCount = 0;
		let discussionCount = 0;
		let channelColor = '';
		let dicussionColor = '';
		if (current) {
			const { channelUnread, messageUnread, isChannel, navigation } = this.props;
			channelCount = channelUnread;
			discussionCount = messageUnread;

			if (isChannel) {
				channelColor = channelUnread > this.previousChannelCount ? '#48C79C' : '#C9CDD4';
				dicussionColor = messageUnread > this.previousDiscussionCount ? '#48C79C' : '#C9CDD4';

				if (navigation.isFocused()) {
					this.previousChannelCount = channelUnread;
					channelColor = '#C9CDD4';
				}
			} else {
				dicussionColor = messageUnread > this.previousDiscussionCount ? '#48C79C' : '#C9CDD4';
				channelColor = channelUnread > this.previousChannelCount ? '#48C79C' : '#C9CDD4';

				if (navigation.isFocused()) {
					this.previousDiscussionCount = messageUnread;
					dicussionColor = '#C9CDD4';
				}
			}
		} else {
			const currentTabItem = currentCompany[0];
			channelCount = currentTabItem?.unreadChannelCount || 0;
			discussionCount = currentTabItem?.unreadTalkCount || 0;
			channelColor = currentTabItem?.recentChannelViewed || channelCount === 0 ? '#C9CDD4' : '#48C79C';
			dicussionColor = currentTabItem?.recentTalkViewed || discussionCount === 0 ? '#C9CDD4' : '#48C79C';
		}
		return (
			<TouchableOpacity onPress={onPress} style={{ width }}>
				<View
					style={{
						height: 40,
						backgroundColor: `${current ? 'white' : '#F3F3F3'}`,
						borderTopLeftRadius: 10,
						borderTopRightRadius: 10,
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'row'
					}}
				>
					<Text style={{ fontSize: 14, color: `${current ? '#1D2129' : '#4E5969'}`, minWidth: 30 }}>
						{item.item.companyNameCn}
					</Text>
					<View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
						<View
							style={{
								backgroundColor: dicussionColor,
								width: 12,
								height: 12,
								borderRadius: 6,
								borderWidth: 1,
								borderColor: 'white',
								zIndex: 2
							}}
						/>

						<View
							style={{
								backgroundColor: channelColor,
								width: 10,
								height: 10,
								borderRadius: 5,
								marginLeft: -2,
								zIndex: 1
							}}
						/>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	renderTab = () => {
		let index = 0;
		for (let i = 0; i < this.props.companies.length; i++) {
			const item = this.props.companies[i];
			if (this.props.server === item.appiaUrl) {
				index = i;
				break;
			}
		}
		let { width } = Dimensions.get('window');
		const num = this.props.companies.length;
		width = num <= 3 ? width / num : width / 3;
		return (
			<View style={{ width: '100%', height: 40 }}>
				<FlatList
					data={this.props.companies}
					initialScrollIndex={index > 2 ? index - 2 : 0}
					renderItem={item => this.renderTabItem(item)}
					horizontal={true}
					style={{ backgroundColor: '#F3F3F3' }}
					bounces={false}
					showsHorizontalScrollIndicator={false}
					getItemLayout={(data, index) => ({
						length: width,
						offset: width * index,
						index
					})}
				/>
			</View>
		);
	};

	renderScroll = () => {
		const { loading, chats, search, searching } = this.state;
		// const { theme, refreshing, displayMode } = this.props;
		const {
			theme,
			refreshing,
			displayMode,
			user: { username },
			StoreLastMessage,
			useRealName,
			showAvatar,
			showDot,
			channelDotColor,
			discussionDotColor,
			teamDotColor,
			isBots,
			searchText
		} = this.props;

		const height = displayMode === DisplayMode.Condensed ? ROW_HEIGHT_CONDENSED : ROW_HEIGHT;
		if (loading) {
			return <ActivityIndicator />;
		}
		return (
			<>
				{searching ? (
					// 无数据时 给出数据的结构 先把scrollView渲染出来 免得出错
					<SearchRenderList
						data={search}
						displayMode={displayMode}
						onEndReached={this.onEndReached}
						username={username}
						showLastMessage={StoreLastMessage}
						onPress={this.onSearchPressItem}
						useRealName={useRealName}
						getRoomTitle={getRoomTitle}
						getRoomAvatar={getRoomAvatar}
						showAvatar={showAvatar}
						showDot={showDot}
						channelDotColor={channelDotColor}
						discussionDotColor={discussionDotColor}
						teamDotColor={teamDotColor}
						borderRadius={isBots ? 4 : null}
						keyExtractor={keyExtractor}
						height={height}
						searchText={searchText}
					/>
				) : (
					<FlatList
						ref={this.getScrollRef}
						data={searching ? search : chats}
						extraData={searching ? search : chats}
						keyExtractor={keyExtractor}
						style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
						renderItem={this.renderItem}
						ListHeaderComponent={this.renderListHeader}
						getItemLayout={(data, index) => getItemLayout(data, index, height)}
						removeClippedSubviews={isIOS}
						keyboardShouldPersistTaps='always'
						initialNumToRender={INITIAL_NUM_TO_RENDER}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} tintColor={themes[theme].auxiliaryText} />
						}
						windowSize={9}
						onEndReached={this.onEndReached}
						onEndReachedThreshold={0.5}
					/>
				)}
			</>
		);
	};

	renderBadNetwork = () => (
		<View style={styles.connectedWrapper}>
			<Image source={require('../../static/images/error-circle-filled.png')} style={styles.errorNetworkIcon} />
			<Text style={styles.errorNetworkText}>{I18n.t('Network_Error')}</Text>
		</View>
	);

	showModal = (value: boolean) => {
		this.setState({
			isShow: value
		});
	};

	versionCompare = (oldVerison: string, newVerison: string) => oldVerison.toLowerCase() < newVerison.toLowerCase();

	getLastestVersion = async () => {
		// @ts-ignore
		await RNFetchBlob.fetch(
			'get',
			`https://appia.cn/appia_be/v1/api/appia_latest_version?status=1&platform=${isIOS ? 'ios' : 'android'}&versionName=${
				this.deviceVersion
			}`
		).then(res => {
			const { data } = res.json();
			data &&
				this.setState({
					isShow: this.versionCompare(this.deviceVersion, data[0]?.version),
					versionData: data[0]
				});
			return data[0] as IVersionData;
		});
	};

	renderUpdate = () => (
		<View>
			<VersionModal versionData={this.state.versionData} showModal={this.showModal}></VersionModal>
		</View>
	);

	renderFastModeTip = () => (
		<View style={styles.fasModeTipsContainer}>
			<Text style={styles.fasModeTipsText}>{I18n.t('Create_FastMode_Bots_Tips')}</Text>
		</View>
	);

	renderEmptyBotsView = () => {
		const { isBots } = this.props;
		const { chats, search, loading } = this.state;
		const showEmpty = isBots && !(chats && chats.length > 0) && !(search && search.length > 0) && !loading;

		return showEmpty ? (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>{I18n.t('Empty_Tip')}</Text>
			</View>
		) : null;
	};

	renderGptItem = () => (this.props.isBots ? <GptItemView onPress={this.goGptWebView} name={'ChatGPT Enterprise'} /> : null);

	goGptWebView = () => {
		const { navigation } = this.props;
		// @ts-ignore
		navigation.navigate('WebPageView', {
			url: 'https://gpt.appia.cn/',
			needAuth: true,
			title: 'ChatGPT Enterprise',
			source: 'chat-gpt'
		});
	};

	render = () => {
		console.count(`${this.constructor.name}.render calls`);
		const { showServerDropdown, theme, navigation, isBots, isChannel } = this.props;
		const { isShowPopWindow, isShow, networkIsConnected, searching } = this.state;

		return (
			<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar />
				{this.renderHeader()}
				{isShowPopWindow ? this.renderPopWindow() : null}
				{isShow && !isChannel && !isBots ? this.renderUpdate() : null}
				{networkIsConnected ? null : this.renderBadNetwork()}
				{store.getState().company.companies.length > 1 && !searching ? this.renderTab() : null}
				{this.renderScroll()}
				{/* {this.renderEmptyBotsView()}*/}
				{isBots ? this.renderFastModeTip() : null}
				{/* TODO - this ts-ignore is here because the route props, on IBaseScreen*/}
				{/* @ts-ignore*/}
				{showServerDropdown ? <ServerDropdown navigation={navigation} theme={theme} /> : null}
			</SafeAreaView>
		);
	};
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	toggle: state.company.toggle,
	companies: state.company.companies,
	isMasterDetail: state.app.isMasterDetail,
	notificationPresenceCap: state.app.notificationPresenceCap,
	server: state.server.server,
	changingServer: state.server.changingServer,
	enterpriseName: state.settings.Enterprise_Name,
	enterpriseID: state.settings.Enterprise_ID,
	searchText: state.rooms.searchText,
	loadingServer: state.server.loading,
	showServerDropdown: state.rooms.showServerDropdown,
	refreshing: state.rooms.refreshing,
	sortBy: state.sortPreferences.sortBy,
	groupByType: state.sortPreferences.groupByType,
	showFavorites: state.sortPreferences.showFavorites,
	showUnread: state.sortPreferences.showUnread,
	useRealName: state.settings.UI_Use_Real_Name,
	StoreLastMessage: state.settings.Store_Last_Message,
	subscribedRoom: state.room.subscribedRoom,
	queueSize: getInquiryQueueSelector(state).length,
	inquiryEnabled: state.inquiry.enabled,
	encryptionBanner: state.encryption.banner,
	showAvatar: state.sortPreferences.showAvatar,
	displayMode: state.sortPreferences.displayMode,
	createTeamPermission: state.permissions['create-team'],
	createDirectMessagePermission: state.permissions['create-d'],
	createPublicChannelPermission: state.permissions['create-c'],
	createPrivateChannelPermission: state.permissions['create-p'],
	createDiscussionPermission: state.permissions['start-discussion'],
	isFetching: state.createChannel.isFetching,
	selectedUsers: state.selectedUsers.users,
	getUnreadMsgsInterval: state.settings.Appia_Get_Unread_Msgs_Interval,
	messageUnread: state.rooms.messageUnread,
	channelUnread: state.rooms.channelUnread,
	gptUrl: state.settings.Appia_Fast_Model_ChatGpt_Url,
	showDot: state.settings.Avatar_Dot_Show,
	channelDotColor: state.settings.Avatar_Channel_Dot_Color,
	discussionDotColor: state.settings.Avatar_Discussion_Dot_Color,
	teamDotColor: state.settings.Avatar_Team_Dot_Color
});

export default connect(mapStateToProps)(withDimensions(withTheme(withSafeAreaInsets(RoomsListView))));
