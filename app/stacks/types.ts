import { NavigatorScreenParams } from '@react-navigation/core';
import { TextInputProps } from 'react-native';

import { IItem } from '../views/TeamChannelsView';
import { IOptionsField } from '../views/NotificationPreferencesView/options';
import { IServer } from '../definitions/IServer';
import { IAttachment } from '../definitions/IAttachment';
import { IMessage, TAnyMessageModel, TMessageModel } from '../definitions/IMessage';
import { ISubscription, SubscriptionType, TSubscriptionModel } from '../definitions/ISubscription';
import { ICannedResponse } from '../definitions/ICannedResponse';
import { TDataSelect } from '../definitions/IDataSelect';
import { ModalStackParamList } from './MasterDetailStack/types';
import { IExternalData, IRoomDepartment, TThreadModel, TUserModel } from '../definitions';
import { ILivechatDepartment } from '../definitions/ILivechatDepartment';
import { ILivechatTag } from '../definitions/ILivechatTag';
import { TChangeAvatarViewContext } from '../definitions/TChangeAvatarViewContext';
import { IAreaCode } from '../lib/services/common';
import { ISelectedUser } from '../reducers/selectedUsers';
import { CloudDocFileManager } from '../views/CloudDocUploadView/CloudDocFileManager';
import { IFileInfo } from '../definitions/ICloudDisk';
import { ICloudFile } from '../views/CloudStorageView';

export type ContactsStackParamList = {
	ContactsView: undefined | { departmentId: string };
	MyView: undefined;
};

export type CloudStorageStackParamList = {
	CloudStorageView: undefined;
};

export type BottomTabParamList = {
	RoomsListStackStackNavigator: undefined;
	ContactsStackNavigator: undefined;
	WorkspaceStackNavigator: undefined;
	DynamicBottomTabStackNavigator: undefined;
	MyStackNavigator: undefined;
	ChannelStackNavigator: undefined;
	CloudStorageNavigator: undefined;
	BotsStackNavigator: undefined;
};

export type WorkspaceStackParamList = {
	WorkspaceView: undefined;
	WorkspacePage: undefined;
	WebPageView: undefined;
};

export type WebPageViewStackParamList = {
	WebPageView: undefined;
	CloudDocumentView: undefined;
	CloudDocumentWebView: undefined;
	CloudDocumentPage: undefined;
};

