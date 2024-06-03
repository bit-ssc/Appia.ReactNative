export enum EResourceType {
	image = 0,
	video = 1,
	audio = 2
}

export interface IDynamicUser {
	name: string;
	username: string;
}

export interface IResource {
	resourceId: string;
	url: string;
	thumbnailUrl300: string;
	thumbnailUrl100: string;
	thumbnailHDUrl: string;
	type: EResourceType;
	size: number;
	height: number;
	width: number;
	shootingTime: string;
	user: IDynamicUser;
	createTime: string;
}

export interface IInteraction {
	interactionId: string;
	dynamicId: string;
	type: number;
	createTime: string;
	user: IDynamicUser;
}

export interface IDynamic {
	dynamicId: string;
	batchId: string;
	circleId: string;
	circleName: string;
	isPraise: boolean;
	resourceType: number;
	description: string;
	praiseCount: number;
	createTime: string;
	modifyTime: string;
	user: IDynamicUser;
	resources: IResource[];
	interactions: IInteraction[];
}
