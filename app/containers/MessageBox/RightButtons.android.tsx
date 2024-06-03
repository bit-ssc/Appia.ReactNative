import React from 'react';
import { View } from 'react-native';

import { ActionsButton, SendButton } from './buttons';
import styles from './styles';

interface IMessageBoxRightButtons {
	showSend: boolean;
	submit(): void;
	showMessageBoxActions(): void;
	isActionsEnabled: boolean;
	isBot?: boolean;
	answering?: boolean;
}

const RightButtons = React.memo(
	({ showSend, submit, showMessageBoxActions, isActionsEnabled, isBot, answering }: IMessageBoxRightButtons) => {
		if (showSend || isBot) {
			return (
				<View style={{ flexDirection: 'row' }}>
					<ActionsButton onPress={showMessageBoxActions} />
					<SendButton onPress={submit} answering={answering} />
				</View>
			);
		}
		if (isActionsEnabled) {
			return <ActionsButton onPress={showMessageBoxActions} />;
		}
		return <View style={styles.buttonsWhitespace} />;
	}
);

export default RightButtons;
