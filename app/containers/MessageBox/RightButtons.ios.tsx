import React from 'react';
import { View } from 'react-native';

import { ActionsButton, SendButton } from './buttons';

interface IMessageBoxRightButtons {
	showSend: boolean;
	submit(): void;
	showMessageBoxActions(): void;
	isActionsEnabled: boolean;
	isBot?: boolean;
	answering?: boolean;
}

const RightButtons = ({
	showSend,
	submit,
	isActionsEnabled,
	showMessageBoxActions,
	isBot,
	answering
}: IMessageBoxRightButtons) => {
	if (showSend || isBot) {
		return (
			<View style={{ flexDirection: 'row' }}>
				{isActionsEnabled && <ActionsButton onPress={showMessageBoxActions} />}
				<SendButton onPress={submit} answering={answering} />
			</View>
		);
	}

	if (isActionsEnabled) {
		return <ActionsButton onPress={showMessageBoxActions} />;
	}

	return null;
};

export default RightButtons;
