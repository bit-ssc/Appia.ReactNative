import { MODEL } from '../actions/actionModel';

export interface Model {
	modelShow: boolean;
}

const initialState = {
	modelShow: false
};

export default function model(state = initialState, action: { type: 'CLOSE_MODEL' | 'OPEN_MODEL' | null }): Model {
	console.info(MODEL.OPEN_MODEL, 'MODEL.OPEN_MODEL');
	switch (action.type) {
		case MODEL.CLOSE_MODEL:
			return {
				...state,
				modelShow: false
			};
		case MODEL.OPEN_MODEL:
			return {
				...state,
				modelShow: true
			};

		default:
			return state;
	}
}
