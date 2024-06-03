import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

const ConnectTimeView: React.FC = () => {
	const [secondsElapsed, setSecondsElapsed] = useState(0);
	useEffect(() => {
		// 创建计时器
		const timerId = setInterval(() => {
			setSecondsElapsed(secondsElapsed => secondsElapsed + 1);
		}, 1000);

		// 返回清理函数
		return () => {
			clearInterval(timerId);
		};
	}, [secondsElapsed]);

	const formatTime = () => {
		const minutes = Math.floor(secondsElapsed / 60);
		const seconds = secondsElapsed % 60;

		const formattedMinutes = minutes.toString().padStart(minutes >= 100 ? 3 : 2, '0');
		const formattedSeconds = seconds.toString().padStart(2, '0');

		return `${formattedMinutes}:${formattedSeconds}`;
	};

	return (
		<View
			style={{
				width: '80%',
				height: 40,
				position: 'relative',
				justifyContent: 'center',
				alignItems: 'center',
				marginLeft: 0
			}}
		>
			<Text style={{ color: 'white', width: '60%', textAlign: 'center' }}>{formatTime()}</Text>
		</View>
	);
};

export default ConnectTimeView;
