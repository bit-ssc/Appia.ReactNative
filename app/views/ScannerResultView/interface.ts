import { SubscriptionType } from '../../definitions';

export interface IJoinFederation {
	inviteUsername: string;
	attribution: string;
	rid: string;
	expire: number;
	roomType: SubscriptionType;
	ownerOrg: string;
	owner: string;
	fname: string;
	mri: string;
	avatar: string;
	valueProposition: string;
	existInRoom: boolean;
	managerInfos: { name: string; username: string; roles: string[] }[];
	applyEnable: boolean;
	rt: string;
	membersCount: number;
	members: string[];
	limitNumber: number;
	isManager: boolean;
}
