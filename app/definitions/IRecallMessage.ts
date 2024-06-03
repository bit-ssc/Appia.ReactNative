import Model from '@nozbe/watermelondb/Model';

export interface IRecallMessage {
	_id: string;
	msg: string;
	msgType: string;
	rt: string;
	recallId: string;
}

export type TRecallMessageModel = IRecallMessage & Model;
