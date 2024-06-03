import React from 'react';
import { View, TouchableOpacity } from 'react-native';

import { isIOS } from '../../../lib/methods';
import { CloseChat, AcceptChat } from './Icon';

const UnConnectedView: React.FC<{ onRejectPress: () => void; onAcceptPress: () => void }> = ({
	onRejectPress,
	onAcceptPress
}) => {
	const rejectPress = () => {
		if (onRejectPress) {
			onRejectPress();
		}
	};

	const acceptPress = () => {
		if (onAcceptPress) {
			onAcceptPress();
		}
	};

	return (
		<View
			style={{
				backgroundColor: 'black',
				width: '100%',
				height: isIOS ? 100 + 20 : 100,
				flexDirection: 'row',
				justifyContent: 'flex-start',
				paddingHorizontal: 10
			}}
		>
			<View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 7, flex: 1 }}>
				<TouchableOpacity onPress={() => rejectPress()}>
					<CloseChat />
				</TouchableOpacity>
			</View>
			<View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 7, flex: 1 }}>
				<TouchableOpacity onPress={() => acceptPress()}>
					<AcceptChat />
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default UnConnectedView;
