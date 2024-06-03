export interface IFeedbackSaveParams {
	user_info: {
		user_id?: string;
		user_name?: string;
	};
	content: {
		feedback: string;
		page?: string;
		pageParams?: { rid?: string };
		appiaVersion?: string;
		brand?: string;
		osVersion?: string;
		isLandscape?: boolean;
		model?: string;
		platform?: string;
	};
}

export interface IFanweiToken {
	result: {
		data?: string;
	};
	success: boolean;
}

export interface IUnreadMsgs {
	org: string;
	unreadChannelCount: number;
	unreadTalkCount: number;
	unreadChannelUpdatedAt: number;
	unreadTalkUpdatedAt: number;
	recentChannelViewed: boolean;
	recentTalkViewed: boolean;
}

export type Common = {
	'feedback.save': {
		POST: (params: IFeedbackSaveParams) => {};
	};
	'proxy/hrm/resource/token': {
		GET: () => IFanweiToken;
	};
	'get.my.unreadV2': {
		GET: () => {
			data: IUnreadMsgs[];
			success: boolean;
		};
	};
	'get.my.unread.viewed': {
		POST: (params: { org: string; type: string }) => {};
	};
	'remove.my.unreads': {
		POST: (params: { org: string; type: string; username: string }) => {};
	};
};
