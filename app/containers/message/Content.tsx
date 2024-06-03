import React, { useContext, useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { dequal } from 'dequal';
import Touchable from 'react-native-platform-touchable';

import I18n from '../../i18n';
import styles from './styles';
import Markdown, { MarkdownPreview } from '../markdown';
// import User from './User';
import { messageHaveAuthorName, getInfoMessage } from './utils';
import MessageContext from './Context';
import { IMessageContent } from './interfaces';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { MessageTypesValues } from '../../definitions';
import FastModelMsg from './FastModelMsg';
import AnnouncementMsg from '../../views/RoomView/AnnouncementMsg';
import { RECALL_MESSAGES_TABLE } from '../../lib/database/model';
import database from '../../lib/database';

const Content = React.memo(
	(props: IMessageContent) => {
		const { theme } = useTheme();
		const { user, onLinkPress } = useContext(MessageContext);
		const [editContent, setEditContent] = useState('');

		useEffect(() => {
			(async () => {
				const db = database.active;
				const recallMessageCollection = db.get(RECALL_MESSAGES_TABLE);
				const message = await recallMessageCollection.find(props.id);
				if (message?._raw?.msg) {
					setEditContent(message._raw.msg);
				}
			})();
		}, []);
		const timeToDate = (dateOrString: any) => {
			if (dateOrString instanceof Date) {
				// 如果已经是Date对象，直接返回
				return dateOrString.getTime();
			}
			if (typeof dateOrString === 'string') {
				// 尝试将字符串解析为Date对象
				const parsedDate = new Date(dateOrString);
				// 检查解析结果是否是有效日期
				return parsedDate.getTime();
			}
			return new Date().getTime();
		};

		// 添加引文消息类型，同时兼容老版本 fastmodel 消息类型，
		const msgData: any = props.msgData && JSON.parse(props.msgData || '');
		if (msgData?.type === 'fastModelMsg') {
			if (msgData.refs) {
				return <FastModelMsg content={msgData.refs.content} docs={msgData.refs.docs} showRefer={props.showRefer} />;
			}
		}

		if (props.isInfo) {
			// @ts-ignore
			const infoMessage = getInfoMessage({ ...props });

			const renderReedit = (
				<Touchable
					onPress={() => {
						if (props.msg && props.reeditMessage) {
							if (editContent) {
								props.reeditMessage(editContent);
							}
						}
					}}
				>
					<Text style={[styles.textInfo, { color: themes[theme].actionTintColor, marginStart: 5 }]}>{I18n.t('Re_Edit')}</Text>
				</Touchable>
			);

			// const showReedit = msg && msg.length && msg[0].msg;
			const showReeditContent = props.author?._id === user.id;
			const renderMessageContent = (
				<View style={[{ flexDirection: 'row' }]}>
					<Text style={[styles.textInfo, { color: themes[theme].auxiliaryText }]} accessibilityLabel={infoMessage}>
						{infoMessage}
					</Text>
					{showReeditContent && editContent && Date.now() - timeToDate(props.ts) < 1000 * 60 * 3 ? renderReedit : null}
				</View>
			);

			const announcementType =
				props.type.includes('room_created_announcement') || props.type.includes('room_changed_announcement');

			if (announcementType) {
				return <AnnouncementMsg text={props.msg} />;
			}

			if (messageHaveAuthorName(props.type as MessageTypesValues)) {
				return <Text>{renderMessageContent}</Text>;
			}

			return renderMessageContent;
		}

		const isPreview = props.tmid && !props.isThreadRoom;
		let content = null;

		if (props.isEncrypted) {
			content = (
				<Text style={[styles.textInfo, { color: themes[theme].auxiliaryText }]} accessibilityLabel={I18n.t('Encrypted_message')}>
					{I18n.t('Encrypted_message')}
				</Text>
			);
		} else if (isPreview) {
			content = props.msg ? <MarkdownPreview msg={props.msg} /> : null;
		} else {
			content = props.msg ? (
				<Markdown
					msg={props.msg}
					md={props.type !== 'e2e' ? props.md : undefined}
					getCustomEmoji={props.getCustomEmoji}
					enableMessageParser={user.enableMessageParserEarlyAdoption}
					username={user.username}
					channels={props.channels}
					mentions={props.mentions}
					navToRoomInfo={props.navToRoomInfo}
					tmid={props.tmid}
					useRealName={props.useRealName}
					theme={theme}
					onLinkPress={onLinkPress}
					isTranslated={props.isTranslated}
				/>
			) : null;
		}

		if (props.isIgnored) {
			content = <Text style={[styles.textInfo, { color: themes[theme].auxiliaryText }]}>{I18n.t('Message_Ignored')}</Text>;
		}
		const ownMsgStyle = props.author && props.author._id === user.id && styles.msgTextOwn;
		const isTodo = props.appiaTodo && props.appiaTodo?.status === 0;
		return (
			content && (
				<View style={[props.isTemp && styles.temp, styles.msgText, ownMsgStyle, isTodo ? styles.msgTodo : null]}>{content}</View>
			)
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.isTemp !== nextProps.isTemp) {
			return false;
		}
		if (prevProps.msg !== nextProps.msg) {
			return false;
		}
		if (prevProps.type !== nextProps.type) {
			return false;
		}
		if (prevProps.isEncrypted !== nextProps.isEncrypted) {
			return false;
		}
		if (prevProps.isIgnored !== nextProps.isIgnored) {
			return false;
		}
		if (!dequal(prevProps.md, nextProps.md)) {
			return false;
		}
		if (!dequal(prevProps.mentions, nextProps.mentions)) {
			return false;
		}
		if (!dequal(prevProps.channels, nextProps.channels)) {
			return false;
		}
		if (!dequal(prevProps.appiaTodo, nextProps.appiaTodo)) {
			return false;
		}
		return true;
	}
);

Content.displayName = 'MessageContent';

export default Content;
