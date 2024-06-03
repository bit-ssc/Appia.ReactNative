import { Action } from 'redux';

import { CHAT } from './actionsTypes';
import { IVChatCallMsg, IVChatHoster } from '../definitions/IVChat';

export interface StartVoiceChat extends Action {
	hoster: IVChatHoster;
}

export interface Notification extends Action {
	channelId: string;
	recordId: string;
}

export interface Accept extends Action {
	recordId?: string;
	isConnect?: boolean;
}

export interface ISCalled extends Action {
	isCalled: boolean;
}

export interface VoiceChatData extends Action {
	callMsg: IVChatCallMsg;
	onCallStatus?: boolean;
}

export type TActionChat = StartVoiceChat & Notification & Accept & ISCalled & VoiceChatData;

export function setStartVoiceChat(hoster: IVChatHoster): StartVoiceChat {
	return {
		type: CHAT.START_VOICE_CHAT,
		hoster
	};
}

export function setCloseChat() {
	return {
		type: CHAT.CLOSE_CHAT
	};
}

export function setOpenCallingNotification(channelId: string, recordId: string): Notification {
	return {
		type: CHAT.OPEN_NOTIFICATION,
		channelId,
		recordId
	};
}

export function setRefuseCall() {
	return {
		type: CHAT.REFUSE
	};
}
export function setAcceptCall(): Accept {
	return {
		type: CHAT.ACCEPT
	};
}

export function setRecordId(recordId: string): Accept {
	return {
		type: CHAT.UPDATE_RECORDID,
		recordId
	};
}

export function setIsConnect(isConnect: boolean): Accept {
	return {
		type: CHAT.UPDATE_CONNECT,
		isConnect
	};
}

export function setIsCalled(isCalled: boolean): ISCalled {
	return {
		type: CHAT.IS_CALLED,
		isCalled
	};
}

export function setOpenChatView() {
	return {
		type: CHAT.OPEN_CHATVIEW
	};
}

export function setUpdateVoiceChatData(callMsg: IVChatCallMsg, onCallStatus: boolean | undefined): VoiceChatData {
	return {
		type: CHAT.UPDATE_CHAT_DATA,
		callMsg,
		onCallStatus
	};
}

export function setJoinVoiceChatData(callMsg: IVChatCallMsg, onCallStatus: boolean | undefined): VoiceChatData {
	return {
		type: CHAT.JOIN_CHAT,
		callMsg,
		onCallStatus
	};
}
