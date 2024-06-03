import React from 'react';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import BaseButton from './BaseButton';

interface ISendButton {
	onPress(): void;
	answering?: boolean;
}

const SendButton = ({ onPress, answering }: ISendButton) => {
	const { theme } = useTheme();
	return (
		<BaseButton
			onPress={onPress}
			testID='messagebox-send-message'
			accessibilityLabel='Send_message'
			icon='send-filled'
			color={answering ? themes[theme].auxiliaryText : themes[theme].tintColor}
			answering={answering}
		/>
	);
};

export default SendButton;