export type ChatsStackParamList = {
	ModalStackNavigator: NavigatorScreenParams<ModalStackParamList>;
	E2ESaveYourPasswordStackNavigator: NavigatorScreenParams<E2ESaveYourPasswordStackParamList>;
	E2EEnterYourPasswordStackNavigator: NavigatorScreenParams<E2EEnterYourPasswordStackParamList>;
	SettingsView: any;
	NewMessageStackNavigator: any;
	NewMessageStack: undefined;
	RoomsListView: undefined;
	ForwardMessageView: undefined;
	RoomView:
		| {
				rid: string;
				t: SubscriptionType;
				tmid?: string;
				message?: TMessageModel;
				name?: string;
				fname?: string;
				prid?: string;
				room?: TSubscriptionModel | { rid: string; t: string; name?: string; fname?: string; prid?: string; bot?: boolean };
				jumpToMessageId?: string;
				jumpToThreadId?: string;
				roomUserId?: string | null;
				usedCannedResponse?: string;
				status?: string;
				replyInDM?: TAnyMessageModel;
				fromSearch?: boolean;
		  }
		| undefined; // Navigates back to RoomView already on stack
	FastModelBotInfoView: {
		botName: string;
		welcomeMsg: string;
		botId: string;
		rid?: string;
	};
	CloudDiskView: {
		title?: string;
		folderId?: string;
		type: string;
		copyIds?: string[];
	};
	DocumentPickerView: {
		callback: Function;
	};
	RoomActionsView: {
		room: TSubscriptionModel;
		member?: any;
		rid: string;
		t: SubscriptionType;
		joined: boolean;
		leaderViewState: any;
		omnichannelPermissions?: {
			canForwardGuest: boolean;
			canReturnQueue: boolean;
			canViewCannedResponse: boolean;
			canPlaceLivechatOnHold: boolean;
		};
		isLocal?: boolean;
		isManager?: boolean;
	};
	RoomChangeFakeNameView: {
		room: TSubscriptionModel;
		fakeName: string;
	};
	RoomGroupManageView: {
		room: TSubscriptionModel;
		rid: string;
		joined: boolean;
	};
	SelectListView: {
		data?: TDataSelect[];
		title: string;
		infoText?: string;
		nextAction: (selected: string[]) => void;
		showAlert?: () => void;
		isSearch?: boolean;
		onSearch?: (text: string) => Promise<TDataSelect[] | any>;
		isRadio?: boolean;
	};
	RoomInfoView: {
		room?: ISubscription;
		member?: any;
		rid: string;
		t: SubscriptionType;
		showCloseModal?: boolean;
		fromRid?: string;
		isOuterUser?: boolean;
		importIds?: string[];
		positions?: {
			[key: string]: string[];
		};
	};
	MyCardView: {
		rid: string;
	};
	ScannerView: {
		rid: string;
	};
	ScannerResultView: {
		data: string;
		type: string;
	};
	FederationChooseOrgView: {
		mri: string;
	};
	FederationCreateOrgView: {};
	GptWebView: {};
	RoomManagersView: {
		managerInfos: { name: string; username: string; roles: string[] }[];
		roomType: string;
	};
	RoomInfoEditView: {
		rid: string;
	};
	RoomMembersView: {
		rid: string;
		room: ISubscription;
		joined?: boolean;
		canAddUser: boolean;
		departments?: IRoomDepartment;
		isLocal?: boolean;
		isManager?: boolean;
	};
	RoomMembersEditView: {
		rid: string;
		room: ISubscription;
		canAddUser: boolean;
		editMode: number;
	};
	DiscussionsView: {
		rid: string;
		t: SubscriptionType;
	};
	AnnouncementView: {
		room: TSubscriptionModel;
	};
	TodoListView: {
		rid?: string;
		onRefreshData?: () => void;
	};
	ChannelTypeView: {
		room: TSubscriptionModel;
	};
	ShareChannelView: {
		room: TSubscriptionModel;
		owner?: string;
		ownerOrg?: string;
	};
	ScheduleView: {
		room: TSubscriptionModel;
		roomValueProposition: string | undefined;
		canEdit?: boolean;
	};
	SearchMessagesView: {
		rid: string;
		t: SubscriptionType;
		encrypted?: boolean;
		showCloseModal?: boolean;
	};
	SelectedUsersView: {
		showSkipText?: boolean;
		maxUsers?: number;
		showButton?: boolean;
		title?: string;
		buttonText?: string;
		hasRooms?: string;
		minUsers?: number;
		includeMe?: boolean;
		fromCreatGroup?: boolean;
		groupUsers?: TUserModel[];
		nextAction?(navigation?: any, users?: any): void;
		isChannel?: boolean;
		addExternal?: boolean;
		externalMembers?: IExternalData;
		lastSelected?: ISelectedUser[];
		chooseOnlyOne?: boolean;
		room?: ISubscription;
		isLocal?: boolean;
		isManager?: boolean;
		fromRoomView?: boolean;
		fromScanQRCode?: boolean;
	};
	SelectedExternalUserView: {
		title: string;
		nextAction?(navigation?: any, users?: any): void;
		addExternal?: boolean;
		buttonText?: string;
		minUsers?: number;
		rid?: string;
	};
	InviteUsersView: {
		rid: string;
	};
	InviteUsersEditView: {
		rid: string;
	};
	MessagesView: {
		rid: string;
		t: SubscriptionType;
		name: string;
		selectIndex?: number;
		encrypted?: boolean;
	};
	AutoTranslateView: {
		rid: string;
		room: TSubscriptionModel;
	};
	DirectoryView: undefined;
	NotificationPrefView: {
		rid: string;
		room: TSubscriptionModel;
	};
	ForwardLivechatView: {
		rid: string;
	};
	CloseLivechatView: {
		rid: string;
		departmentId?: string;
		departmentInfo?: ILivechatDepartment;
		tagsList?: ILivechatTag[];
	};
	LivechatEditView: {
		room: ISubscription;
		roomUser: any; // TODO: Change
	};
	PickerView: {
		title: string;
		data: IOptionsField[];
		value?: string;
		onSearch?: (text?: string) => Promise<any>;
		onEndReached?: (text: string, offset?: number) => Promise<any>;
		total?: number;
		goBack?: boolean;
		onChangeValue: Function;
	};
	ThreadMessagesView: {
		rid: string;
		t: SubscriptionType;
	};
	TeamChannelsView: {
		teamId: string;
		joined: boolean;
	};
	CreateChannelView: {
		isTeam?: boolean; // TODO: To check
		teamId?: string;
		isChooseAllUser?: boolean;
	};
	AddChannelTeamView: {
		teamId?: string;
		teamChannels: IItem[];
	};
	AddExistingChannelView: {
		teamId?: string;
		teamChannels: IItem[];
	};
	MarkdownTableView: {
		renderRows: (drawExtraBorders?: boolean) => JSX.Element;
		tableWidth: number;
	};
	ReadReceiptsView: {
		messageId: string;
		rid: string;
		roomType: string;
		userId: string;
	};
	QueueListView: undefined;
	CannedResponsesListView: {
		rid: string;
	};
	CannedResponseDetail: {
		cannedResponse: ICannedResponse;
		room: ISubscription;
	};
	JitsiMeetView: {
		rid: string;
		url: string;
		onlyAudio?: boolean;
		videoConf?: boolean;
	};
	ChangeAvatarView: {
		context: TChangeAvatarViewContext;
		titleHeader?: string;
		room?: ISubscription;
		t?: SubscriptionType;
	};
	WebPageView: undefined;
	CloudDocumentWebView: undefined;
	CloudDocumentView: undefined;
	CloudDocSettingView: {};
	CloudDocActionsView: {
		cloudFile: IFileInfo;
	};
	CloudDocTaskListView:
		| {
				fileManager: CloudDocFileManager;
		  }
		| undefined;
	CloudDocumentPage: undefined;
	CloudDocRecycleView:
		| {
				callBack?: () => void;
		  }
		| undefined;
	CloudDocFileDetailView:
		| {
				fileId?: string;
				folderId?: string;
				fileData?: ICloudFile;
				isFromReycleView?: boolean;
				callBack?: () => void;
		  }
		| undefined;
	CloudPermissionManageView:
		| {
				fileId: string;
		  }
		| undefined;
	CloudUsersSelectedView: {
		showSkipText?: boolean;
		maxUsers?: number;
		showButton?: boolean;
		title?: string;
		buttonText?: string;
		hasRooms?: string;
		minUsers?: number;
		includeMe?: boolean;
		fromCreatGroup?: boolean;
		groupUsers?: TUserModel[];
		// @ts-ignore
		nextAction?(navigation?: any, userIds?: string[], permissionType: number): void;
		isChannel?: boolean;
		addExternal?: boolean;
		externalMembers?: IExternalData;
	};
	VoiceChatUsersSelectView: {
		rid: string;
		roomType: SubscriptionType;
		nextAction?(navigation?: any, users?: any): void;
	};
	CloudStorageView: {};
};

