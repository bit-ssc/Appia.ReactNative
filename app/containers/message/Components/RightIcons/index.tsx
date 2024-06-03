import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import Encrypted from './Encrypted';
import Edited from './Edited';
import MessageError from './MessageError';
import ReadReceipt from './ReadReceipt';
import UploadFile from './UploadFile';
import { MessageType, IAttachment } from '../../../../definitions';
import MessageContext from '../../Context';

const styles = StyleSheet.create({
	actionIcons: {
		flexDirection: 'row',
		alignSelf: 'flex-end'
	}
});

interface IRightIcons {
	type: MessageType;
	msg?: string;
	msgId: string;
	rid: string;
	isEdited: boolean;
	isReadReceiptEnabled?: boolean;
	unread: boolean;
	hasError: boolean;
	author: any;
	attachments?: IAttachment[];
	resendPress: (token: string, msgId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const RightIcons = ({
	type,
	msg,
	msgId,
	rid,
	isEdited,
	hasError,
	isReadReceiptEnabled,
	unread,
	author,
	attachments,
	resendPress
}: IRightIcons) => {
	let isShowFileProgress = false;
	const { user } = useContext(MessageContext);
	if (attachments && attachments.length > 0) {
		const a = attachments[0];
		if (a.isUpload) {
			isShowFileProgress = true;
		}
	}

	if (isShowFileProgress) {
		return (
			<UploadFile
				attachments={attachments}
				resendPress={() => {
					resendPress(user.token, msgId);
				}}
			/>
		);
	}

	if (hasError) {
		return (
			<View style={styles.actionIcons}>
				<Encrypted type={type} />
				<Edited testID={`${msg}-edited`} isEdited={isEdited} />
				<MessageError hasError={hasError} />
			</View>
		);
	}

	return (
		<View style={styles.actionIcons}>
			<Encrypted type={type} />
			<Edited testID={`${msg}-edited`} isEdited={isEdited} />
			<ReadReceipt isReadReceiptEnabled={isReadReceiptEnabled} msgId={msgId} rid={rid} author={author} unread={unread} />
		</View>
	);
};

export default RightIcons;
