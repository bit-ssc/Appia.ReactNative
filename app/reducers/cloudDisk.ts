import { TActionCloudDisk } from '../actions/cloudDisk';
import { CLOUD_DISK } from '../actions/actionsTypes';

export interface ICloudDiskStore {
	pageNumber: number;
	docToken: string;
	uploadTaskNum: number;
	isUploadNumShow: boolean;
	downloadTaskNum: number;
}

export const initialState: ICloudDiskStore = {
	pageNumber: 0,
	docToken: '',
	uploadTaskNum: 0,
	isUploadNumShow: false,
	downloadTaskNum: 0
};

export default function cloudDisk(state = initialState, action: TActionCloudDisk): ICloudDiskStore {
	switch (action.type) {
		case CLOUD_DISK.SET_PAGE_NUMBER:
			return {
				...state,
				pageNumber: action.pageNumber
			};
		case CLOUD_DISK.SET_DOC_TOKEN:
			return {
				...state,
				docToken: action.docToken
			};
		case CLOUD_DISK.UPDATE_TASK_NUM:
			return {
				...state,
				uploadTaskNum: action.uploadTaskNum
			};
		case CLOUD_DISK.SHOW_UPLOAD_NUM:
			return {
				...state,
				isUploadNumShow: action.isUploadNumShow
			};
		case CLOUD_DISK.DOWN_LOAD_TASK_NUM:
			return {
				...state,
				downloadTaskNum: action.downloadTaskNum
			};
		default:
			return state;
	}
}
