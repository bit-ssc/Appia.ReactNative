import React, { forwardRef, useImperativeHandle } from 'react';
// import { Alert, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { connect } from 'react-redux';
import moment from 'moment';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../../lib/database';
import I18n from '../../i18n';
import log, { logEvent } from '../../lib/methods/helpers/log';
import { getMessageTranslation } from '../message/utils';
import { LISTENER } from '../Toast';
import EventEmitter from '../../lib/methods/helpers/events';
import { TActionSheetOptionsItem, useActionSheet, ACTION_SHEET_ANIMATION_DURATION } from '../ActionSheet';
import { IHeader } from './Header';
import events from '../../lib/methods/helpers/log/events';
import { IApplicationState, IEmoji, ILoggedUser, TAnyMessageModel, TSubscriptionModel } from '../../definitions';
// import { getPermalinkMessage } from '../../lib/methods';
import { hasPermission } from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { ForwardIcon, TodoFinished, TodoSet } from '../SvgIcons';
import { RECALL_MESSAGES_TABLE } from '../../lib/database/model';
import { APPIA_TAG, hasShowTagPermission } from '../../utils/Federation';

export interface IMessageActionsProps {
	room: TSubscriptionModel;
	tmid?: string;
	user: Pick<ILoggedUser, 'id'>;
	editInit: (message: TAnyMessageModel) => void;
	reactionInit: (message: TAnyMessageModel) => void;
	onReactionPress: (shortname: IEmoji, messageId: string) => void;
	replyInit: (message: TAnyMessageModel, mention: boolean) => void;
	onDeleteMsgId: (messageId: string) => void;
	forwardInit: (messageId: string) => void;
	multiSelectInit: (messageId: string, oneByOne?: boolean) => void;
	createDiscussion: ({ message, channel }: { message: TAnyMessageModel; channel: TSubscriptionModel }) => void;
	handleToggleTodo: (message: TAnyMessageModel, type: string) => void; // type: d(default),h(high)
	isMasterDetail: boolean;
	isReadOnly: boolean;
	Message_AllowDeleting?: boolean;
	Message_AllowDeleting_BlockDeleteInMinutes?: number;
	Message_AllowEditing?: boolean;
	Message_AllowEditing_BlockEditInMinutes?: number;
	Message_AllowPinning?: boolean;
	Message_AllowStarring?: boolean;
	Appia_Message_Read_Receipt_Store_Users?: boolean;
	editMessagePermission?: string[];
	deleteMessagePermission?: string[];
	forceDeleteMessagePermission?: string[];
	deleteOwnMessagePermission?: string[];
	pinMessagePermission?: string[];
	createDirectMessagePermission?: string[];
	isManager?: boolean;
}

export interface IMessageActions {
	showMessageActions: (message: TAnyMessageModel) => Promise<void>;
}

