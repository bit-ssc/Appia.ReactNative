export type CloudDocEndpoint = {
	'doc.sendFileMsg': {
		POST: (params: { fileIds: string[]; rid: string }) => {};
	};
	'doc.openInCloud': {
		POST: (params: { titleLink: string; title: string }) => {};
	};
};
