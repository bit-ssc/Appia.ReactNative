import { Text, TouchableOpacity } from 'react-native';
import React from 'react';

import { TSubscriptionModel } from '../../../definitions';

const ToDoFooterView: React.FC<{
	item: TSubscriptionModel;
	onPress: (item: TSubscriptionModel) => void;
}> = ({ item, onPress }) => (
	<TouchableOpacity
		style={{
			height: 26,
			width: '100%',
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 15,
			marginTop: 10
		}}
		onPress={() => {
			onPress && onPress(item);
		}}
	>
		<Text style={{ marginLeft: 5, fontSize: 14, color: '#1B5BFF' }}>{item.isHeadClose ? '查看全部' : '收起'}</Text>
	</TouchableOpacity>
);

export default ToDoFooterView;
