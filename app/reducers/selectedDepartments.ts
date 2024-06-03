import { SELECTED_DEPARTMENT } from '../actions/actionsTypes';
import { TActionSelectedDepartment } from '../actions/selectedDepartment';

export interface IDepartment {
	children: string[];
	id: string;
	isSelected: boolean;
	name: string;
	parent: string;
	treeType: string;
	type: string;
	usersCount: number;
	usersCountIncludeChildren: number;
}

export interface ISelectedDepartments {
	departments: IDepartment[];
}

export const initialState: ISelectedDepartments = {
	departments: []
};

export default function (state = initialState, action: TActionSelectedDepartment): ISelectedDepartments {
	switch (action.type) {
		case SELECTED_DEPARTMENT.ADD_DEPARTMENT:
			if (state.departments.find(item => item.id === action.department?.id)) return state;
			return {
				...state,
				departments: state.departments.concat(action.department || [])
			};
		case SELECTED_DEPARTMENT.REMOVE_DEPARTMENT:
			return {
				...state,
				departments: state.departments.filter(item => item.id !== action.department?.id)
			};
		case SELECTED_DEPARTMENT.RESET:
			return initialState;
		default:
			return state;
	}
}
