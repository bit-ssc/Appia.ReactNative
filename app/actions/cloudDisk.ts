import { Action } from 'redux';

import { CLOUD_DISK } from './actionsTypes';

export interface ISetPageNumber extends Action {
	pageNumber: number;
}

export interface ISetDocToken extends Action {
	docToken: string;
}

export interface ICloudDocTask extends Action {
	uploadTaskNum: number;
}

export interface IsUploadNumSHow extends Action {
	isUploadNumShow: boolean;
}

export interface ISetDownloadTaskNum extends Action {
	downloadTaskNum: number;
}

export type TActionCloudDisk = ISetPageNumber & ICloudDocTask & ISetDocToken & IsUploadNumSHow & ISetDownloadTaskNum;

export function setPageNumber(pageNumber: number): ISetPageNumber {
	return {
		type: CLOUD_DISK.SET_PAGE_NUMBER,
		pageNumber
	};
}

export function setDocToken(docToken: string): ISetDocToken {
	return {
		type: CLOUD_DISK.SET_DOC_TOKEN,
		docToken
	};
}

export function setUploadTaskNum(uploadTaskNum: number): ICloudDocTask {
	return {
		type: CLOUD_DISK.UPDATE_TASK_NUM,
		uploadTaskNum
	};
}

export function setIsUploadNumShow(isUploadNumShow: boolean): IsUploadNumSHow {
	return {
		type: CLOUD_DISK.SHOW_UPLOAD_NUM,
		isUploadNumShow
	};
}

export function setDownloadTaskNum(downloadTaskNum: number): ISetDownloadTaskNum {
	return {
		type: CLOUD_DISK.DOWN_LOAD_TASK_NUM,
		downloadTaskNum
	};
}
