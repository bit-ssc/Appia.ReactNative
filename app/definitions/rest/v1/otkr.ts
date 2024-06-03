export interface ITab {
	label: string;
	key: string;
}

export type Otkr = {
	'otkr.date': {
		GET: (params: { username: string }) => {
			data: ITab[];
		};
	};
	'otkr.query': {
		GET: (params: { username: string; time: string }) => any;
	};
};
