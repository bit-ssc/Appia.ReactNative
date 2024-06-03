import { Action } from 'redux';

import { SCHEDULE } from './actionsTypes';

export interface IUpdateSchedule extends Action {
	schedule: string;
}

export type TActionSchedule = IUpdateSchedule;

export function updateSchedule(schedule: string): IUpdateSchedule {
	return {
		type: SCHEDULE.UPDATE_SCHEDULE,
		schedule
	};
}
