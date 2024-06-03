import EJSON from 'ejson';
import { MarkdownAST } from '@rocket.chat/message-parser';

import {
	IMessage,
	INotificationPreferences,
	IPreviewItem,
	IRoom,
	IRoomNotifications,
	SubscriptionType,
	IUser,
	IAvatarSuggestion,
	IProfileParams,
	IForwardMessageParams,
	IRoomAnnouncement
} from '../../definitions';
import { ISpotlight } from '../../definitions/ISpotlight';
import { TEAM_TYPE } from '../../definitions/ITeam';
import { Encryption } from '../encryption';
import { TParams } from '../../definitions/ILivechatEditView';
import { store as reduxStore } from '../store/auxStore';
import { getDeviceToken } from '../notifications';
import { random, RoomTypes, roomTypeToApiType, unsubscribeRooms, findNameData } from '../methods';
import sdk from './sdk';
import { compareServerVersion, getBundleId, isIOS } from '../methods/helpers';
import { ILivechatTag } from '../../definitions/ILivechatTag';
import { IPostStaffServiceSurvey } from '../../definitions/rest/v1/udesk';
import { IPostApproval } from '../../definitions/rest/v1/approval';
import { IFeedbackSaveParams, IUnreadMsgs } from '../../definitions/rest/v1/common';

export const createChannel = ({
	name,
	users,
	type,
	readOnly,
	broadcast,
	encrypted,
	teamId,
	federated,
	all,
	rt
}: {
	name: string;
	users: string[];
	type: boolean;
	readOnly: boolean;
	broadcast: boolean;
	encrypted: boolean;
	teamId: string;
	federated: boolean;
	all: boolean;
	rt: string;
}) => {
	const params = {
		name,
		members: users,
		readOnly,
		extraData: {
			broadcast,
			encrypted,
			federated,
			...(teamId && { teamId }),
			all,
			rt
		}
	};
	return sdk.post(type ? 'groups.create' : 'channels.create', params);
};

export const e2eSetUserPublicAndPrivateKeys = (public_key: string, private_key: string) =>
	// RC 2.2.0
	sdk.post('e2e.setUserPublicAndPrivateKeys', { public_key, private_key });

export const e2eRequestSubscriptionKeys = (): Promise<boolean> =>
	// RC 0.72.0
	sdk.methodCallWrapper('e2e.requestSubscriptionKeys');

export const e2eGetUsersOfRoomWithoutKey = (rid: string) =>
	// RC 0.70.0
	sdk.get('e2e.getUsersOfRoomWithoutKey', { rid });

export const e2eSetRoomKeyID = (rid: string, keyID: string) =>
	// RC 0.70.0
	sdk.post('e2e.setRoomKeyID', { rid, keyID });

export const e2eUpdateGroupKey = (uid: string, rid: string, key: string): any =>
	// RC 0.70.0
	sdk.post('e2e.updateGroupKey', { uid, rid, key });

export const e2eRequestRoomKey = (rid: string, e2eKeyId: string): Promise<{ message: { msg?: string }; success: boolean }> =>
	// RC 0.70.0
	sdk.methodCallWrapper('stream-notify-room-users', `${rid}/e2ekeyRequest`, rid, e2eKeyId);

export const e2eAcceptSuggestedGroupKey = (rid: string): Promise<{ success: boolean }> =>
	// RC 5.5
	sdk.post('e2e.acceptSuggestedGroupKey', { rid });

export const e2eRejectSuggestedGroupKey = (rid: string): Promise<{ success: boolean }> =>
	// RC 5.5
	sdk.post('e2e.rejectSuggestedGroupKey', { rid });

export const updateJitsiTimeout = (roomId: string) =>
	// RC 0.74.0
	sdk.post('video-conference/jitsi.update-timeout', { roomId });

export const register = (credentials: { name: string; email: string; pass: string; username: string }) =>
	// RC 0.50.0
	sdk.post('users.register', credentials);

export const forgotPassword = (email: string) =>
	// RC 0.64.0
	sdk.post('users.forgotPassword', { email });

export const sendConfirmationEmail = (email: string): Promise<{ message: string; success: boolean }> =>
	sdk.methodCallWrapper('sendConfirmationEmail', email);

export const spotlight = (
	search: string,
	usernames: string[],
	type: { users: boolean; rooms: boolean; includeFederatedRooms: boolean; orgType?: 0 | 1 | 2 },
	rid?: string
): Promise<ISpotlight> =>
	// RC 0.51.0
	rid
		? sdk.methodCallWrapper('spotlight', search, usernames, type, rid)
		: sdk.methodCallWrapper('spotlight', search, usernames, type);

export const spotlightV2 = (
	search: string,
	usernames: string[],
	type: { users: boolean; rooms: boolean; includeFederatedRooms: boolean },
	rid?: string,
	usersLimit?: number,
	roomsLimit?: number,
	usersInRoomLimit?: number
): Promise<ISpotlight> =>
	// RC 0.51.0
	rid
		? sdk.methodCallWrapper('spotlightv2', search, usernames, type, rid, usersLimit, roomsLimit, usersInRoomLimit)
		: sdk.methodCallWrapper('spotlightv2', search, usernames, type, null, usersLimit, roomsLimit, usersInRoomLimit);

export const spotlightUsers = (
	search: string,
	usernames: string[],
	type: { users: boolean; rooms: boolean; includeFederatedRooms: boolean },
	rid?: string
): Promise<ISpotlight> =>
	// RC 0.51.0
	rid
		? sdk.methodCallWrapper('spotlightUsers', search, usernames, type, rid)
		: sdk.methodCallWrapper('spotlightUsers', search, usernames, type);

