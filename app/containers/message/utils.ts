/* eslint-disable complexity */
import { IAttachment } from '../../definitions';
import { MessageTypesValues, TMessageModel } from '../../definitions/IMessage';
import I18n from '../../i18n';
import { DISCUSSION } from './constants';

export const DEFAULT_MESSAGE_HEIGHT = 150;

export const formatMessageCount = (count?: number, type?: string): string | null => {
	const discussion = type === DISCUSSION;
	let text = discussion ? I18n.t('No_messages_yet') : null;
	if (!count) {
		return text;
	}
	if (count === 1) {
		text = `${count} ${discussion ? I18n.t('message') : I18n.t('reply')}`;
	} else if (count > 1 && count < 1000) {
		text = `${count} ${discussion ? I18n.t('messages') : I18n.t('replies')}`;
	} else if (count > 999) {
		text = `+999 ${discussion ? I18n.t('messages') : I18n.t('replies')}`;
	}
	return text;
};

export const BUTTON_HIT_SLOP = {
	top: 4,
	right: 4,
	bottom: 4,
	left: 4
};

const messagesWithAuthorName: MessageTypesValues[] = [
	'r',
	'ru',
	'au',
	'rm',
	'uj',
	'ujt',
	'ut',
	'ul',
	'ult',
	'message_pinned',
	'message_snippeted',
	'removed-user-from-team',
	'added-user-to-team',
	'rollback-message',
	'user-added-room-to-team',
	'user-converted-to-team',
	'user-converted-to-channel',
	'user-deleted-room-from-team',
	'user-removed-room-from-team',
	'omnichannel_placed_chat_on_hold',
	'omnichannel_on_hold_chat_resumed',
	'livechat_navigation_history',
	'livechat_transcript_history',
	'command',
	'livechat-started',
	'livechat-close',
	'livechat_video_call',
	'livechat_webrtc_video_call',
	'livechat_transfer_history',
	'room-archived',
	'room-unarchived',
	'user-muted',
	'room_changed_description',
	'room_created_announcement',
	'room_deleted_announcement',
	'room_changed_announcement',
	'room_created_value_proposition',
	'room_changed_value_proposition',
	'room_deleted_value_proposition',
	'room_changed_topic',
	'room_changed_privacy',
	'room_changed_avatar',
	'room_e2e_disabled',
	'room_e2e_enabled',
	'room-allowed-reacting',
	'room-disallowed-reacting',
	'room-set-read-only',
	'room-removed-read-only',
	'user-unmuted',
	'room-unarchived',
	'subscription-role-added',
	'subscription-role-removed',
	'ca'
];

export const messageHaveAuthorName = (type: MessageTypesValues): boolean => messagesWithAuthorName.includes(type);

type TInfoMessage = {
	type: MessageTypesValues;
	role: string;
	roleName?: string;
	msg: string;
	author: { username: string; name: string };
	comment?: string;
};

type RoleMap = {
	[key in 'owner' | 'moderator']: string;
};

const getRoleMap: RoleMap = {
	owner: I18n.t('role_name_owner1'),
	moderator: I18n.t('role_name_moderator1')
};

