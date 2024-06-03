import { NetInfoStateType } from '@react-native-community/netinfo';

import { TActionApp } from '../actions/app';
import { RootEnum } from '../definitions';
import { APP, APP_STATE } from '../actions/actionsTypes';

export interface IApp {
	root?: RootEnum;
	isMasterDetail: boolean;
	text?: string;
	ready: boolean;
	messageMultiSelect: boolean;
	selectedMessageIds: string[];
	foreground: boolean;
	background: boolean;
	notificationPresenceCap: boolean;
	netInfoState?: NetInfoStateType | null;
}

export const initialState: IApp = {
	root: undefined,
	isMasterDetail: false,
	text: undefined,
	ready: false,
	messageMultiSelect: false,
	selectedMessageIds: [],
	foreground: true,
	background: false,
	notificationPresenceCap: false,
	netInfoState: null
};

export default function app(state = initialState, action: TActionApp): IApp {
	switch (action.type) {
		case APP_STATE.FOREGROUND:
			return {
				...state,
				foreground: true,
				background: false
			};
		case APP_STATE.BACKGROUND:
			return {
				...state,
				foreground: false,
				background: true
			};
		case APP.START:
			return {
				...state,
				root: action.root,
				text: action.text
			};
		case APP.INIT:
			return {
				...state,
				ready: false
			};
		case APP.READY:
			return {
				...state,
				ready: true
			};
		case APP.MESSAGE_MULTI_SELECT:
			return {
				...state,
				messageMultiSelect: action.value
			};
		case APP.SELECTED_MESSAGE_IDS:
			return {
				...state,
				selectedMessageIds: action.selectedMessageIds
			};
		case APP.SET_MASTER_DETAIL:
			return {
				...state,
				isMasterDetail: false
			};
		case APP.SET_NOTIFICATION_PRESENCE_CAP:
			return {
				...state,
				notificationPresenceCap: action.show
			};
		case APP.SET_NET_INFO_STATE:
			return {
				...state,
				netInfoState: action.netInfoState
			};
		default:
			return state;
	}
}