export type ProfileStackParamList = {
	ProfileView: undefined;
	UserPreferencesView: undefined;
	UserNotificationPrefView: undefined;
	PickerView: {
		title: string;
		data: IOptionsField[];
		value: any; // TODO: Change
		onChangeText?: TextInputProps['onChangeText'];
		goBack?: Function;
		onChangeValue: Function;
	};
	ChangeAvatarView: {
		context: TChangeAvatarViewContext;
		titleHeader?: string;
		room?: ISubscription;
		t?: SubscriptionType;
	};
};

export type SettingsStackParamList = {
	SettingsView: undefined;
	SecurityPrivacyView: undefined;
	E2EEncryptionSecurityView: undefined;
	LanguageView: undefined;
	ThemeView: undefined;
	DefaultBrowserView: undefined;
	ScreenLockConfigView: undefined;
	ProfileView: undefined;
	DisplayPrefsView: undefined;
	DefaultHomepageView: undefined;
	DefaultFontSettingView: undefined;
	SimpleWebView: {
		title?: string;
		url?: string;
	};
};

export type AdminPanelStackParamList = {
	AdminPanelView: undefined;
};

export type DisplayPrefStackParamList = {
	DisplayPrefsView: undefined;
};

export type DrawerParamList = {
	ChatsStackNavigator: NavigatorScreenParams<ChatsStackParamList>;
	ProfileStackNavigator: NavigatorScreenParams<ProfileStackParamList>;
	SettingsStackNavigator: NavigatorScreenParams<SettingsStackParamList>;
	AdminPanelStackNavigator: NavigatorScreenParams<AdminPanelStackParamList>;
	DisplayPrefStackNavigator: NavigatorScreenParams<DisplayPrefStackParamList>;
	WebPageViewStackNavigator: NavigatorScreenParams<WebPageViewStackParamList>;
};

