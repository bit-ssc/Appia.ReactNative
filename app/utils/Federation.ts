import { store } from '../lib/store/auxStore';
import { IDepartment } from '../definitions';

const directors = ['deputyCadre', 'officialCadre', 'sponsor'];

export const isDirector = (username?: string): boolean => {
	if (!username) return false;
	const { departmentMap } = store.getState().contacts;
	const keys = Object.keys(departmentMap);
	console.info(departmentMap);
	return keys.some(item => {
		if (!item.toLowerCase().startsWith('pdt')) {
			return directors.some(director => {
				const department = departmentMap[item] as unknown as IDepartment;
				// @ts-ignore
				return department[director].indexOf(username) >= 0;
			});
		}
		return false;
	});
};

export const APPIA_TAG = {
	external: 1 // 外部tag
}

export const hasShowTagPermission = (code: number | undefined, permission: number): boolean => ((code || 0) & permission) === permission;

