import { useMemo } from 'react';
import moment from 'moment';

//  lastMsg  search  todo chat 四个涉及时间的地方
const useMoment = (date: string | Date | undefined, type = ''): string =>
	useMemo(() => {
		const givenTime = moment(date);

		// 获取当前时间的moment对象
		const currentTime = moment();

		const timezoneOffset = currentTime.utcOffset() / 60;
		const timezoneString = timezoneOffset >= 0 ? `(UTC+${timezoneOffset})` : `(UTC${timezoneOffset})`;

		// 计算时间差
		const daysDiff = currentTime.diff(givenTime, 'days');
		const isSameDay = currentTime.isSame(givenTime, 'day');
		let formattedTime = '';

		// 如果是待办列表的时间 直接返回完整格式
		if (type === 'todo' || type === 'search') {
			// 格式化时间
			formattedTime = givenTime.format('YYYY/MM/DD HH:mm');
			return `${formattedTime} ${timezoneString}`;
		}
		// 处理 lastmessage

		if (type === 'lastmessage') {
			if (isSameDay) {
				return givenTime.format('HH:mm');
			}

			if (daysDiff < 7) {
				return givenTime.format('MM/DD');
			}
			// 对于一周之外的日期，返回具体的日期
			return givenTime.format('YYYY/MM/DD');
		}

		// 默认处理时间
		if (daysDiff < 7) {
			// 格式化时间
			formattedTime = givenTime.format('MM/DD HH:mm');
		} else {
			// 格式化时间
			formattedTime = givenTime.format('YYYY/MM/DD HH:mm');
		}

		// 输出结果
		return `${formattedTime} ${timezoneString}`;
	}, [date]);

export default useMoment;
