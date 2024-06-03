import { TAB } from '../actions/actionsTypes';
import { TActionTab } from '../actions/tab';

export const initialState: ITab = {
	messageBadge: 0,
	channelBadge: 0
};

export interface ITab {
	messageBadge: number;
	channelBadge: number;
}

export default function tab(state = initialState, action: TActionTab): ITab {
	switch (action.type) {
		case TAB.UPDATE_MESSAGE_BADGE:
			return {
				...state,
				messageBadge: action.messageBadge
			};
		case TAB.UPDATE_CHANNEL_BADGE:
			return {
				...state,
				channelBadge: action.channelBadge
			};
		default:
			return state;
	}
}