export const spotlightRooms = (
	search: string,
	usernames: string[],
	type: { users: boolean; rooms: boolean; includeFederatedRooms: boolean },
	rid?: string
): Promise<ISpotlight> =>
	// RC 0.51.0
	rid
		? sdk.methodCallWrapper('spotlightRooms', search, usernames, type, rid)
		: sdk.methodCallWrapper('spotlightRooms', search, usernames, type);

export const createDirectMessage = (username: string) =>
	// RC 0.59.0
	sdk.post('im.create', { username });

export const createDiscussion = ({
	prid,
	pmid,
	t_name,
	reply,
	users,
	encrypted,
	md
}: {
	prid: string;
	pmid?: string;
	t_name: string;
	reply?: string;
	users?: string[];
	encrypted?: boolean;
	md: MarkdownAST;
}) => {
	// RC 1.0.0
	// 处理消息嵌套创建分组的标题 拿到正确的 t_name
	t_name = findNameData(md, t_name);
	return sdk.post('rooms.createDiscussion', {
		all: true,
		prid,
		pmid,
		t_name,
		reply,
		users,
		encrypted
	});
};

export const getDiscussions = ({
	roomId,
	offset,
	count,
	text
}: {
	roomId: string;
	text?: string | undefined;
	offset: number;
	count: number;
}) => {
	const params = {
		roomId,
		offset,
		count,
		...(text && { text })
	};
	// RC 2.4.0
	return sdk.get('chat.getDiscussions', params);
};

export const createTeam = ({
	name,
	users,
	type,
	readOnly,
	broadcast,
	encrypted,
	federated
}: {
	name: string;
	users: string[];
	type: boolean;
	readOnly: boolean;
	broadcast: boolean;
	encrypted: boolean;
	federated: boolean;
}) => {
	const params = {
		name,
		members: users,
		type: type ? TEAM_TYPE.PRIVATE : TEAM_TYPE.PUBLIC,
		room: {
			readOnly,
			extraData: {
				broadcast,
				encrypted,
				federated
			}
		}
	};
	// RC 3.13.0
	return sdk.post('teams.create', params);
};
export const addRoomsToTeam = ({ teamId, rooms }: { teamId: string; rooms: string[] }) =>
	// RC 3.13.0
	sdk.post('teams.addRooms', { teamId, rooms });

export const removeTeamRoom = ({ roomId, teamId }: { roomId: string; teamId: string }) =>
	// RC 3.13.0
	sdk.post('teams.removeRoom', { roomId, teamId });

export const leaveTeam = ({ teamId, rooms }: { teamId: string; rooms: string[] }): any =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('teams.leave', {
		teamId,
		// RC 4.2.0
		...(rooms?.length && { rooms })
	});

export const removeTeamMember = ({ teamId, userId, rooms }: { teamId: string; userId: string; rooms: string[] }) =>
	// RC 3.13.0
	sdk.post('teams.removeMember', {
		teamId,
		userId,
		// RC 4.2.0
		...(rooms?.length && { rooms })
	});

export const updateTeamRoom = ({ roomId, isDefault }: { roomId: string; isDefault: boolean }) =>
	// RC 3.13.0
	sdk.post('teams.updateRoom', { roomId, isDefault });

export const deleteTeam = ({ teamId, roomsToRemove }: { teamId: string; roomsToRemove: string[] }): any =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('teams.delete', { teamId, roomsToRemove });

export const teamListRoomsOfUser = ({ teamId, userId }: { teamId: string; userId: string }) =>
	// RC 3.13.0
	sdk.get('teams.listRoomsOfUser', { teamId, userId });

export const convertChannelToTeam = ({ rid, name, type }: { rid: string; name: string; type: 'c' | 'p' }) => {
	const params = {
		...(type === 'c'
			? {
					channelId: rid,
					channelName: name
			  }
			: {
					roomId: rid,
					roomName: name
			  })
	};
	return sdk.post(type === 'c' ? 'channels.convertToTeam' : 'groups.convertToTeam', params);
};

export const convertTeamToChannel = ({ teamId, selected }: { teamId: string; selected: string[] }) => {
	const params = {
		teamId,
		...(selected.length && { roomsToRemove: selected })
	};
	return sdk.post('teams.convertToChannel', params);
};

// fixme 这个接口和web不一致
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const joinRoom = (roomId: string, joinCode: string | null, type: 'c' | 'p') =>
	// RC 0.48.0
	// if (type === 'p') {
	// 	return sdk.methodCallWrapper('joinRoom', roomId) as Promise<boolean>;
	// }
	// return sdk.methodCallWrapper('channels.join', { roomId, joinCode });
	sdk.methodCallWrapper('joinRoom', roomId) as Promise<boolean>;

export const getFederationInfo = (rid: string) => sdk.get('external/bridged.room', { rid });

export const deleteMessage = (messageId: string, rid: string) =>
	// RC 0.48.0
	sdk.post('chat.delete', { msgId: messageId, roomId: rid });

export const forwardMessage = (params: IForwardMessageParams) =>
	// RC 0.48.0
	sdk.post('chat.sendMessage', { message: params });

export const markAsUnread = ({ messageId }: { messageId: string }) =>
	// RC 0.65.0
	sdk.post('subscriptions.unread', { firstUnreadMessage: { _id: messageId } });

export const toggleStarMessage = (messageId: string, starred?: boolean) => {
	if (starred) {
		// RC 0.59.0
		return sdk.post('chat.unStarMessage', { messageId });
	}
	// RC 0.59.0
	return sdk.post('chat.starMessage', { messageId });
};

