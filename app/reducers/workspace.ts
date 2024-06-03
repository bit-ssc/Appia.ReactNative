import { IWorkSpaceGroup } from '../definitions';
import { TActionWorkspace } from '../actions/workspace';
import { WORKSPACE } from '../actions/actionsTypes';

export enum PHASE {
	UNLOAD = 'UNLOAD',
	LOADING = 'LOADING',
	LOAD_ERROR = 'LOAD_ERROR',
	LOADED = 'LOADED'
}

export interface IWorkspace {
	phase: PHASE;
	groups: Record<string, IWorkSpaceGroup[]>;
}

export const initialState: IWorkspace = {
	phase: PHASE.UNLOAD,
	groups: {}
};

export default function app(state = initialState, action: TActionWorkspace): IWorkspace {
	switch (action.type) {
		case WORKSPACE.SET:
			return {
				...state,
				...action.payload
			};
		default:
			return state;
	}
}
