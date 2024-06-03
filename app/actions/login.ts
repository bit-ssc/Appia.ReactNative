import { Action } from 'redux';

import { IUser } from '../definitions';
import * as types from './actionsTypes';

interface ICredentials {
	resume: string;
	user: string;
	password: string;
	ldap: boolean;
	smsCode: boolean;
	phone: string;
	areaCode: string;
	code: string;
	token: string;
}

interface ILoginRequest extends Action {
	credentials: any;
	logoutOnError?: boolean;
	isFromWebView?: boolean;
	registerCustomFields?: any;
	server?: string;
}

interface ILoginSuccess extends Action {
	user: Partial<IUser>;
}

interface ILoginFailure extends Action {
	err: Partial<IUser>;
}

interface ILogout extends Action {
	forcedByServer: boolean;
	message: string;
}

interface ISetUser extends Action {
	user: Partial<IUser>;
}

interface ISetServices extends Action {
	data: Record<string, string>;
}

interface ISetPreference extends Action {
	preference: Record<string, any>;
}

interface ISetLocalAuthenticated extends Action {
	isLocalAuthenticated: boolean;
}

interface ILoginRequestWithToken extends Action {
	server?: string;
	appiaToken?: string;
	data?: {};
}

interface ILogoutBySwitch extends Action {
	bySwitch: boolean;
}

interface ILoginBySwitch extends Action {
	loadingOtherCompanyUserData: boolean;
}

interface ILogoutSwitch extends Action {
	payload: boolean;
}

interface ILoginSwitchStatus extends Action {
	switchStatus: number;
}

export type TActionsLogin = ILoginRequest &
	ILoginSuccess &
	ILoginFailure &
	ILogout &
	ISetUser &
	ISetServices &
	ISetPreference &
	ISetLocalAuthenticated &
	ILogoutBySwitch &
	ILogoutSwitch &
	ILoginRequestWithToken &
	ILoginSwitchStatus &
	ILoginBySwitch;

export function loginRequest(
	credentials: Partial<ICredentials>,
	logoutOnError?: boolean,
	isFromWebView?: boolean,
	registerCustomFields?: any
): ILoginRequest {
	return {
		type: types.LOGIN.REQUEST,
		credentials,
		logoutOnError,
		isFromWebView,
		registerCustomFields
	};
}

export function loginWithServer(server: string, credentials: Partial<ICredentials>): ILoginRequest {
	return {
		type: types.LOGIN.LOGIN_WITH_SERVER,
		credentials,
		server
	};
}

export function loginWithToken(data: {}): ILoginRequestWithToken {
	return {
		type: types.LOGIN.LOGIN_WITH_TOKEN,
		data
	};
}

export function loginSuccess(user: Partial<IUser>): ILoginSuccess {
	return {
		type: types.LOGIN.SUCCESS,
		user
	};
}

export function loginSuccessRestore(): Action {
	return {
		type: types.LOGIN.RESTORE
	};
}

export function loginFailure(err: Record<string, any>): ILoginFailure {
	return {
		type: types.LOGIN.FAILURE,
		err
	};
}

export function switchLogin(payload: boolean): ILogoutSwitch {
	return {
		type: types.LOGIN.SWITCH,
		payload
	};
}

export function loginEndBySwitch(loadingOtherCompanyUserData: boolean): ILoginBySwitch {
	return {
		type: types.LOGIN.LOGIN_END_BY_SWITCH,
		loadingOtherCompanyUserData
	};
}

export function updateLoginSwitchStatus(switchStatus: number): ILoginSwitchStatus {
	return {
		type: types.LOGIN.LOGIN_SWITCH_STATUS,
		switchStatus
	};
}

export function logout(forcedByServer = false, message = ''): ILogout {
	return {
		type: types.LOGOUT,
		forcedByServer,
		message
	};
}

export function logoutBySwitch(): ILogoutBySwitch {
	return {
		type: types.LOGOUT,
		bySwitch: true
	};
}

export function setUser(user: Partial<IUser>): ISetUser {
	return {
		type: types.USER.SET,
		user
	};
}

export function clearUser(): Action {
	return {
		type: types.USER.CLEAR
	};
}

export function restorePreviousUser(user: Partial<IUser>): ISetUser {
	return {
		type: types.USER.RESTORE,
		user
	};
}

export function setLoginServices(data: Record<string, any>): ISetServices {
	return {
		type: types.LOGIN.SET_SERVICES,
		data
	};
}

export function setPreference(preference: Record<string, any>): ISetPreference {
	return {
		type: types.LOGIN.SET_PREFERENCE,
		preference
	};
}

export function setLocalAuthenticated(isLocalAuthenticated: boolean): ISetLocalAuthenticated {
	return {
		type: types.LOGIN.SET_LOCAL_AUTHENTICATED,
		isLocalAuthenticated
	};
}

export function deleteAccount(): Action {
	return {
		type: types.DELETE_ACCOUNT
	};
}
