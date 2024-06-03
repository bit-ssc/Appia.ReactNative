import React, { useContext } from 'react';
import { View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { useSelector } from 'react-redux';

import MessageContext from './Context';
import User from './User';
import styles from './styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Content from './Content';
import { themes } from '../../lib/constants';
import { IMessage, IMessageTouchable } from './interfaces';
import { useTheme } from '../../theme';
import RightIcons from './Components/RightIcons';
import { CustomIcon } from '../CustomIcon';
import Appia from './Appia';
import { MessageInner } from './MessageInner';
import VoiceChatTextView from './VoiceChatTextView';
import { IMsgData } from './Appia/VoiceChatMsg';
import { resendFile } from '../../lib/methods/sendFileMessage';

const Message = React.memo((props: IMessage) => {
	const headerStyle = { marginTop: props.isHeader ? 12 : 0 };
	const { theme, colors } = useTheme();
	const multiSelect = useSelector(state => state.app.messageMultiSelect);
	const selectedList = useSelector(state => state.app.selectedMessageIds);

	if (props.msgType && props.msgType === 'oncall' && props.msgData) {
		const msgData = JSON.parse(props.msgData) as IMsgData;

		if (msgData.roomType === 'p' || msgData.roomType === 'c') {
			return <VoiceChatTextView callMsg={msgData} authorName={props.author?.name} />;
		}
	}

	const isAnnouncementMsg = () => ['room_created_announcement', 'room_changed_announcement'].includes(props.type);
	if (props.isThreadReply || props.isThreadSequential || props.isIgnored || (props.isInfo && !isAnnouncementMsg())) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		return (
			<View style={[styles.container, props.style, headerStyle]}>
				{thread}
				<View style={styles.flex}>
					<MessageAvatar small {...props} />
					<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
						<Content {...props} />
					</View>
				</View>
			</View>
		);
	}

	if (props.isInfo && isAnnouncementMsg() && !props.msg) {
		return <></>;
	}

	const checked = selectedList.includes(props.id);
	let isUpload = false;
	if (props.attachments && props.attachments.length > 0) {
		const attachment = props.attachments[0];
		if (attachment.isUpload) {
			isUpload = true;
		}
	}

	const checkbox = () => (
		<>
			{multiSelect && !props.msgType && !isAnnouncementMsg() && (
				<View style={[styles.checkboxArea, { paddingTop: props.isHeader ? 36 : 16 }]}>
					<CustomIcon
						name={checked ? 'checkbox-checked' : 'checkbox-unchecked'}
						color={checked ? colors.actionTintColor : themes[theme].auxiliaryText}
						size={20}
					/>
				</View>
			)}
			{multiSelect && props.msgType && (
				<CustomIcon
					style={{ opacity: 0.4, paddingTop: props.isHeader ? 36 : 16, paddingRight: 6 }}
					name={checked ? 'checkbox-checked' : 'checkbox-unchecked'}
					color={checked ? colors.actionTintColor : themes[theme].auxiliaryText}
					size={20}
				/>
			)}
		</>
	);

	return (
		<View style={[styles.container, props.style, headerStyle]}>
			<View style={[styles.flex, { flexWrap: 'wrap' }]}>
				{!isUpload && checkbox()}
				<MessageAvatar {...props} />
				<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
					<User {...props} />
					<View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
						<View style={[styles.messageContainer]}>{props.msgType ? <Appia {...props} /> : <MessageInner {...props} />}</View>
						<RightIcons
							type={props.type}
							msg={props.msg}
							msgId={props.id}
							rid={props.rid}
							isEdited={props.isEdited}
							author={props.author}
							hasError={props.hasError}
							isReadReceiptEnabled={props.isReadReceiptEnabled || false}
							unread={props.unread || false}
							attachments={props.attachments}
							resendPress={(token, msgId) => {
								resendFile(props.rid, token, msgId, props.attachments, props.author);
							}}
						/>
					</View>
				</View>
			</View>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & IMessage) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { theme } = useTheme();

	if (props.hasError) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}

	return (
		<Touchable
			onLongPress={onLongPress}
			onPress={onPress}
			// onPressIn={onPressIn}
			disabled={
				(props.isInfo && !props.isThreadReply) ||
				props.archived ||
				props.isTemp ||
				props.type === 'jitsi_call_started' ||
				props.msgType === 'oncall'
			}
			style={{ backgroundColor: props.highlighted ? themes[theme].headerBackground : undefined }}
		>
			<View>
				<Message {...props} />
			</View>
		</Touchable>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
