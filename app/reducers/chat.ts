import { TActionChat } from '../actions/chat';
import { CHAT } from '../actions/actionsTypes';
import { IVChatCallMsg, IVChatHoster, IVChatReceiver } from '../definitions/IVChat';

export interface IChat {
	userid?: string;
	isOpenChat: boolean;
	channelId?: string;
	hoster?: IVChatHoster;
	receiver?: IVChatReceiver;
	recordId: string;
	isConnect?: boolean;
	isCalled?: boolean;
	isAccept?: boolean;
	callMsg?: IVChatCallMsg;
	onCallStatus?: boolean;
}

export const initialState: IChat = {
	userid: '',
	isOpenChat: false,
	channelId: '',
	recordId: '',
	hoster: undefined,
	receiver: undefined,
	isConnect: false,
	isAccept: false,
	callMsg: undefined,
	onCallStatus: false
};

export default function chat(state = initialState, action: TActionChat): IChat {
	switch (action.type) {
		case CHAT.START_VOICE_CHAT:
			return {
				...state,
				hoster: action.hoster,
				isOpenChat: true
			};
		case CHAT.CLOSE_CHAT:
			return {
				...state,
				isOpenChat: false,
				userid: '',
				channelId: '',
				recordId: '',
				hoster: undefined,
				isConnect: false,
				isCalled: false,
				isAccept: false,
				onCallStatus: false
			};
		case CHAT.OPEN_NOTIFICATION:
			return {
				...state,
				channelId: action.channelId,
				recordId: action.recordId
			};
		case CHAT.REFUSE:
			return {
				...state,
				isOpenChat: false,
				userid: '',
				channelId: '',
				recordId: '',
				hoster: undefined,
				isConnect: false,
				isCalled: false,
				isAccept: false,
				onCallStatus: false
			};
		case CHAT.ACCEPT:
			return {
				...state,
				isOpenChat: true,
				isConnect: true,
				isAccept: true
			};
		case CHAT.UPDATE_RECORDID:
			return {
				...state,
				recordId: action.recordId
			};
		case CHAT.UPDATE_CONNECT:
			return {
				...state,
				isConnect: action.isConnect
			};
		case CHAT.IS_CALLED:
			return {
				...state,
				isCalled: action.isCalled
			};
		case CHAT.OPEN_CHATVIEW:
			return {
				...state,
				isOpenChat: true,
				isAccept: false
			};
		case CHAT.UPDATE_CHAT_DATA:
			return {
				...state,
				onCallStatus: action.onCallStatus,
				callMsg: action.callMsg
			};
		case CHAT.JOIN_CHAT:
			return {
				...state,
				onCallStatus: action.onCallStatus,
				callMsg: action.callMsg,
				isOpenChat: true,
				isAccept: true
			};
		default:
			return state;
	}
}