export const getInfoMessage = ({ type, role, roleName, msg, author, comment }: TInfoMessage): string => {
	// const { username } = author;
	const username = author.name || author.username;

	switch (type) {
		// with author name
		case 'rm':
			return I18n.t('Message_removed');
		case 'uj':
			return I18n.t('Has_joined_the_channel');
		case 'ujt':
			return I18n.t('User_joined_the_team');
		case 'ut':
			return I18n.t('User_joined_the_conversation');
		case 'r':
			return I18n.t('Room_name_changed_to', { name: msg, userBy: username });
		case 'ru':
			if (msg === username) {
				return I18n.t('User_removed_by1', { userRemoved: msg });
			}
			return I18n.t('User_removed_by', { userRemoved: msg, userBy: username });
		case 'au':
			return I18n.t('User_added_to', { userAdded: msg });
		case 'user-muted':
			return I18n.t('User_has_been_muted', { userMuted: msg });
		case 'room_changed_description':
			return I18n.t('changed_room_description', { description: msg });
		case 'room_created_announcement':
			return I18n.t('Room_created_announcement', { announcement: msg, userBy: username });
		case 'room_deleted_announcement':
			return I18n.t('Room_deleted_announcement', { announcement: msg, userBy: username });
		case 'room_changed_announcement':
			return I18n.t('Room_changed_announcement', { announcement: msg, userBy: username });
		case 'room_created_value_proposition':
			return I18n.t('room_created_value_proposition', { proposition: msg, userBy: username });
		case 'room_changed_value_proposition':
			return I18n.t('room_changed_value_proposition', { proposition: msg, userBy: username });
		case 'room_deleted_value_proposition':
			return I18n.t('room_deleted_value_proposition', { proposition: msg, userBy: username });
		case 'room_changed_topic':
			return I18n.t('room_changed_topic_to', { topic: msg });
		case 'room_changed_privacy':
			return I18n.t('room_changed_type', { type: msg });
		case 'room_changed_avatar':
			return I18n.t('Room_changed_avatar', { userBy: username });
		case 'message_snippeted':
			return I18n.t('Created_snippet');
		case 'room_e2e_disabled':
			return I18n.t('Disabled_E2E_Encryption_for_this_room');
		case 'room_e2e_enabled':
			return I18n.t('Enabled_E2E_Encryption_for_this_room');
		case 'removed-user-from-team':
			return I18n.t('Removed__username__from_team', { user_removed: msg });
		case 'added-user-to-team':
			return I18n.t('Added__username__to_team', { user_added: msg });
		case 'rollback-message':
			return I18n.t('Message_recalled', { userBy: username });
		case 'user-added-room-to-team':
			return I18n.t('added__roomName__to_this_team', { roomName: msg });
		case 'user-converted-to-team':
			return I18n.t('Converted__roomName__to_a_team', { roomName: msg });
		case 'user-converted-to-channel':
			return I18n.t('Converted__roomName__to_a_channel', { roomName: msg });
		case 'user-deleted-room-from-team':
			return I18n.t('Deleted__roomName__', { roomName: msg });
		case 'user-removed-room-from-team':
			return I18n.t('Removed__roomName__from_the_team', { roomName: msg });
		case 'room-disallowed-reacting':
			return I18n.t('room_disallowed_reactions');
		case 'room-allowed-reacting':
			return I18n.t('room_allowed_reactions');
		case 'room-set-read-only':
			return I18n.t('Room_set_read_only', { userBy: username });
		case 'room-removed-read-only':
			return I18n.t('Room_removed_read_only', { userBy: username });
		case 'user-unmuted':
			return I18n.t('User_has_been_unmuted', { userUnmuted: msg });
		case 'room-archived':
			return I18n.t('room_archived');
		case 'room-unarchived':
			return I18n.t('room_unarchived');
		case 'subscription-role-added': {
			if (role === 'leader') {
				return I18n.t('User_is_pinned', { userBy: username, user: msg, role: roleName || role });
			}
			return I18n.t('User_was_set_role_by_', {
				userBy: username,
				user: msg,
				role: getRoleMap[(roleName || role) as keyof RoleMap] || roleName || role
			});
		}
		case 'subscription-role-removed': {
			// return `${msg} is no longer ${role} by ${username}`;
			if (role === 'leader') {
				return I18n.t('User_is_unpinned', { userBy: username, user: msg, role: roleName || role });
			}
			return I18n.t('User_is_no_longer_role_by_', {
				userBy: username,
				user: msg,
				role: getRoleMap[(roleName || role) as keyof RoleMap] || roleName || role
			});
		}
		case 'message_pinned':
			return I18n.t('Message_pinned');

		// without author name
		case 'ul':
			return I18n.t('User_left_this_channel');
		case 'ult':
			return I18n.t('Has_left_the_team');
		case 'jitsi_call_started':
			return I18n.t('Started_call', { userBy: username });
		case 'omnichannel_placed_chat_on_hold':
			return I18n.t('Omnichannel_placed_chat_on_hold', { comment });
		case 'omnichannel_on_hold_chat_resumed':
			return I18n.t('Omnichannel_on_hold_chat_resumed', { comment });
		case 'command':
			return I18n.t('Livechat_transfer_return_to_the_queue');
		case 'livechat-started':
			return I18n.t('Chat_started');
		case 'livechat-close':
			return I18n.t('Conversation_closed');
		case 'livechat_transfer_history':
			return I18n.t('New_chat_transfer', { agent: username });
		case 'ca':
			return I18n.t('Change_Agent');
		// default value
		default:
			return I18n.t('Unsupported_system_message');
	}
};

export const getMessageTranslation = (message: TMessageModel, autoTranslateLanguage: string): string | null => {
	if (!autoTranslateLanguage) {
		return null;
	}
	const { translations } = message;
	if (translations) {
		const translation = translations.find((trans: any) => trans.language === autoTranslateLanguage);
		return translation?.value || null;
	}
	return null;
};

export const getMessageFromAttachment = (attachment: IAttachment, translateLanguage?: string): string | undefined => {
	let msg = attachment.description;
	if (translateLanguage) {
		const translatedMessage = attachment.translations?.[translateLanguage];
		if (translatedMessage) {
			msg = translatedMessage;
		}
	}
	return msg;
};
