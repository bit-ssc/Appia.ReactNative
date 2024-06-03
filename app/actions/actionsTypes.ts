const REQUEST = 'REQUEST';
const SUCCESS = 'SUCCESS';
const FAILURE = 'FAILURE';
const defaultTypes = [REQUEST, SUCCESS, FAILURE];
function createRequestTypes(base = {}, types = defaultTypes): Record<string, string> {
	const res: Record<string, string> = {};
	types.forEach(type => (res[type] = `${base}_${type}`));
	return res;
}

// Login events
export const LOGIN = createRequestTypes('LOGIN', [
	...defaultTypes,
	'SET_SERVICES',
	'SET_PREFERENCE',
	'SET_LOCAL_AUTHENTICATED',
	'LOGIN_WITH_SERVER',
	'LOGIN_WITH_TOKEN',
	'SWITCH',
	'LOGIN_END_BY_SWITCH',
	'LOGIN_SWITCH_STATUS',
	'RESTORE'
]);
export const SHARE = createRequestTypes('SHARE', ['SELECT_SERVER', 'SET_USER', 'SET_SETTINGS', 'SET_SERVER_INFO']);
export const USER = createRequestTypes('USER', ['SET', 'CLEAR', 'RESTORE']);
export const ROOMS = createRequestTypes('ROOMS', [
	...defaultTypes,
	'REFRESH',
	'SET_SEARCH',
	'CLOSE_SERVER_DROPDOWN',
	'TOGGLE_SERVER_DROPDOWN',
	'OPEN_SEARCH_HEADER',
	'CLOSE_SEARCH_HEADER',
	'MESSAGE_UNREAD',
	'CHANNEL_UNREAD'
]);
export const ROOM = createRequestTypes('ROOM', [
	'SUBSCRIBE',
	'UNSUBSCRIBE',
	'LEAVE',
	'DELETE',
	'REMOVED',
	'FORWARD',
	'USER_TYPING',
	'HISTORY_REQUEST',
	'HISTORY_FINISHED',
	'UPDATE_ROOM_LEADER'
]);
export const INQUIRY = createRequestTypes('INQUIRY', [
	...defaultTypes,
	'SET_ENABLED',
	'RESET',
	'QUEUE_ADD',
	'QUEUE_UPDATE',
	'QUEUE_REMOVE'
]);
export const APP = createRequestTypes('APP', [
	'START',
	'READY',
	'MESSAGE_MULTI_SELECT',
	'SELECTED_MESSAGE_IDS',
	'INIT',
	'INIT_LOCAL_SETTINGS',
	'SET_MASTER_DETAIL',
	'SET_NOTIFICATION_PRESENCE_CAP'
]);
export const MESSAGES = createRequestTypes('MESSAGES', ['REPLY_BROADCAST']);
export const CREATE_CHANNEL = createRequestTypes('CREATE_CHANNEL', [...defaultTypes]);
export const CREATE_DISCUSSION = createRequestTypes('CREATE_DISCUSSION', [...defaultTypes]);
export const SELECTED_USERS = createRequestTypes('SELECTED_USERS', [
	'ADD_USER',
	'ADD_USERS',
	'REMOVE_USERS',
	'REMOVE_USER',
	'RESET',
	'SET_LOADING'
]);
export const SELECTED_DEPARTMENT = createRequestTypes('SELECTED_DEPARTMENT', ['ADD_DEPARTMENT', 'REMOVE_DEPARTMENT', 'RESET']);

export const SERVER = createRequestTypes('SERVER', [
	...defaultTypes,
	'SELECT_SUCCESS',
	'SELECT_REQUEST',
	'SELECT_FAILURE',
	'INIT_ADD',
	'FINISH_ADD',
	'REQUESTBYSWITCH',
	'REQUESTBYSWITCH_RESTORE'
]);
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT']);
export const LOGOUT = 'LOGOUT'; // logout is always success
export const DELETE_ACCOUNT = 'DELETE_ACCOUNT';
export const SNIPPETED_MESSAGES = createRequestTypes('SNIPPETED_MESSAGES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED']);
export const DEEP_LINKING = createRequestTypes('DEEP_LINKING', ['OPEN']);
export const SORT_PREFERENCES = createRequestTypes('SORT_PREFERENCES', ['SET_ALL', 'SET']);
export const SET_CUSTOM_EMOJIS = 'SET_CUSTOM_EMOJIS';
export const ACTIVE_USERS = createRequestTypes('ACTIVE_USERS', ['SET', 'CLEAR']);
export const USERS_TYPING = createRequestTypes('USERS_TYPING', ['ADD', 'REMOVE', 'CLEAR']);
export const INVITE_LINKS = createRequestTypes('INVITE_LINKS', [
	'SET_TOKEN',
	'SET_PARAMS',
	'SET_INVITE',
	'CREATE',
	'CLEAR',
	...defaultTypes
]);
export const SETTINGS = createRequestTypes('SETTINGS', ['CLEAR', 'ADD', 'UPDATE']);
export const APP_STATE = createRequestTypes('APP_STATE', ['FOREGROUND', 'BACKGROUND']);
export const ENTERPRISE_MODULES = createRequestTypes('ENTERPRISE_MODULES', ['CLEAR', 'SET']);
export const ENCRYPTION = createRequestTypes('ENCRYPTION', ['INIT', 'STOP', 'DECODE_KEY', 'SET', 'SET_BANNER']);

export const PERMISSIONS = createRequestTypes('PERMISSIONS', ['SET', 'UPDATE']);
export const ROLES = createRequestTypes('ROLES', ['SET', 'UPDATE', 'REMOVE']);

export const CONTACTS = createRequestTypes('CONTACTS', [...defaultTypes, 'SET']);

export const WORKSPACE = createRequestTypes('WORKSPACE', [...defaultTypes, 'SET']);
export const COMPANY = createRequestTypes('COMPANY', [...defaultTypes, 'TOGGLE']);

export const DYNAMIC = createRequestTypes('DYNAMIC', [
	'FETCH_DYNAMIC_LIST',
	'FETCH_DYNAMIC_LIST_SUCCESS',
	'FETCH_DYNAMIC_LIST_ERROR',
	'FETCH_DYNAMIC',
	'FETCH_DYNAMIC_SUCCESS',
	'FETCH_DYNAMIC_ERROR',
	'DELETE_DYNAMIC',
	'PRAISE_DYNAMIC',
	'RESET'
]);
export const TAB = createRequestTypes('TAB', ['UPDATE_MESSAGE_BADGE', 'UPDATE_CHANNEL_BADGE']);
export const SCHEDULE = createRequestTypes('Schedule', ['UPDATE_SCHEDULE']);
export const EXTERNAL_MEMBERS = createRequestTypes('EXTERNAL_MEMBERS', [...defaultTypes, 'SET']);
export const CLOUD_DISK = createRequestTypes('CLOUD_DISK', [
	'SET_PAGE_NUMBER',
	'SET_DOC_TOKEN',
	'UPDATE_TASK_NUM',
	'SHOW_UPLOAD_NUM',
	'DOWN_LOAD_TASK_NUM'
]);

export const CHAT = createRequestTypes('CHAT', [
	'START_VOICE_CHAT',
	'CLOSE_CHAT',
	'OPEN_NOTIFICATION',
	'OPEN_CHATVIEW',
	'REFUSE',
	'ACCEPT',
	'UPDATE_RECORDID',
	'UPDATE_CONNECT',
	'IS_CALLED',
	'UPDATE_CHAT_DATA',
	'JOIN_CHAT'
]);
