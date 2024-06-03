import React, { useContext } from 'react';
import { View, Pressable } from 'react-native';

import Navigation from '../../../../lib/navigation/appNavigation';
import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useTheme } from '../../../../theme';
import MessageContext from '../../Context';

const handleReadReceipt = (msgId: string, rid: string, roomType: string, userId: string) => {
	if (roomType !== 'd') {
		Navigation.navigate('ReadReceiptsView', { messageId: msgId, rid, roomType, userId });
	}
};

const ReadReceipt = React.memo(
	({
		isReadReceiptEnabled,
		unread,
		author,
		msgId,
		rid
	}: {
		isReadReceiptEnabled?: boolean;
		unread: boolean;
		author: any;
		msgId: string;
		rid: string;
	}) => {
		const { colors } = useTheme();
		const { user, roomType } = useContext(MessageContext);

		// if (!isReadReceiptEnabled || roomType !== 'd' || author?._id !== user.id) {
		if (!isReadReceiptEnabled || author?._id !== user.id) {
			return null;
		}

		if (!unread && unread !== null) {
			return (
				<View style={[styles.readReceipt, { borderColor: colors.auxiliaryText }]}>
					<CustomIcon name='check' color={colors.auxiliaryText} size={12} />
				</View>
			);
		}

		return (
			<Pressable onPress={() => handleReadReceipt(msgId, rid, roomType, user.id)}>
				<View style={{ height: 40, width: '100%', justifyContent: 'flex-end' }}>
					<View style={[styles.readReceipt, { borderColor: colors.buttonBackground }]} />
				</View>
			</Pressable>
		);
	}
);
ReadReceipt.displayName = 'MessageReadReceipt';

export default ReadReceipt;
