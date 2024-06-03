import { SubscriptionType } from './ISubscription';

export enum IVChatStatusType {
	CALLING = 'calling',
	TALKING = 'talking',
	END = 'end',
	ERROR = 'error',
	TIMEOUT = 'timeout',
	CANCEL = 'cancel',
	REJECT = 'reject',
	BUSY = 'busy',
	FAIL = 'fail'
}

export interface IVChatReceiver {
	initiator: string;
	initiatorUid: string;
	receivers?: IVCReceiveUser[];
	recordId: string;
	roomId: string;
	roomType?: SubscriptionType;
}

export interface IVCRecordData {
	exist: string;
	recordId: string;
	channelId: string;
	initiator: string;
	initiatorUid: string;
	initiatorName?: string | undefined;
	receivers?: IVCReceiveUser[];
}

export interface IVCReceiveUser {
	receiver: string;
	receiverUid: number;
	receiverAppiaId?: string;
	status: string;
}

export interface IVCUser {
	_id: string;
	name: string;
	username?: string;
	status: string;
}

export interface IVCStatus {
	username: string;
	status: string;
	operation: string;
}

export interface IVChatHoster {
	roomId: string;
	roomType: SubscriptionType;
	receivers: IVCReceiveUser[];
}

export interface IVChatCallMsg {
	status: string;
	roomId: string;
	roomType: SubscriptionType;
	org: string;
	userStatus?: IVCStatus[];
	recordData?: IVCRecordData;
	receivers: IVCReceiveUser[];
}