export type NewMessageStackParamList = {
	NewMessageView: undefined;
	SelectedUsersViewCreateChannel: {
		maxUsers?: number;
		showButton?: boolean;
		title?: string;
		buttonText?: string;
		includeMe?: boolean;
		fromCreatGroup?: boolean;
		nextAction?(navigation?: any, isTeam?: boolean): void;
	}; // TODO: Change
	CreateChannelView?: {
		isTeam?: boolean; // TODO: To check
		teamId?: string;
		isChooseAllUser?: boolean;
	};
	CreateDiscussionView: {
		channel: ISubscription;
		message: IMessage;
		showCloseModal: boolean;
	};
	SelectGroupTypeView: {
		selectedType?: number;
		nextAction?(type?: number): void;
	};
};

export type E2ESaveYourPasswordStackParamList = {
	E2ESaveYourPasswordView: undefined;
	E2EHowItWorksView?: {
		showCloseModal?: boolean;
	};
};

export type E2EEnterYourPasswordStackParamList = {
	E2EEnterYourPasswordView: undefined;
};

export type InsideStackParamList = {
	DrawerNavigator: NavigatorScreenParams<DrawerParamList>;
	NewMessageStackNavigator: NavigatorScreenParams<NewMessageStackParamList>;
	E2ESaveYourPasswordStackNavigator: NavigatorScreenParams<E2ESaveYourPasswordStackParamList>;
	E2EEnterYourPasswordStackNavigator: NavigatorScreenParams<E2EEnterYourPasswordStackParamList>;
	AttachmentView: {
		attachment: IAttachment;
	};
	StatusView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		isShareExtension: boolean;
		serverInfo: IServer;
		text: string;
		room: TSubscriptionModel;
		thread: TThreadModel;
		replying?: boolean;
		replyingMessage?: IMessage;
		closeReply?: Function;
	};
	ModalBlockView: {
		data: any; // TODO: Change;
	};
};

export type OutsideParamList = {
	NewServerView: undefined;
	WorkspaceView: undefined;
	LoginView: {
		title: string;
		username?: string;
	};
	SimpleWebView: {
		title?: string;
		url?: string;
	};
	ForgotPasswordView: {
		title: string;
	};
	SendEmailConfirmationView: {
		user?: string;
	};
	RegisterView: {
		title: string;
		username?: string;
	};
	LegalView: undefined;
	AuthenticationWebView: {
		authType: string;
		url: string;
		ssoToken?: string;
	};
};

export type OutsideModalParamList = {
	OutsideStack: NavigatorScreenParams<OutsideParamList>;
	AreaCodeView: {
		server: string;
		onChange: (areaCode: IAreaCode) => void;
	};
	VerificationCodeView: {
		uri: string;
		onChange: (code: unknown) => void;
	};
	AuthenticationWebView: {
		authType: string;
		url: string;
		ssoToken?: string;
	};
	WebPageView: undefined;
};
