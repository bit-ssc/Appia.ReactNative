import { store } from '../store/auxStore';

export const request = async (url: string, options?: any) => {
	const { server } = store.getState().server;
	const { user } = store.getState().login;
	const { method = 'GET' } = options || {};
	const headers = {
		'Content-Type': 'application/json',
		...options?.headers
	} as Record<string, string>;

	if (user.token) {
		headers['X-Auth-Token'] = user.token;
	}

	if (user.id) {
		headers['X-User-Id'] = user.id;
	}

	const r = await fetch(`${server}${url}`, {
		...options,
		method,
		headers
	});

	const res = await r.json();

	return res.data;
};
