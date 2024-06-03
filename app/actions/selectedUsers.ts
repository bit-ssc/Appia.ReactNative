import { Action } from 'redux';

import { ISelectedUser } from '../reducers/selectedUsers';
import * as types from './actionsTypes';

type TUser = {
	user?: ISelectedUser;
	users?: ISelectedUser[];
	federated?: boolean;
};

type TAction = Action & TUser;

interface ISetLoading extends Action {
	loading: boolean;
}

export type TActionSelectedUsers = TAction & ISetLoading;

export function addUser(user: ISelectedUser): TAction {
	return {
		type: types.SELECTED_USERS.ADD_USER,
		user
	};
}

export function removeUser(user: ISelectedUser, federated?: boolean): TAction {
	return {
		type: types.SELECTED_USERS.REMOVE_USER,
		user,
		federated
	};
}

export function addUsers(users: ISelectedUser[]): TAction {
	return {
		type: types.SELECTED_USERS.ADD_USERS,
		users
	};
}

export function removeUsers(users: ISelectedUser[]): TAction {
	return {
		type: types.SELECTED_USERS.REMOVE_USERS,
		users
	};
}

export function reset(): Action {
	return {
		type: types.SELECTED_USERS.RESET
	};
}

export function setLoading(loading: boolean): ISetLoading {
	return {
		type: types.SELECTED_USERS.SET_LOADING,
		loading
	};
}
