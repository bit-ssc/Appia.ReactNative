export enum ETreeType {
	root = 'ROOT',
	department = 'DEPARTMENT',
	staff = 'STAFF'
}

export interface IRoot {
	_id: string;
	id: number;
	name: string;
	treeType: ETreeType.root;
	canVisit: boolean;
	hasStaff: boolean;
	users: string[];
	children: string[];

	usersCount: number;
	usersCountIncludeChildren: number;
	countIncludeChildren: IDepartmentCount;
}

export interface IUserSummary {
	_id: string;
	id: number;
	name: string;
	username: string;
	fname: string;
	account: string;
	ename?: string;
	email?: string;
	canVisit: boolean;
	pinyin?: string;
	status?: string;
	treeType: ETreeType.staff;
	type: string;
	propertyDesc: string;
	departments: string[];
	departmentNames: string[];
	jobName: string;
}

/**
 export interface IUserSummary {
	_id: string;
	active: boolean;
	avatarETag?: string;
	name?: string;
	username: string;
	roles: IRole['_id'][];
	emails?: IUserEmail[];
	status?: UserStatus;
	importIds?: string[];
	employeeID?: string;
	positions?: {};
	jobName?: string;
}
 */

export interface IDepartmentCount {
	all: number;
	fullTime?: number;
	partTime?: number;
	internship?: number;
	outsourcing?: number;
	other?: number;
}

export interface IDepartment {
	_id: string;
	id: number;
	canVisit: boolean;
	code: string;
	hasStaff: boolean;
	name: string;
	treeType: ETreeType.department;
	type: string;
	users: string[];
	children: string[];
	parent: string;
	parentDepartmentName: string;
	managers: number[];
	parentDepartments: string[];

	usersCount: number;
	usersCountIncludeChildren: number;
	countIncludeChildren: IDepartmentCount;
	deputyCadre: string[];
	officialCadre: string[];
	sponsor: string[];
}

export interface IPdtItem {
	id: number;
	companyId: number;
	name: string;
	createTime: string;
	memberRolesList: IMemberRoles[];
}

export interface IMemberRoles {
	member: {
		id: number;
		companyId: number;
		companyName: string;
		account: string;
		displayName: string;
		mobile: string;
		email: string;
		jobNumber: string;
		departmentStr: string[];
	};
	roles: {
		id: number;
		name: string;
	}[];
}
