import React from 'react';
import { dequal } from 'dequal';
import { View } from 'react-native';

import I18n from '../../i18n';
import styles from './styles';
import { MarkdownPreview } from '../markdown';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/constants';
import { ILastMessageProps } from './interfaces';
import { useTheme } from '../../theme';
import { normalizeMentions } from '../../lib/methods/helpers/normalizeMessage';
import { isIOS } from '../../lib/methods/helpers';

const formatMsg = ({ lastMessage, type, showLastMessage, username, useRealName, draftMessage }: Partial<ILastMessageProps>) => {
	if (draftMessage) {
		return draftMessage;
	}

	if (!showLastMessage) {
		return '';
	}
	if (!lastMessage || !lastMessage.u || lastMessage.pinned) {
		return I18n.t('No_Message');
	}
	if (lastMessage.t === 'jitsi_call_started') {
		const { u } = lastMessage;
		return I18n.t('Started_call', { userBy: u.username });
	}

	let prefix = '';
	const isLastMessageSentByMe = lastMessage.u.username === username;

	// 重新格式化一下提醒消息
	lastMessage = normalizeMentions(lastMessage);

	const user = isLastMessageSentByMe ? '' : `${lastMessage.u.name}：` || `${lastMessage.u.username}：`;
	if (!lastMessage.msg && lastMessage.attachments && Object.keys(lastMessage.attachments).length) {
		return I18n.t('User_sent_an_attachment', { user, fileType: lastMessage.attachments[0].image_url ? '图片' : '文件' });
	}

	if (lastMessage.msgType === 'docCloud') {
		return I18n.t('User_sent_an_attachment', { user, fileType: lastMessage.msg });
	}

	if (lastMessage.msgType === 'oncall') {
		return `[${I18n.t('Voice_call')}]`;
	}

	if (lastMessage.msgType === 'meeting_room') {
		return lastMessage.msg;
	}

	// Encrypted message pending decrypt
	if (lastMessage.t === E2E_MESSAGE_TYPE && lastMessage.e2e !== E2E_STATUS.DONE) {
		lastMessage.msg = I18n.t('Encrypted_message');
	}

	if (isLastMessageSentByMe) {
		prefix = type === 'd' ? '' : I18n.t('You_colon');
	} else {
		const {
			u: { name }
		} = lastMessage;
		prefix = `${useRealName ? name : lastMessage.u.username}: `;
	}

	if (lastMessage.msgType === 'forwardMergeMessage') {
		return `${prefix}[${I18n.t('Chat_record')}]`;
	}

	return `${prefix}${lastMessage.msg}`;
};

const arePropsEqual = (oldProps: any, newProps: any) => dequal(oldProps, newProps);

const LastMessage = React.memo(
	({ lastMessage, type, showLastMessage, username, alert, useRealName, draftMessage, hideUnreadStatus }: ILastMessageProps) => {
		const { colors } = useTheme();
		return (
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					flexShrink: 1,
					marginTop: isIOS ? 0 : 1.8,
					flex: hideUnreadStatus ? 0 : 1
				}}
			>
				<MarkdownPreview
					msg={formatMsg({
						lastMessage,
						type,
						showLastMessage,
						username,
						useRealName,
						draftMessage
					})}
					style={[styles.markdownText, { color: alert ? colors.bodyText : colors.auxiliaryText }]}
					numberOfLines={1}
					testID='room-item-last-message'
				/>
			</View>
		);
	},
	arePropsEqual
);

export default LastMessage;
