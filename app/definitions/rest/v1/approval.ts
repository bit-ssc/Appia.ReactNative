export interface IPostApproval {
	messageId: string;
	key: string;
}

export type Approval = {
	'oa.approval': {
		POST: (params: IPostApproval) => {};
	};
};