export const togglePinMessage = (messageId: string, pinned?: boolean) => {
	if (pinned) {
		// RC 0.59.0
		return sdk.post('chat.unPinMessage', { messageId });
	}
	// RC 0.59.0
	return sdk.post('chat.pinMessage', { messageId });
};

export const reportMessage = (messageId: string) =>
	// RC 0.64.0
	sdk.post('chat.reportMessage', { messageId, description: 'Message reported by user' });

export const setUserPreferences = (userId: string, data: Partial<INotificationPreferences>) =>
	// RC 0.62.0
	sdk.post('users.setPreferences', { userId, data });

export const setUserStatus = (status: string, message: string) =>
	// RC 1.2.0
	sdk.methodCall('setUserStatus', status, message);

export const setReaction = (emoji: string, messageId: string) =>
	// RC 0.62.2
	sdk.post('chat.react', { emoji, messageId });

export const toggleRead = (read: boolean, roomId: string) => {
	if (read) {
		return sdk.post('subscriptions.unread', { roomId });
	}
	return sdk.post('subscriptions.read', { rid: roomId });
};

export const getRoomCounters = (
	roomId: string,
	t: SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL
) =>
	// RC 0.65.0
	sdk.get(`${roomTypeToApiType(t)}.counters`, { roomId });

export const getChannelInfo = (roomId: string) =>
	// RC 0.48.0
	sdk.get('channels.info', { roomId });

export const getUserPreferences = (userId: string) =>
	// RC 0.62.0
	sdk.get('users.getPreferences', { userId });

export const getRoomInfo = (roomId: string) =>
	// RC 0.72.0
	sdk.get('rooms.info', { roomId });

// @ts-ignore
export const getAppiaRoomInfo = (rid: string) => sdk.get('appia/getRoomInfo', { rid });

export const getVisitorInfo = (visitorId: string) =>
	// RC 2.3.0
	sdk.get('livechat/visitors.info', { visitorId });

export const setUserPresenceAway = () => sdk.methodCall('UserPresence:away');

export const setUserPresenceOnline = () => sdk.methodCall('UserPresence:online');

export const getTeamListRoom = ({
	teamId,
	count,
	offset,
	type,
	filter
}: {
	teamId: string;
	count: number;
	offset: number;
	type: string;
	filter: any;
}) => {
	const params: any = {
		teamId,
		count,
		offset,
		type
	};

	if (filter) {
		params.filter = filter;
	}
	// RC 3.13.0
	return sdk.get('teams.listRooms', params);
};

export const closeLivechat = (rid: string, comment?: string, tags?: string[]) => {
	// RC 3.2.0
	let params;
	if (tags && tags?.length) {
		params = { tags };
	}
	// RC 0.29.0
	return sdk.methodCallWrapper('livechat:closeRoom', rid, comment, { clientAction: true, ...params });
};

export const editLivechat = (userData: TParams, roomData: TParams): Promise<{ error?: string }> =>
	// RC 0.55.0
	sdk.methodCallWrapper('livechat:saveInfo', userData, roomData);

export const returnLivechat = (rid: string): Promise<boolean> =>
	// RC 0.72.0
	sdk.methodCallWrapper('livechat:returnAsInquiry', rid);

export const onHoldLivechat = (roomId: string) => sdk.post('livechat/room.onHold', { roomId });

export const forwardLivechat = (transferData: any) =>
	// RC 0.36.0
	sdk.methodCallWrapper('livechat:transfer', transferData);

export const getDepartmentInfo = (departmentId: string) =>
	// RC 2.2.0
	sdk.get(`livechat/department/${departmentId}?includeAgents=false`);

export const getDepartments = (args?: { count: number; offset: number; text: string }) => {
	let params;
	if (args) {
		params = {
			text: args.text,
			count: args.count,
			offset: args.offset
		};
	}
	// RC 2.2.0
	return sdk.get('livechat/department', params);
};

export const usersAutoComplete = (selector: any) =>
	// RC 2.4.0
	sdk.get('users.autocomplete', { selector });

export const getRoutingConfig = (): Promise<{
	previewRoom: boolean;
	showConnecting: boolean;
	showQueue: boolean;
	showQueueLink: boolean;
	returnQueue: boolean;
	enableTriggerAction: boolean;
	autoAssignAgent: boolean;
}> =>
	// RC 2.0.0
	sdk.methodCallWrapper('livechat:getRoutingConfig');

export const getTagsList = (): Promise<ILivechatTag[]> =>
	// RC 2.0.0
	sdk.methodCallWrapper('livechat:getTagsList');

export const getAgentDepartments = (uid: string) =>
	// RC 2.4.0
	sdk.get(`livechat/agents/${uid}/departments?enabledDepartmentsOnly=true`);

export const getCustomFields = () =>
	// RC 2.2.0
	sdk.get('livechat/custom-fields');

export const getListCannedResponse = ({ scope = '', departmentId = '', offset = 0, count = 25, text = '' }) => {
	const params = {
		offset,
		count,
		...(departmentId && { departmentId }),
		...(text && { text }),
		...(scope && { scope })
	};

	// RC 3.17.0
	return sdk.get('canned-responses', params);
};

export const toggleBlockUser = (rid: string, blocked: string, block: boolean): Promise<boolean> => {
	if (block) {
		// RC 0.49.0
		return sdk.methodCallWrapper('blockUser', { rid, blocked });
	}
	// RC 0.49.0
	return sdk.methodCallWrapper('unblockUser', { rid, blocked });
};

