import React, { useMemo } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';

import ToTop from '../../../containers/Icon/ToTop';
import I18n from '../../../i18n';

type ToUnReadTop = (props: {
	lastUnreadMsgId: string;
	unread: number;
	jumpToMessage: (messageId: string) => void;
	toUnreadTop: any;
	position: any;
}) => any;

const UnReadTop: ToUnReadTop = ({ lastUnreadMsgId, unread, jumpToMessage, toUnreadTop, position }) => {
	const moveRight = useMemo(
		() =>
			position.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 800], // 假设最大移动距离为400，可根据实际情况调整
				extrapolate: 'clamp' // 确保值不会超出输出范围
			}),
		[position]
	);

	return (
		<>
			{Boolean(lastUnreadMsgId && unread >= 10) && (
				<Animated.View
					style={[
						styles.TopPin,
						{
							transform: [{ translateX: moveRight }]
						}
					]}
				>
					<TouchableOpacity
						style={[
							styles.animationView,
							{
								display: 'flex',
								flexDirection: 'row',
								justifyContent: 'center',
								alignItems: 'center'
							}
						]}
						onPress={() => {
							jumpToMessage(lastUnreadMsgId);
							toUnreadTop();
						}}
					>
						<ToTop style={{ height: 14, marginRight: 3, marginBottom: 1 }}></ToTop>
						<Text style={{ height: 22, lineHeight: 22, fontSize: 12, fontWeight: '400', color: '#4E5969', textAlign: 'center' }}>
							{unread}
							{I18n.t('Unread_Message')}
						</Text>
					</TouchableOpacity>
				</Animated.View>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	TopPin: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		position: 'absolute',
		right: 0,
		top: 30,
		zIndex: 999999,
		borderBottomLeftRadius: 20,
		borderTopLeftRadius: 20,

		borderColor: '#CECECE',
		borderWidth: 1
	},
	animationView: {
		display: 'flex',
		flexDirection: 'row'
	}
});

export default React.memo(UnReadTop);
