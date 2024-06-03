import store from '../../lib/store';
import { IApplicationState } from '../../definitions/redux/index';

const { settings, login } = store.getState() as IApplicationState;
const { user } = login;
// const shimoServer = settings.Shimo_Api_Url || 'https://shimo-server-qa.sophmain.vip';
const shimoServer = 'https://shimo-server-qa.sophmain.vip';
const org = (settings.Enterprise_ID || 'bitmain') as string;

// 获取文件及文件夹列表
export const requestFileCloud = async (page: number, folderId = '', orgScope = ''): Promise<any> => {
	const { user } = (store.getState() as IApplicationState).login;
	const { cloudDisk } = store.getState() as IApplicationState;
	const headers = {
		'a-doc-source': 'appia',
		'a-doc-token': cloudDisk.docToken || '',
		'Content-Type': 'application/json',
		'a-doc-username': user.id || '',
		'a-doc-org': org
	};

	const result = await fetch(
		`${shimoServer}/api/v1/front/file/cloud/list/page?page=${page}&size=20&folderId=${folderId}&orgScope=${orgScope}`,
		{
			method: 'GET',
			headers
			// body: JSON.stringify({ folderId, orgScope })
		}
	)
		.then(response => {
			if (response.ok) {
				return response.json();
			}
			return Promise.reject(new Error(''));
		})
		.catch(e => {
			console.info('err', e);
		});
	console.info('获取文件及文件夹列表');
	return result.data;
};

export const getDocToken = async (): Promise<any> => {
	const result = await fetch(`${shimoServer}/api/v1/auth/token?userId=${user.id}&token=${user.token}&source=appia&org=${org}`, {
		method: 'GET'
		// body: JSON.stringify({
		// 	userId: user.id,
		// 	token: user.token,
		// 	source: 'appia',
		// 	org
		// })
	})
		.then(response => {
			console.info('response', response);
			if (response.ok) {
				return response.json();
			}
			return Promise.reject(new Error(''));
		})
		.catch(e => {
			console.info('error', e);
		});
	const docToken = result.data.token;
	return docToken;
};
