import I18n from '../../i18n';

export interface IAreaCode {
	label: string;
	areaCode: string;
	code: string;
}
export const getAreaCode = async (server: string): Promise<IAreaCode[]> => {
	const r = await fetch(`${server}/api/v1/getAreaCode?locale=${I18n.locale}`);
	const res = await r.json();
	return res.data;
};

export interface ISendCodeParams {
	phone: string;
	areaCode: string;
	ic: unknown;
}
export const sendCode = (server: string, params: ISendCodeParams): Promise<{ success: boolean }> =>
	fetch(`${server}/api/v1/login.sendCode`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(params)
	}).then(res => res.json());

export const getWorkspace = async (server: string) => {
	const r = await fetch(`${server}/appia_be/v1/api/worktable_config?platform=app`);
	const res = await r.json();
	return res.data;
};