// fixme 这个接口和web端不一致
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const leaveRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.48.0
	// sdk.methodCallWrapper('leaveRoom', roomId);
	sdk.post(`${roomTypeToApiType(t)}.leave`, { roomId });

export const deleteRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.49.0
	sdk.post(`${roomTypeToApiType(t)}.delete`, { roomId });

export const toggleMuteUserInRoom = (
	rid: string,
	username: string,
	mute: boolean
): Promise<{ message: { msg: string; result: boolean }; success: boolean }> => {
	if (mute) {
		// RC 0.51.0
		return sdk.methodCallWrapper('muteUserInRoom', { rid, username });
	}
	// RC 0.51.0
	return sdk.methodCallWrapper('unmuteUserInRoom', { rid, username });
};

export const toggleRoomOwner = ({
	roomId,
	t,
	userId,
	isOwner
}: {
	roomId: string;
	t: SubscriptionType;
	userId: string;
	isOwner: boolean;
}) => {
	const type = t as SubscriptionType.CHANNEL;
	if (isOwner) {
		// RC 0.49.4
		return sdk.post(`${roomTypeToApiType(type)}.addOwner`, { roomId, userId });
	}
	// RC 0.49.4
	return sdk.post(`${roomTypeToApiType(type)}.removeOwner`, { roomId, userId });
};

export const toggleRoomLeader = ({
	roomId,
	t,
	userId,
	isLeader
}: {
	roomId: string;
	t: SubscriptionType;
	userId: string;
	isLeader: boolean;
}) => {
	const type = t as SubscriptionType.CHANNEL;
	if (isLeader) {
		// RC 0.58.0
		return sdk.post(`${roomTypeToApiType(type)}.addLeader`, { roomId, userId });
	}
	// RC 0.58.0
	return sdk.post(`${roomTypeToApiType(type)}.removeLeader`, { roomId, userId });
};

export const toggleRoomModerator = ({
	roomId,
	t,
	userId,
	isModerator
}: {
	roomId: string;
	t: SubscriptionType;
	userId: string;
	isModerator: boolean;
}) => {
	const type = t as SubscriptionType.CHANNEL;
	if (isModerator) {
		// RC 0.49.4
		return sdk.post(`${roomTypeToApiType(type)}.addModerator`, { roomId, userId });
	}
	// RC 0.49.4
	return sdk.post(`${roomTypeToApiType(type)}.removeModerator`, { roomId, userId });
};

export const removeUserFromRoom = ({ roomId, t, userId }: { roomId: string; t: RoomTypes; userId: string }) =>
	// RC 0.48.0
	sdk.post(`${roomTypeToApiType(t)}.kick`, { roomId, userId });

export const removeDepartmentFromRoom = ({ rid, org, departmentId }: { rid: string; org: string; departmentId: string }) =>
	sdk.post('federation/room/removeDepartments', { rid, org, departmentId });

export const ignoreUser = ({ rid, userId, ignore }: { rid: string; userId: string; ignore: boolean }) =>
	// RC 0.64.0
	sdk.get('chat.ignoreUser', { rid, userId, ignore });

export const toggleArchiveRoom = (roomId: string, t: SubscriptionType, archive: boolean) => {
	const type = t as SubscriptionType.CHANNEL | SubscriptionType.GROUP;
	if (archive) {
		// RC 0.48.0
		return sdk.post(`${roomTypeToApiType(type)}.archive`, { roomId });
	}
	// RC 0.48.0
	return sdk.post(`${roomTypeToApiType(type)}.unarchive`, { roomId });
};

export const hideRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.48.0
	sdk.post(`${roomTypeToApiType(t)}.close`, { roomId });

export const isContainExternalMember = (rid: string) => sdk.get('exist/external.member', { rid });

export const saveRoomSettings = (
	rid: string,
	params: {
		roomName?: string;
		roomAvatar?: string | null;
		roomDescription?: string;
		roomTopic?: string;
		roomAnnouncement?: IRoomAnnouncement;
		roomType?: SubscriptionType;
		readOnly?: boolean;
		reactWhenReadOnly?: boolean;
		systemMessages?: string[];
		joinCode?: string;
		encrypted?: boolean;
		roomValueProposition?: string | undefined;
		appiaRoomType?: string;
		federated?: boolean;
	}
): Promise<{ result: boolean; rid: string }> =>
	// RC 0.55.0
	sdk.methodCallWrapper('saveRoomSettings', rid, params);

export const saveUserProfile = (
	data: IProfileParams | Pick<IProfileParams, 'username'>,
	customFields?: { [key: string | number]: string }
) =>
	// RC 0.62.2
	sdk.post('users.updateOwnBasicInfo', { data, customFields });

export const saveUserPreferences = (data: Partial<INotificationPreferences>) =>
	// RC 0.62.0
	sdk.post('users.setPreferences', { data });

export const saveNotificationSettings = (roomId: string, notifications: IRoomNotifications) =>
	// RC 0.63.0
	sdk.post('rooms.saveNotification', { roomId, notifications });

export const roomAnnouncementRead = (roomId: string, announcementId: string) =>
	sdk.post('rooms.roomAnnouncementRead', { rid: roomId, announcementId });

export const getSingleMessage = (msgId: string) =>
	// RC 0.47.0
	sdk.get('chat.getMessage', { msgId });

export const getRoomRoles = (
	roomId: string,
	type: SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL
) =>
	// RC 0.65.0
	sdk.get(`${roomTypeToApiType(type)}.roles`, { roomId });

