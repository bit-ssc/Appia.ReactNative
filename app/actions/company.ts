import { Action } from 'redux';

import { ICompany } from '../definitions';
import { COMPANY } from './actionsTypes';

interface ICompanySuccess extends Action {
	payload: ICompany[];
}

interface ICompanyToggle extends Action {
	payload: boolean;
}

export type TActionCompany = ICompanySuccess & ICompanyToggle & Action;

export function fetchCompaniesRequest(): Action {
	return {
		type: COMPANY.REQUEST
	};
}

export function fetchCompaniesSuccess(payload: ICompany[]): ICompanySuccess {
	return {
		type: COMPANY.SUCCESS,
		payload
	};
}

export function fetchCompaniesFailure(): Action {
	return {
		type: COMPANY.FAILURE
	};
}

export function toggleCompanies(toggle: boolean): ICompanyToggle {
	return {
		type: COMPANY.TOGGLE,
		payload: toggle
	};
}
