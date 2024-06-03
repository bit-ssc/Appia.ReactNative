export interface Attachment {
	ts: string;
	title_link: string;
	title: string;
	image_url: string;
	title_link_download: string;
	format: string;
	type: string;
}

export interface ITodo {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	status: number;
	mid: string;
	tips?: string;
	attachments?: Attachment[];
	type: string;
}