export const getAvatarSuggestion = (): Promise<{ [service: string]: IAvatarSuggestion }> =>
	// RC 0.51.0
	sdk.methodCallWrapper('getAvatarSuggestion');

export const resetAvatar = (userId: string) =>
	// RC 0.55.0
	sdk.post('users.resetAvatar', { userId });

export const setAvatarFromService = ({
	data,
	contentType = '',
	service = null
}: {
	data: any;
	contentType?: string;
	service?: string | null;
}): Promise<void> =>
	// RC 0.51.0
	sdk.methodCallWrapper('setAvatarFromService', data, contentType, service);

export const getUsernameSuggestion = () =>
	// RC 0.65.0
	sdk.get('users.getUsernameSuggestion');

export const getFiles = (roomId: string, type: SubscriptionType, offset: number) => {
	const t = type as SubscriptionType.DIRECT | SubscriptionType.CHANNEL | SubscriptionType.GROUP;
	// RC 0.59.0
	return sdk.get(`${roomTypeToApiType(t)}.files`, {
		roomId,
		offset,
		sort: { uploadedAt: -1 }
	});
};

export const searchFiles = (roomId: string, type: SubscriptionType, offset: number, name?: string, fileType?: string) => {
	const t = type as SubscriptionType.DIRECT | SubscriptionType.CHANNEL | SubscriptionType.GROUP;

	return sdk.get(`${roomTypeToApiType(t)}.files`, {
		roomId,
		offset,
		query: { name: { $regex: name ?? '', $options: 'i' }, typeGroup: fileType ?? '' },
		sort: { uploadedAt: -1 }
	});
};

export const getMessages = (
	roomId: string,
	type: SubscriptionType,
	query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean },
	offset: number
) => {
	const t = type as SubscriptionType.DIRECT | SubscriptionType.CHANNEL | SubscriptionType.GROUP;
	// RC 0.59.0
	return sdk.get(`${roomTypeToApiType(t)}.messages`, {
		roomId,
		query,
		offset,
		sort: { ts: -1 }
	});
};

export const getReadReceipts = (messageId: string) =>
	// RC 0.63.0
	sdk.get('chat.getMessageReadReceipts', {
		messageId
	});

export const searchMessages = (roomId: string, searchText: string, count: number, offset: number) =>
	// RC 0.60.0
	sdk.get('chat.search', {
		roomId,
		searchText,
		count,
		offset
	});

export const toggleFollowMessage = (mid: string, follow: boolean) => {
	// RC 1.0
	if (follow) {
		return sdk.post('chat.followMessage', { mid });
	}
	return sdk.post('chat.unfollowMessage', { mid });
};

export const getThreadsList = ({ rid, count, offset, text }: { rid: string; count: number; offset: number; text?: string }) => {
	const params = {
		rid,
		count,
		offset
	} as { rid: string; count: number; offset: number; text?: string };
	if (text) {
		params.text = text;
	}

	// RC 1.0
	return sdk.get('chat.getThreadsList', params);
};

export const getSyncThreadsList = ({ rid, updatedSince }: { rid: string; updatedSince: string }) =>
	// RC 1.0
	sdk.get('chat.syncThreadsList', {
		rid,
		updatedSince
	});

export const runSlashCommand = (command: string, roomId: string, params: string, triggerId?: string, tmid?: string) =>
	// RC 0.60.2
	sdk.post('commands.run', {
		command,
		roomId,
		params,
		triggerId,
		...(tmid && { tmid })
	});

export const getCommandPreview = (command: string, roomId: string, params: string) =>
	// RC 0.65.0
	sdk.get('commands.preview', {
		command,
		roomId,
		params
	});

export const executeCommandPreview = (
	command: string,
	params: string,
	roomId: string,
	previewItem: IPreviewItem,
	triggerId: string,
	tmid?: string
) =>
	// RC 0.65.0
	sdk.post('commands.preview', {
		command,
		params,
		roomId,
		previewItem,
		triggerId,
		tmid
	});

export const getDirectory = ({
	query,
	count,
	offset,
	sort
}: {
	query: { [key: string]: string };
	count: number;
	offset: number;
	sort: { [key: string]: number };
}) =>
	// RC 1.0
	sdk.get('directory', {
		query,
		count,
		offset,
		sort
	});

export const saveAutoTranslate = ({
	rid,
	field,
	value,
	options
}: {
	rid: string;
	field: string;
	value: string;
	options?: { defaultLanguage: string };
}) => sdk.methodCallWrapper('autoTranslate.saveSettings', rid, field, value, options ?? null);

export const getSupportedLanguagesAutoTranslate = (): Promise<{ language: string; name: string }[]> =>
	sdk.methodCallWrapper('autoTranslate.getSupportedLanguages', 'en');

export const translateMessage = (messageId: string, targetLanguage: string) =>
	sdk.post('autotranslate.translateMessage', { messageId, targetLanguage });

export const toggleTodoMessage = (messageId: string, status: number, tips: string, type: string) =>
	sdk.post('appia/set-message-todo', { messageId, status, tips, type });

export const updateTodoMessage = (id: string, title: string, tips: string, type: string) =>
	sdk.post('appia/update-message-todo', { id, title, tips, type });

export const toggleTodoRoom = (rid: string, status: number) => sdk.post('appia/set-room-todo', { rid, status });

export const getTodoList = (offset: number, count: number, rid?: string) =>
	rid ? sdk.get('appia/todos', { rid, offset, count }) : sdk.get('appia/todos', { offset, count });

export const ToggleTodoStatus = (id: string, status: number) => sdk.post('appia/update-message-todo-status', { id, status });

