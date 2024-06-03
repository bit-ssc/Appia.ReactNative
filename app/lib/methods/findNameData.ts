import { MarkdownAST } from '@rocket.chat/message-parser';

export const findNameData = (item: MarkdownAST, t_name: string): string => {
	// 打印函数和缓存name
	let res_t_name = '';
	// 如果 md 不存在直接返回t_name
	if (!item) return t_name;
	const fnc = (fnc_item: object) => {
		// 是对象
		if (Object.prototype.toString.call(fnc_item) === '[object Object]') {
			// 如果没有这个属性直接直接返回此分支的寻找
			if (!('value' in fnc_item)) {
				return;
			}
			if (typeof fnc_item.value === 'object' && fnc_item.value !== null) {
				//  如果 value 不是字符串 继续寻找正确的参数
				fnc(fnc_item.value);
				return;
			}
			// 找到正确的名字
			if ('type' in fnc_item && fnc_item.type === 'PLAIN_TEXT') {
				// 上一个 if 已经排除了 object类型
				res_t_name = fnc_item.value as string;
				return;
			}
			fnc(fnc_item);
		}
		// 是数组
		if (Object.prototype.toString.call(fnc_item) === '[object Array]') {
			// 是数组继续循环找正确的参数
			(fnc_item as []).forEach(value => {
				fnc(value);
			});
		}
	};
	fnc(item);
	return res_t_name;
};
