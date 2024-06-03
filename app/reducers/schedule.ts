import { TActionSchedule } from '../actions/schedule';
import { SCHEDULE } from '../actions/actionsTypes';

export const initialState: ISchedule = {
	schedule: ''
};

export interface ISchedule {
	schedule: string;
}

export default function schedule(state = initialState, action: TActionSchedule): ISchedule {
	switch (action.type) {
		case SCHEDULE.UPDATE_SCHEDULE:
			return {
				...state,
				schedule: action.schedule
			};
		default:
			return state;
	}
}
