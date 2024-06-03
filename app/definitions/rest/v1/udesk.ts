export interface IPostStaffServiceSurveyData {
	im_sub_session_id: number;
	option_id: number;
	resolved_state_v2?: number;
	remark?: string;
}

export enum AssignType {
	urobot = 'urobot',
	agent = 'agent'
}

export interface IPostStaffServiceSurvey {
	message_id: string | undefined;
	assign_type: string;
	data: IPostStaffServiceSurveyData;
}

export interface IGetAssetType {
	data: {
		assign_type: AssignType;
	};
	success: boolean;
}

export type Udesk = {
	'robot/staffService/survey': {
		POST: (params: IPostStaffServiceSurvey) => unknown;
	};
	'robot/staffService/agent': {
		POST: (params: { rid: string }) => unknown;
	};
	'robot/staffService/agent_close': {
		POST: (params: { rid: string }) => unknown;
	};
	'robot/staffService/assign_type': {
		GET: (params: { rid: string }) => IGetAssetType;
	};
};