const MessageActions = React.memo(
	forwardRef<IMessageActions, IMessageActionsProps>(
		(
			{
				room,
				tmid,
				user,
				// editInit,
				reactionInit,
				onReactionPress,
				replyInit,
				forwardInit,
				multiSelectInit,
				createDiscussion,
				handleToggleTodo,
				isReadOnly,
				Message_AllowDeleting,
				Message_AllowDeleting_BlockDeleteInMinutes,
				// Message_AllowEditing,
				// Message_AllowEditing_BlockEditInMinutes,
				// Message_AllowPinning,
				// Message_AllowStarring,
				// Appia_Message_Read_Receipt_Store_Users,
				// isMasterDetail,
				editMessagePermission,
				deleteMessagePermission,
				forceDeleteMessagePermission,
				deleteOwnMessagePermission,
				pinMessagePermission,
				// createDirectMessagePermission,
				isManager
			},
			ref
		) => {
			let permissions = {
				hasEditPermission: false,
				hasDeletePermission: false,
				hasForceDeletePermission: false,
				hasPinPermission: false,
				hasDeleteOwnPermission: false
			};
			const { showActionSheet, hideActionSheet } = useActionSheet();

			const getPermissions = async () => {
				try {
					const permission = [
						editMessagePermission,
						deleteMessagePermission,
						forceDeleteMessagePermission,
						pinMessagePermission,
						deleteOwnMessagePermission
					];
					const result = await hasPermission(permission, room.rid);
					permissions = {
						hasEditPermission: result[0],
						hasDeletePermission: result[1],
						hasForceDeletePermission: result[2],
						hasPinPermission: result[3],
						hasDeleteOwnPermission: result[4]
					};
				} catch {
					// Do nothing
				}
			};

			const isOwn = (message: TAnyMessageModel) => message.u && message.u._id === user.id;

			const allowDelete = (message: TAnyMessageModel) => {
				if (isReadOnly) {
					return false;
				}

				// Prevent from deleting thread start message when positioned inside the thread
				if (tmid === message.id) {
					return false;
				}

				if (isManager && hasShowTagPermission(room.showAppiaTag, APPIA_TAG.external)) {
					return !message.u.username?.includes(':');
				}

				const deleteOwn = isOwn(message) && permissions.hasDeleteOwnPermission;
				if (!(permissions.hasDeletePermission || (Message_AllowDeleting && deleteOwn) || permissions.hasForceDeletePermission)) {
					return false;
				}
				if (permissions.hasForceDeletePermission) {
					return true;
				}
				const blockDeleteInMinutes = Message_AllowDeleting_BlockDeleteInMinutes;
				if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
					let msgTs;
					if (message.ts != null) {
						msgTs = moment(message.ts);
					}
					let currentTsDiff = 0;
					if (msgTs != null) {
						currentTsDiff = moment().diff(msgTs, 'minutes');
					}
					return currentTsDiff < blockDeleteInMinutes;
				}
				return true;
			};

			const handleCreateDiscussion = (message: TAnyMessageModel) => {
				logEvent(events.ROOM_MSG_ACTION_DISCUSSION);
				const params = { message, channel: room };
				createDiscussion(params);
			};

			const handleCopy = async (message: TAnyMessageModel) => {
				logEvent(events.ROOM_MSG_ACTION_COPY);
				await Clipboard.setString((message?.attachments?.[0]?.description || message.msg) ?? '');
				EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
			};

			const handleForward = (message: TAnyMessageModel) => {
				logEvent(events.ROOM_MSG_ACTION_FORWARD);
				forwardInit(message.id);
			};

			const handleMultiSelect = (message: TAnyMessageModel, oneByOne: boolean) => {
				logEvent(events.ROOM_MSG_ACTION_Multi_Select);
				multiSelectInit(message.id, oneByOne);
			};

			const handleQuote = (message: TAnyMessageModel) => {
				logEvent(events.ROOM_MSG_ACTION_QUOTE);
				replyInit(message, false);
			};

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const handleReaction: IHeader['handleReaction'] = (emoji, message) => {
				logEvent(events.ROOM_MSG_ACTION_REACTION);
				if (emoji) {
					onReactionPress(emoji, message.id);
				} else {
					setTimeout(() => reactionInit(message), ACTION_SHEET_ANIMATION_DURATION);
				}
				hideActionSheet();
			};

			const handleToggleTranslation = async (message: TAnyMessageModel) => {
				try {
					if (!room.autoTranslateLanguage) {
						return;
					}
					const db = database.active;
					await db.write(async () => {
						await message.update(m => {
							m.autoTranslate = !m.autoTranslate;
							m._updatedAt = new Date();
						});
					});
					const translatedMessage = getMessageTranslation(message, room.autoTranslateLanguage);
					if (!translatedMessage) {
						await Services.translateMessage(message.id, room.autoTranslateLanguage);
					}
				} catch (e) {
					log(e);
				}
			};

			const handleFinishTodo = async (messagge: TAnyMessageModel, status: number) => {
				try {
					const { appiaTodo } = messagge;
					appiaTodo && (await Services.ToggleTodoStatus(appiaTodo.tid, status));
				} catch (e) {
					log(e);
				}
			};

			const handleDelete = async (message: TAnyMessageModel) => {
				const db = database.active;
				const recallMessageCollection = db.get(RECALL_MESSAGES_TABLE);
				try {
					// @ts-ignore
					let { msg } = message._raw;
					let type = 'msg';
					if (msg === '' && message.attachments) {
						if (typeof message.attachments === 'string') {
							const obj = JSON.parse(message.attachments);
							msg = obj[0]?.description;
						} else if (message.attachments.length > 0) {
							msg = message.attachments[0]?.description;
						}
						type = 'file';
					}
					logEvent(events.ROOM_MSG_ACTION_DELETE);
					// 将撤回的文本信息写入本地数据库
					if (isOwn(message)) {
						try {
							db.write(() =>
								recallMessageCollection.create(record => {
									record._raw = sanitizedRaw({ id: message._id }, recallMessageCollection.schema);
									record._id = message._id;
									record.msg = msg;
									record.rt = Date.now().toString();
									record.msgType = type;
								})
							);
						} catch (e) {
							log(e);
						}
					}

					const res = await Services.messageRecall(message.id);
					console.info('撤回消息结果= ', res);
				} catch (e) {
					logEvent(events.ROOM_MSG_ACTION_DELETE_F);
					log(e);
				}
				// 	}
				// });
			};

			const getOptions = (message: TAnyMessageModel) => {
				const options: TActionSheetOptionsItem[] = [];
				const videoConfBlock = message.t === 'videoconf';

				// 引用
				if (!isReadOnly && !videoConfBlock && (!message.msgType || message.msgType === 'forwardMergeMessage')) {
					options.push({
						title: I18n.t('Quote'),
						icon: 'quote',
						onPress: () => handleQuote(message)
					});
				}

				// Message appiaTodo不存在表示非待办事项   appiaTodo表示待办事项 0：正在待办 1： 表示完成
				const shouldSetTodo = !message.msgType || (message.attachments && message.attachments.length > 0);
				const setFinished = message.appiaTodo && message.appiaTodo?.status === 0;
				if (shouldSetTodo) {
					if (!setFinished) {
						options.push({
							title: I18n.t('Set_Todo'),
							icon: <TodoSet />,
							onPress: () => handleToggleTodo(message, 'd')
						});
					} else {
						options.push({
							title: I18n.t('Finish_Todo'),
							icon: <TodoFinished />,
							onPress: () => handleFinishTodo(message, -1)
						});
					}
				}

				// Copy
				if ((!message.attachments || message.attachments.length === 0) && !message.msgType) {
					options.push({
						title: I18n.t('Copy'),
						icon: 'copy',
						onPress: () => handleCopy(message)
					});
				}

				// 转发
				if (!message.msgType || message.msgType === 'forwardMergeMessage') {
					options.push({
						title: I18n.t('Forward'),
						icon: <ForwardIcon />,
						onPress: () => handleForward(message)
					});
				}

				// 多选
				if (!message.msgType) {
					// 多选， onebyone 其实没有用到
					options.push({
						title: I18n.t('Multi_Select'),
						icon: 'view-medium',
						onPress: () => handleMultiSelect(message, false)
					});
				}

				// 主题
				if (!message.msgType && !hasShowTagPermission(room.showAppiaTag ?? 0, APPIA_TAG.external)) {
					options.push({
						title: room.t === 'c' ? I18n.t('Start_a_Channel') : I18n.t('Start_a_Discussion'),
						icon: 'discussions',
						onPress: () => handleCreateDiscussion(message)
					});
				}

				// Toggle Auto-translate
				if (room.autoTranslate && message.u && message.u._id !== user.id) {
					options.push({
						title: I18n.t(message.autoTranslate ? 'View_Original' : 'Translate'),
						icon: 'language',
						onPress: () => handleToggleTranslation(message)
					});
				}

				// Delete
				if (
					allowDelete(message) &&
					(!message.msgType || message.msgType === 'forwardMergeMessage' || message.msgType === 'docCloud')
				) {
					options.push({
						title: I18n.t('Delete'),
						icon: 'delete',
						danger: true,
						onPress: () => handleDelete(message)
					});
				}

				return options;
			};

			const showMessageActions = async (message: TAnyMessageModel) => {
				logEvent(events.ROOM_SHOW_MSG_ACTIONS);
				await getPermissions();
				const options = getOptions(message);
				if (options.length === 0) {
					return;
				}
				showActionSheet({
					options: getOptions(message)
				});
			};

			useImperativeHandle(ref, () => ({ showMessageActions }));

			return null;
		}
	)
);
const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	Message_AllowDeleting: state.settings.Message_AllowDeleting as boolean,
	Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes as number,
	Message_AllowEditing: state.settings.Message_AllowEditing as boolean,
	Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes as number,
	Message_AllowPinning: state.settings.Message_AllowPinning as boolean,
	Message_AllowStarring: state.settings.Message_AllowStarring as boolean,
	Appia_Message_Read_Receipt_Store_Users: state.settings.Appia_Message_Read_Receipt_Store_Users as boolean,
	isMasterDetail: state.app.isMasterDetail,
	editMessagePermission: state.permissions['edit-message'],
	deleteMessagePermission: state.permissions['delete-message'],
	deleteOwnMessagePermission: state.permissions['delete-own-message'],
	forceDeleteMessagePermission: state.permissions['force-delete-message'],
	pinMessagePermission: state.permissions['pin-message'],
	createDirectMessagePermission: state.permissions['create-d']
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(MessageActions);
