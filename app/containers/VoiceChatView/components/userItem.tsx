import { StyleSheet, View, Text } from 'react-native';
import React, { useEffect, useState } from 'react';

import Avatar from '../../Avatar';
import { IVCUser } from '../../../definitions/IVChat';

const UserItem: React.FC<{ item: IVCUser; size: number; isShowName: boolean }> = ({ item, size, isShowName }) => {
	const isConnect = item.status === 'in';

	const [secondsElapsed, setSecondsElapsed] = useState(0);
	useEffect(() => {
		// 创建计时器
		let timerId: any;
		if (!isConnect) {
			timerId = setInterval(() => {
				setSecondsElapsed(secondsElapsed => secondsElapsed + 1);
			}, 300);
		} else {
			timerId && clearInterval(timerId);
		}

		// 返回清理函数
		return () => {
			timerId && clearInterval(timerId);
		};
	}, [secondsElapsed, isConnect]);

	const contentView = () => (
		<>
			{!isConnect && (
				<View style={styles.avatar}>
					<View style={[styles.loading, { opacity: secondsElapsed % 4 === 0 ? 1 : 0.7 }]}></View>
					<View style={[styles.loading, { opacity: secondsElapsed % 4 === 1 ? 1 : 0.7, marginHorizontal: 7 }]}></View>
					<View style={[styles.loading, { opacity: secondsElapsed % 4 === 2 ? 1 : 0.7 }]}></View>
				</View>
			)}
			{isShowName && (
				<View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						backgroundColor: 'black',
						opacity: 0.6,
						borderBottomRightRadius: 5,
						maxWidth: '100%'
					}}
				>
					<Text style={{ fontSize: 10, color: 'white', paddingHorizontal: 5, paddingVertical: 2 }}>{item.name}</Text>
				</View>
			)}
		</>
	);

	return (
		<View style={{ width: size, height: size, padding: 5 }}>
			<Avatar text={item.username} size={size - 10} borderRadius={10}>
				{contentView()}
			</Avatar>
		</View>
	);
};

export default UserItem;

const styles = StyleSheet.create({
	avatar: {
		width: '100%',
		height: '100%',
		backgroundColor: 'black',
		opacity: 0.6,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		flex: 1,
		zIndex: 1,
		position: 'absolute'
	},
	loading: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: 'white'
	}
});
