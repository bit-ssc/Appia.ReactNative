import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import I18n from '../../../i18n';
import EventEmitter from '../../../lib/methods/helpers/events';

const LISTENER_CONNECT_STATUS = 'ConnectStatusText';

/**
 *
 * @param message 要显示的内容
 * @param time 要显示的时长，如果传0则一直显示，单位是毫秒
 * @returns
 */
export const showConnectStatus = (message: string, time: number): void =>
	EventEmitter.emit(LISTENER_CONNECT_STATUS, { message, time });

let statusText: any = null;

const ConnectStatusText: React.FC = () => {
	const [dots, setDots] = useState('...');
	const [intervalTimerId, setIntervalTimerId] = useState<any>(null);
	const [timeOutTimerId, setTimeOutTimerId] = useState<any>(null);
	const [preText, setPreText] = useState('');
	const [text, setText] = useState(I18n.t('Voice_Chat_OnCall_Tip'));

	const getStatusViewRef = (newView: any) => (statusText = newView);

	useEffect(() => {
		const listener = EventEmitter.addEventListener(LISTENER_CONNECT_STATUS, updateStatus);

		const tId = setInterval(() => {
			setDots(prevDots => (prevDots.length < 3 ? `${prevDots}.` : ''));
		}, 800);
		setIntervalTimerId(tId);

		// 返回清理函数
		return () => {
			cleanTimer();
			statusText = null;
			EventEmitter.removeListener(LISTENER_CONNECT_STATUS, listener);
		};
	}, []);

	const cleanTimer = () => {
		if (timeOutTimerId) {
			clearTimeout(timeOutTimerId);
		}
		if (intervalTimerId) {
			clearInterval(intervalTimerId);
		}
	};

	const updateStatus = ({ message, time }: { message: string; time?: number }) => {
		if (statusText && message !== preText) {
			cleanTimer();
			if (time) {
				setDots('');
				setText(message);
				const tId = setTimeout(() => {
					cleanTimer();
					setText(preText);
					const tId2 = setInterval(() => {
						setDots(prevDots => (prevDots.length < 3 ? `${prevDots}.` : ''));
					}, 800);
					setIntervalTimerId(tId2);
				}, time);
				setTimeOutTimerId(tId);
			} else {
				setPreText(text);
				setText(message);
				const tId = setInterval(() => {
					setDots(prevDots => (prevDots.length < 3 ? `${prevDots}.` : ''));
				}, 800);
				setIntervalTimerId(tId);
			}
		}
	};

	return (
		<View style={{ position: 'absolute', bottom: 35, flexDirection: 'column' }} ref={getStatusViewRef}>
			<Text style={{ color: '#C0C0C0' }}>{!intervalTimerId ? text : `${text}      `}</Text>
			<Text style={{ position: 'absolute', right: 0, width: 20, color: '#C0C0C0' }}>{dots}</Text>
		</View>
	);
};

export default ConnectStatusText;
