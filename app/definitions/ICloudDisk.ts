export interface IFileInfo {
	createdAt?: string;
	creatorId?: string;
	downloadUrl?: string;
	extraPermission?: number;
	fileId?: string;
	fileSize?: number;
	folderId?: string;
	format?: string;
	id?: string;
	name?: string;
	ownerId?: string;
	progress?: number;
	pwd?: string;
	source?: string;
	status?: string;
	taskId?: string;
	type?: string;
	updatedAt?: string;
	views?: number;
	creatorName?: string;
}

export interface IFolderInfo {
	createAt?: string;
	folderId?: string;
	folderSize?: number;
	id?: string;
	name?: string;
	ownerId?: string;
	pid?: number;
	pwd?: string;
	status?: string;
	updateAt?: string;
}

export interface ICollaborators {
	userId: string;
	name: string;
}
