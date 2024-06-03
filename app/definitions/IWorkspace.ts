export interface IWorkSpaceGroup {
	name: string;
	row: number;
	items: IWorkspaceItem[];
}
export interface IWorkspaceItem {
	name: string;
	desc: string;
	status: number;
	type: number;
	seq: number;
	url: string;
	icon: string;
	need_auth: boolean;
	url_type?: number;
	extra: {
		source?: string;
		name: string;
	};
}
