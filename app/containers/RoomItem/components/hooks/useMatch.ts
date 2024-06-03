import { useCallback } from 'react';

const subArr = (
	arr: number[][],
	preLen: number,
	msg: string
): {
	type: boolean;
	value: string;
}[] => {
	let i = 0;
	let j = 0;

	// 数字类型数组转化为 根据type判断是否为匹配字段的渲染数组

	const renderArr = arr.map(item => ({
		type: true,
		value: item
	}));

	// 补充 首部和末尾 以及多个匹配字段的中间部分补全,并根据arr去跟新renderArr

	if (arr[0][0] !== 0) {
		renderArr.unshift({ type: false, value: [0, arr[0][0]] });
		arr.unshift([0, arr[0][0]]);
	}

	if (arr[arr.length - 1][1] !== preLen) {
		renderArr.push({ type: false, value: [arr[arr.length - 1][1], preLen] });
		arr.push([arr[arr.length - 1][1], preLen]);
	}

	// 结束条件为解析倒数第二位
	while (i < renderArr[renderArr.length - 1].value[0]) {
		const pre = renderArr[j].value[1];
		const next = renderArr[j + 1].value[0];
		if (pre < next) {
			renderArr.splice(j + 1, 0, { type: false, value: [pre, next] });
		}
		j++;
		i = renderArr[j].value[1];
	}
	// 对应下标转化为文字
	return renderArr.map(({ value: [pre, next], type }) => ({ type, value: msg.substring(pre, next) }));
};

const useMatch = () =>
	useCallback((msg: string, searchKey: string) => {
		// 切割好的部分数组
		const msgArr: string[] = msg.split('');
		const searchKeyArr = searchKey.split('');
		const resArr: number[][] = [];
		const len: number = msg.length;

		// 双指针 找到正确的匹配字段位置
		let i = 0;
		let j = 0;
		let m = 0;
		for (; i < msgArr.length; i++) {
			// 匹配到第字符相等进入第二循环
			if (msgArr[i] === searchKeyArr[j]) {
				m = i;
				for (; j < searchKeyArr.length; j++) {
					if (msgArr[i + j] !== searchKeyArr[j]) {
						j = 0;
						// 如果字符不相等 跳出循环
						break;
					}
				}
				// 匹配完全相等 将需要传出
				if (j) {
					resArr.push([m, m + j]);
					j = 0;
				}
			}
		}
		// 传入下一个函数  构建渲染数组

		return resArr.length ? subArr(resArr, len, msg) : [{ type: false, value: msg }];
	}, []);

export default useMatch;
