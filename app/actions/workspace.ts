import { Action } from 'redux';

import { WORKSPACE } from './actionsTypes';
import { IWorkSpaceGroup } from '../definitions';
import { PHASE } from '../reducers/workspace';

interface SetWorkspaceParams {
	phase: PHASE.UNLOAD;
	groups?: Record<string, IWorkSpaceGroup[]>;
}

type ISetWorkspace = Action & {
	payload: SetWorkspaceParams;
};

export type TActionWorkspace = ISetWorkspace;

interface IGetWorkspaceMeta {
	resolve: () => void;
	reject: () => void;
}

interface IGetWorkspacePayload {
	force: boolean;
	server: string;
}

export const getWorkspace = (
	payload: IGetWorkspacePayload,
	meta: IGetWorkspaceMeta
): Action & { payload: IGetWorkspacePayload; meta: IGetWorkspaceMeta } => ({
	type: WORKSPACE.REQUEST,
	payload,
	meta
});

export const setWorkspace = (payload: SetWorkspaceParams): ISetWorkspace => ({
	type: WORKSPACE.SET,
	payload
});

export const resetWorkspace = (): ISetWorkspace => ({
	type: WORKSPACE.SET,
	payload: {
		groups: {},
		phase: PHASE.UNLOAD
	}
});
