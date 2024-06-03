import { Action } from 'redux';

import { CONTACTS } from './actionsTypes';
import { IDepartment, IUserSummary } from '../definitions';

interface SetContactsParams {
	userMap?: Record<string, IUserSummary>;
	departmentMap?: Record<string, IDepartment>;
}

type ISetContacts = Action & {
	payload: SetContactsParams;
};

export type TActionContacts = ISetContacts;

interface IGetContactsMeta {
	resolve: () => void;
	reject: () => void;
}

interface IGetContactsPayload {
	force: boolean;
}

export const getContacts = (
	payload: IGetContactsPayload,
	meta: IGetContactsMeta
): Action & { payload: IGetContactsPayload; meta: IGetContactsMeta } => ({
	type: CONTACTS.REQUEST,
	payload,
	meta
});

export const setContacts = (payload: SetContactsParams): ISetContacts => ({
	type: CONTACTS.SET,
	payload
});

export const resetContacts = (): ISetContacts => ({
	type: CONTACTS.SET,
	payload: {
		userMap: {},
		departmentMap: {}
	}
});
