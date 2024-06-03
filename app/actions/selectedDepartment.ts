import { Action } from 'redux';

import { IDepartment } from '../reducers/selectedDepartments';
import { SELECTED_DEPARTMENT } from './actionsTypes';

type TDepartment = {
	department?: IDepartment;
};

export type TActionSelectedDepartment = TDepartment & Action;

export function addDepartment(department: IDepartment): TActionSelectedDepartment {
	return {
		type: SELECTED_DEPARTMENT.ADD_DEPARTMENT,
		department
	};
}

export function removeDepartment(department: IDepartment): TActionSelectedDepartment {
	return {
		type: SELECTED_DEPARTMENT.REMOVE_DEPARTMENT,
		department
	};
}

export function reset(): TActionSelectedDepartment {
	return {
		type: SELECTED_DEPARTMENT.RESET
	};
}