export const findOrCreateInvite = ({ rid, days, maxUses }: { rid: string; days: number; maxUses: number }): any =>
	// RC 2.4.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('findOrCreateInvite', { rid, days, maxUses });

export const validateInviteToken = (token: string): any =>
	// RC 2.4.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('validateInviteToken', { token });

export const inviteToken = (token: string): any =>
	// RC 2.4.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('useInviteToken', { token });

export const readThreads = (tmid: string): Promise<void> => {
	const serverVersion = reduxStore.getState().server.version;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.4.0')) {
		// RC 3.4.0
		return sdk.methodCallWrapper('readThreads', tmid);
	}
	return Promise.resolve();
};

export const createGroupChat = () => {
	const { users } = reduxStore.getState().selectedUsers;
	const usernames = users.map(u => u.name).join(',');

	// RC 3.1.0
	return sdk.post('im.create', { usernames });
};

export const addUsersToRoom = (rid: string, federated?: boolean): Promise<boolean> => {
	const { users: selectedUsers } = reduxStore.getState().selectedUsers;
	const users = selectedUsers.map(u => u.name);
	// RC 0.51.0 外部频道添加内部成员的接口与内部频道添加人员的接口不同 （主要是为了解决）
	// @ts-ignore
	return federated
		? sdk.post('local.addUsersToRoom', {
				message: EJSON.stringify({ msg: 'method', id: random(10), method: 'addUsersToRoom', params: [{ rid, users }] })
		  })
		: sdk.methodCallWrapper('addUsersToRoom', { rid, users });
};

// @ts-ignore
export const getFederatedDepartments = (mri: string) => sdk.get('hrm/room/get-my-organize', { mri });

export const getRoomQRcode = (
	rid: string,
	{
		inviteUsername,
		expire,
		attribution,
		owner,
		ownerOrg,
		t,
		limitNumber
	}: {
		inviteUsername: string;
		expire: number;
		attribution: string;
		owner: string;
		ownerOrg: string;
		t: string;
		limitNumber?: number;
	}
) => {
	const params = { inviteUsername, expire, attribution, owner, ownerOrg, t };

	if (limitNumber) {
		// @ts-ignore
		params.limitNumber = limitNumber;
	}

	// @ts-ignore
	return sdk.get(`room/${rid}/qrcode/content`, params);
};

export const getJoinRoomInfo = (inviteId: string, user: string) => sdk.get('room/join/info', { inviteId, username: user });

export const joinFederationRoom = (rid: string, ownerOrg: string, owner: string, isShare: boolean, shareUsers?: string) => {
	const { users: selectedUsers } = reduxStore.getState().selectedUsers;
	console.info('selectedUsers', selectedUsers);
	let users = [];
	if (isShare) {
		users = [shareUsers];
	} else {
		users = selectedUsers.map(u => `@${u.username}:${u.remote}`);
	}
	// @ts-ignore
	return sdk.post(`room/${rid}/join`, { users, ownerOrg, owner });
};

export const getRoomRid = (mri: string) => sdk.get('federation/web/local/bridged.room', { mri });

export const applyJoinFederation = (
	mri: string,
	managerInfos: { name: string; username: string; roles: string[] }[],
	roomName: string,
	roomType: string,
	inviterUsername: string,
	inviterOrg: string,
	rt: string,
	inviteId: string,
	users: string[]
) => sdk.post('apply/rooms.join', { mri, managerInfos, roomName, roomType, inviterUsername, inviterOrg, rt, inviteId, users });

export const joinFederationSharedRoom = (
	users: string[],
	owner: string,
	ownerOrg: string,
	roomType: string,
	mri: string,
	rt: string
) =>
	// @ts-ignore
	sdk.post(`federation/web/room/${mri}/join`, { users, owner, ownerOrg, roomType, rt });

export const getRoomOwnerInfo = (rid: string) =>
	// @ts-ignore
	sdk.get(`room/${rid}/info`);

export const emitTyping = (room: IRoom, typing = true) => {
	const { login, settings, server } = reduxStore.getState();
	const { UI_Use_Real_Name } = settings;
	const { version: serverVersion } = server;
	const { user } = login;
	const name = UI_Use_Real_Name ? user.name : user.username;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '4.0.0')) {
		return sdk.methodCall('stream-notify-room', `${room}/user-activity`, name, typing ? ['user-typing'] : []);
	}
	return sdk.methodCall('stream-notify-room', `${room}/typing`, name, typing);
};

export function e2eResetOwnKey(): Promise<boolean | {}> {
	// {} when TOTP is enabled
	unsubscribeRooms();

	// RC 0.72.0
	return sdk.methodCallWrapper('e2e.resetOwnE2EKey');
}

export const editMessage = async (message: IMessage) => {
	const { rid, msg } = await Encryption.encryptMessage(message);
	// RC 0.49.0
	return sdk.post('chat.update', { roomId: rid, msgId: message.id, text: msg });
};

export const registerPushToken = () =>
	new Promise<void>(async resolve => {
		const token = getDeviceToken();
		if (token) {
			const type = isIOS ? 'apn' : 'gcm';
			const data = {
				value: token,
				type,
				appName: getBundleId
			};
			try {
				// RC 0.60.0
				await sdk.post('push.token', data);
			} catch (error) {
				console.log(error);
			}
		}
		return resolve();
	});

export const removePushToken = (): Promise<boolean | void> => {
	const token = getDeviceToken();
	if (token) {
		// RC 0.60.0
		return sdk.current.del('push.token', { token });
	}
	return Promise.resolve();
};

