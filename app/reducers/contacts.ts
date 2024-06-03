import { IDepartment, IUserSummary } from '../definitions';
import { TActionContacts } from '../actions/contacts';
import { CONTACTS } from '../actions/actionsTypes';

export enum PHASE {
	UNLOAD = 'UNLOAD',
	LOADING = 'LOADING',
	LOAD_ERROR = 'LOAD_ERROR',
	LOADED = 'LOADED'
}

export interface IContacts {
	phase: PHASE;
	userMap: Record<string, IUserSummary>;
	departmentMap: Record<string, IDepartment>;
}

export const initialState: IContacts = {
	phase: PHASE.UNLOAD,
	userMap: {},
	departmentMap: {}
};

export default function app(state = initialState, action: TActionContacts): IContacts {
	switch (action.type) {
		case CONTACTS.SET:
			return {
				...state,
				...action.payload
			};
		default:
			return state;
	}
}
