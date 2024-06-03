//  后端传入的时间格式为 2024-02-08 18:30:00 转化为 2024年02月08日 18: 30

import { useCallback, useMemo } from 'react';

const useTimeToHHMMSS: any = () => {
	const timeMap: string[] = useMemo(() => ['年', '月', '日'], []);

	const changeTime = useCallback(
		(time: string) => {
			// 以中间空格为分 将 类似 2024-02-08 18:30:00 的时间分为两个部分并且分别处理
			const [bigTime, smallTime] = time.split(' ') as string[];
			let newBigTime = '';
			let newSmallTime = '';

			// 处理小块时间
			newSmallTime = smallTime.split(':').slice(0, 2).join(':');

			// 处理大块时间
			const bigTimeArr = bigTime.split('-');
			bigTimeArr.forEach((item, index) => (newBigTime += item + timeMap[index]));

			return `${newBigTime} ${newSmallTime}`;
		},
		[timeMap]
	);
	return { changeTime };
};

export default useTimeToHHMMSS;