export const sendEmailCode = () => {
	const { username } = reduxStore.getState().login.user as IUser;
	// RC 3.1.0
	return sdk.post('users.2fa.sendEmailCode', { emailOrUsername: username });
};

// @ts-ignore
export const getRoomDepartment = (rid: string) => sdk.get('federation/room/departments', { rid });

export const getRoomMembers = async ({
	rid,
	allUsers,
	roomType,
	type,
	filter,
	skip = 0,
	limit = 10
}: {
	rid: string;
	allUsers: boolean;
	type: 'all' | 'online';
	roomType: SubscriptionType;
	filter: string;
	skip: number;
	limit: number;
}) => {
	const t = roomType as SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.DIRECT;
	const serverVersion = reduxStore.getState().server.version;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.16.0')) {
		const params = {
			roomId: rid,
			offset: skip,
			count: limit,
			...(type !== 'all' && { 'status[]': type }),
			...(filter && { filter })
		};
		// RC 3.16.0
		const result = await sdk.get(`${roomTypeToApiType(t)}.members`, params);
		if (result.success) {
			return result?.members;
		}
	}
	// RC 0.42.0
	const result = await sdk.methodCallWrapper('getUsersOfRoom', rid, allUsers, { skip, limit });
	return result?.records;
};

export const getFederatedRoomMembers = (rid: string) => sdk.get('appia/room/members', { rid });

export const getExternalMembers = ({ rid }: { rid?: string }) => sdk.get('org/members', { rid });

export const e2eFetchMyKeys = async () => {
	// RC 0.70.0
	const result = await sdk.get('e2e.fetchMyKeys');
	// snake_case -> camelCase
	if (result.success) {
		return {
			success: result.success,
			publicKey: result.public_key,
			privateKey: result.private_key
		};
	}
	return result;
};

export const logoutOtherLocations = () => {
	const { id } = reduxStore.getState().login.user;
	return sdk.post('users.removeOtherTokens', { userId: id as string });
};

export function getUserInfo(userId: string) {
	// RC 0.48.0
	return sdk.get('users.info', { userId });
}

export const getAuthCode = (url: string, source: string) => sdk.get('users.externalToken', { url, source, platform: 'APP' });

export const toggleFavorite = (roomId: string, favorite: boolean) => sdk.post('rooms.favorite', { roomId, favorite });

export const videoConferenceJoin = (callId: string, cam?: boolean, mic?: boolean) =>
	sdk.post('video-conference.join', { callId, state: { cam: !!cam, mic: mic === undefined ? true : mic } });

export const videoConferenceGetCapabilities = () => sdk.get('video-conference.capabilities');

export const videoConferenceStart = (roomId: string) => sdk.post('video-conference.start', { roomId });

export const saveUserProfileMethod = (
	params: IProfileParams,
	customFields = {},
	twoFactorOptions: {
		twoFactorCode: string;
		twoFactorMethod: string;
	} | null
) => sdk.current.methodCall('saveUserProfile', params, customFields, twoFactorOptions);

export const deleteOwnAccount = (password: string, confirmRelinquish = false): any =>
	// RC 0.67.0
	sdk.post('users.deleteOwnAccount', { password, confirmRelinquish });

export const getContacts = () => sdk.get('hrm/users.list');

export const getPdtUsers = (count = 3000) => sdk.get('users.pdtInfo', { count });

// export const getWorkspace = () => sdk.get('/worktable_config');

export const postStaffServiceSurvey = (params: IPostStaffServiceSurvey): Promise<unknown> =>
	sdk.post('robot/staffService/survey', params);

export const postStaffServiceAgent = (rid: string): Promise<unknown> => sdk.post('robot/staffService/agent', { rid });

export const postStaffServiceAgentClose = (rid: string): Promise<unknown> => sdk.post('robot/staffService/agent_close', { rid });

export const getStaffServiceAssignType = (rid: string): Promise<string> =>
	sdk.get('robot/staffService/assign_type', { rid }).then(res => {
		if (res.success) {
			return res.data?.assign_type;
		}

		return Promise.reject(res);
	});

export const postApproval = (params: IPostApproval): Promise<{ name: string }> => sdk.post('oa.approval', params);

export const saveFeedback = (params: IFeedbackSaveParams) => sdk.post('feedback.save', params);

export const fetchOtkrDate = (params: { username: string }) => sdk.get('otkr.date', params);
export const fetchOtkrQuery = (params: { username: string; time: string }) => sdk.get('otkr.query', params);

export const getFanweiHeaderToken = (): Promise<string> =>
	sdk.get('proxy/hrm/resource/token').then(res => {
		if (res.success) {
			return res.result?.data ?? '';
		}

		return Promise.reject(res);
	});

// 云文档相关
export const fetchFilesRecycleList = (params: { username: string }) => sdk.get('a', params);

export const sendCloudFiles = (fileIds: string[], rid?: string, targetUsername?: string) =>
	sdk.post('doc.sendFileMsg', { fileIds, rid, targetUsername });

export const prefix = 'shimo-proxy/api/v1/rpc';

export const getCloudDisk = (folderId?: string, orgScope?: string) =>
	// @ts-ignore
	sdk.get(`${prefix}/file/cloud/list`, { folderId, orgScope });

export const copyDocToFolder = (fileIds?: string[], folderIds?: string[], org?: string, targetFolderId?: string) =>
	// @ts-ignore
	sdk.post(`${prefix}/drive/file/copyTo`, { fileIds, folderIds, org, targetFolderId });

export const createFolder = (name?: string, folderId?: string, orgScope?: string, pid?: string) =>
	// @ts-ignore
	sdk.post(`${prefix}/file/folder`, { name, folderId, orgScope, pid });

