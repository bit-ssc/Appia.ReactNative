import React from 'react';

import { CancelEditingButton } from './buttons';

interface IMessageBoxLeftButtons {
	// 	showEmojiKeyboard: boolean;
	// 	openEmoji(): void;
	// 	closeEmoji(): void;
	editing: boolean;
	editCancel(): void;
}

const LeftButtons = React.memo(({ editing, editCancel }: IMessageBoxLeftButtons) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} />;
	}
	// 	return <ToggleEmojiButton show={showEmojiKeyboard} open={openEmoji} close={closeEmoji} />;
	return null;
});

export default LeftButtons;
