import React from 'react';
import { View } from 'react-native';

// import { ActionsButton, CancelEditingButton, ToggleEmojiButton } from './buttons';
import { CancelEditingButton } from './buttons';
import styles from './styles';

interface IMessageBoxLeftButtons {
	// showMessageBoxActions(): void;
	editing: boolean;
	editCancel(): void;
	isActionsEnabled: boolean;
	// showEmojiKeyboard: boolean;
	// openEmoji(): void;
	// closeEmoji(): void;
	// recordAudio: JSX.Element | null;
}

const LeftButtons = React.memo(
	({
		// showMessageBoxActions,
		editing,
		editCancel,
		isActionsEnabled
	}: // showEmojiKeyboard,
	// openEmoji,
	// closeEmoji,
	// recordAudio
	IMessageBoxLeftButtons) => {
		if (editing) {
			return <CancelEditingButton onPress={editCancel} />;
		}
		if (isActionsEnabled) {
			return null;
			// return <ToggleEmojiButton show={showEmojiKeyboard} open={openEmoji} close={closeEmoji} />;
		}
		return <View style={styles.buttonsWhitespace} />;
	}
);

export default LeftButtons;