export const getCloudDocInfo = (fileId: string) =>
	// @ts-ignore
	sdk.get(`${prefix}/file/${fileId}`);

export const getCloudFolderInfo = (folderId: string) =>
	// @ts-ignore
	sdk.get(`${prefix}/file/folder/${folderId}`);

export const getCloudDiskWithPage = (page = 1, size = 20, folderId = '', orgScope = '') =>
	// @ts-ignore
	sdk.get(`${prefix}/file/cloud/list/page`, { page, folderId, orgScope, size });

export const searchCloudDisk = (
	searchContent?: string,
	page = 1,
	size = 30,
	searchScope?: string,
	bgnDate?: string,
	creatorName?: string,
	endDate?: string,
	fileType?: string,
	folderId?: string,
	org?: string
) =>
	// @ts-ignore
	sdk.post(`${prefix}/drive/search`, {
		searchContent,
		page,
		size,
		searchScope,
		bgnDate,
		creatorName,
		endDate,
		fileType,
		folderId,
		org
	});

export const updateFileName = (fileId: string, fileName: string) =>
	// @ts-ignore
	sdk.post(`${prefix}/file/name`, { fileId, fileName });

export const updateFolderName = (folderId: string, folderName: string) =>
	// @ts-ignore
	sdk.post(`${prefix}/file/folder/name`, { folderId, folderName });

export const deleteCloudDOC = (fileIds?: string[], org?: string) =>
	// @ts-ignore
	sdk.post(`${prefix}/files/delete`, { fileIds, org });

export const getPermissionTypeList = () =>
	// @ts-ignore
	sdk.get(`${prefix}/file/permission/type/list`);

export const getCollaborator = (fileId: string) =>
	// @ts-ignore
	sdk.get(`${prefix}/file/collaborator`, { fileId });

export const permissionChange = (fileId: string, permissionType: number, userIds: string[]) =>
	// @ts-ignore
	sdk.post(`${prefix}/file/permission/change`, { fileId, permissionType, userIds });

export const getRecycleList = (page: number, size = 20) =>
	// @ts-ignore
	sdk.get(`${prefix}/files/recycle/list/page`, { page, size });

export const deleteFiles = (fileIds: string[]) =>
	// @ts-ignore
	sdk.post(`${prefix}/files/delete`, { fileIds });

export const completeDeleteFiles = (fileIds: string[]) =>
	// @ts-ignore
	sdk.post(`${prefix}/files/complete/delete`, { fileIds });

export const deleteFolders = (folderIds: string[]) =>
	// @ts-ignore
	sdk.post(`${prefix}/file/folder/delete`, { folderIds });

export const completeDeleteFolders = (folderIds: string[]) =>
	// @ts-ignore
	sdk.post(`${prefix}/file/folder/complete/delete`, { folderIds });

export const recoverFiles = (fileIds: string[]) =>
	// @ts-ignore
	sdk.post(`${prefix}/files/recover`, { fileIds });

export const recoverFolders = (folderIds: string[]) =>
	// @ts-ignore
	sdk.post(`${prefix}/file/folder/recover`, { folderIds });

export const requestFileEport = (fileId: string) =>
	// @ts-ignore
	sdk.get(`${prefix}/file/export`, { fileId });
export const requestFileEportProgress = (fileId?: string, taskId?: string) =>
	// @ts-ignore
	sdk.get(`${prefix}/file/export/progress`, { fileId, taskId });

export const openInCloud = (titleLink: string, title: string) => sdk.post('doc.openInCloud', { titleLink, title });

// @ts-ignore
export const getCloudDocPermission = (fileId: string) => sdk.get(`${prefix}/file/user/permission`, { fileId });

export const getUnreadMsgs = (): Promise<IUnreadMsgs[]> =>
	sdk.get('get.my.unreadV2').then(res => {
		if (res.success) {
			return res.data;
		}

		return Promise.reject(res);
	});

export const postUnreadViewed = (org: string, type: string) => {
	sdk.post('get.my.unread.viewed', { org, type });
};

export const getAllBots = () => sdk.get('robot.findAll', {});

// @ts-ignore
export const getFastModelRef = (docId: string, botId: string) => sdk.get('bot.docs', { docId, botId });

export const getBotInfo = (botId: string) => sdk.get('robot.info', { botId });

export const removeMyUnread = (org: string, type: string, username: string) => {
	const res = sdk.post('remove.my.unreads', { org, type, username });
	return res;
};

export const getMeetingTop = (roomId: string, username: string) => {
	const res = sdk.get('meeting.next', { roomId, username });
	return res;
};

export const me = () => sdk.get('me', {});

export const postChangeFakeName = (rid: string, name: string) => sdk.post('appia/room/changeMemberName', { rid, name });

export const getOtkrCanQuery = (viewer: string, owner: string) => {
	const res = sdk.get('otkr.canQuery', { owner, viewer });
	return res;
};

export const roomRoleAdd = (rid: string, username: string, role: string, single?: boolean) =>
	sdk.post('room.role.add', { rid, username, role, single });

export const roomRoleRmove = (rid: string, username: string, role: string) =>
	sdk.post('room.role.remove', { rid, username, role });

export const messageRecall = (id: string) => sdk.post('message.recall', { id });

export const getFirstUnread = (rid: string) =>
	sdk.get('room.firsUnread', { rid }) as Promise<{ success: boolean; message: IMessage; unread: number }>;

export const toggleLike = (roomId: string, like: boolean) => sdk.post('rooms.like', { roomId, like });
