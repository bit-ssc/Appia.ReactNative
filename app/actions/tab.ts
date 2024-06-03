import { Action } from 'redux';

import { TAB } from './actionsTypes';

export interface IUpdateMessageBadge extends Action {
	messageBadge: number;
}

export interface IUpdateChannelBadge extends Action {
	channelBadge: number;
}

export type TActionTab = IUpdateMessageBadge & IUpdateChannelBadge;

export function updateMessageBadge(messageBadge: number): IUpdateMessageBadge {
	return {
		type: TAB.UPDATE_MESSAGE_BADGE,
		messageBadge
	};
}

export function updateChannelBadge(channelBadge: number): IUpdateChannelBadge {
	return {
		type: TAB.UPDATE_CHANNEL_BADGE,
		channelBadge
	};
}
