import { TActionCompany } from '../actions/company';
import { ICompany } from '../definitions/ICompany';
import { COMPANY } from '../actions/actionsTypes';

export interface ICompanyStore {
	companies: ICompany[];
	toggle: boolean;
}

export const initialState: ICompanyStore = {
	companies: [],
	toggle: false
};

export default function company(state = initialState, action: TActionCompany): ICompanyStore {
	const { type, payload } = action;

	switch (type) {
		case COMPANY.SUCCESS:
			return {
				...state,
				companies: payload
			};

		case COMPANY.TOGGLE:
			return {
				...state,
				toggle: payload
			};

		default:
			return state;
	}
}
