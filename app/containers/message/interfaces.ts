import { MarkdownAST } from '@rocket.chat/message-parser';
import { StyleProp, TextStyle } from 'react-native';
import { ImageStyle } from 'react-native-fast-image';

import { IUserChannel } from '../markdown/interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IThread, IUrl, IUserMention, IUserMessage, MessageType, TAnyMessageModel } from '../../definitions';
import { IRoomInfoParam } from '../../views/SearchMessagesView';
import { IDoc } from './FastModelMsg';

export interface IMessageAttachments {
	attachments?: IAttachment[];
	timeFormat?: string;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
	id: string;
	appiaTodo?: object;
}

export interface IMessageAvatar {
	isHeader: boolean;
	avatar?: string;
	emoji?: string;
	author?: IUserMessage;
	small?: boolean;
	navToRoomInfo: (navParam: IRoomInfoParam) => void;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageBlocks {
	blocks: { appId?: string }[];
	id: string;
	rid: string;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
}

export interface IMessageBroadcast {
	author?: IUserMessage;
	broadcast?: boolean;
}

export interface IMessageCallButton {
	handleEnterCall?: () => void;
}

export interface IMessageContent {
	_id: string;
	isTemp: boolean;
	isInfo: string | boolean;
	tmid?: string;
	isThreadRoom: boolean;
	msg?: string;
	md?: MarkdownAST;
	isEdited: boolean;
	isEncrypted: boolean;
	getCustomEmoji: TGetCustomEmoji;
	channels?: IUserChannel[];
	mentions?: IUserMention[];
	navToRoomInfo: (navParam: IRoomInfoParam) => void;
	useRealName?: boolean;
	isIgnored: boolean;
	type: MessageType;
	msgData?: string;
	comment?: string;
	hasError: boolean;
	isHeader: boolean;
	isTranslated: boolean;
	author?: IUserMessage;
	id?: string;
	reeditMessage?: (message: string) => void;
	appiaTodo?: object;
	showRefer?: (doc: IDoc) => void;
	ts?: string | Date;
}

export interface IMessageEmoji {
	content: string;
	standardEmojiStyle: { fontSize: number };
	customEmojiStyle: StyleProp<ImageStyle>;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageThread extends Pick<IThread, 'msg' | 'tcount' | 'tlm' | 'id'> {
	isThreadRoom: boolean;
}

export interface IMessageTouchable {
	hasError: boolean;
	isInfo: string | boolean;
	isThreadReply: boolean;
	isTemp: boolean;
	archived?: boolean;
	highlighted?: boolean;
	ts?: string | Date;
	urls?: IUrl[];
	reactions?: any;
	alias?: string;
	role?: string;
	drid?: string;
}

export interface IBtn {
	name: string;
	key?: string;
	bold?: boolean;
	type?: 'request' | 'open' | 'copy';
	needAuth?: boolean;
}

export interface IMsgTag {
	text: string;
	color?: string;
	borderColor?: string;
	backgroundColor?: string;
}

export interface IApprove {
	source?: string;
	title: string;
	textList: {
		label: string;
		value: string;
		tags?: IMsgTag[];
	}[];
	tag?: string;
	linkInfo: ILinkInfo;
	btnList?: IBtn[];
	extraData: { action: string };
	titleTagAlign?: string;
}

export interface ILinkInfo {
	name: string;
	url: string;
	appUrl?: string;
	title?: string;
	needAuth?: boolean;
}

export interface IForwardMessage {
	originRoom: {
		rid: string;
		name?: string;
		names?: string[];
	};
	messages: IMessageInner[];
}

export interface IMessageAppia {
	msgType?: string;
	msgData?: string;
	surveyStatus?: boolean;
}

export interface IMessageRepliedThread extends Pick<IThread, 'tmid' | 'tmsg' | 'id'> {
	isHeader: boolean;
	fetchThreadName?: (tmid: string, id: string) => Promise<string | undefined>;
	isEncrypted: boolean;
}

export interface IMessageInner
	extends IMessageContent,
		IMessageAppia,
		IMessageCallButton,
		IMessageBlocks,
		IMessageThread,
		IMessageAttachments,
		IMessageBroadcast {
	type: MessageType;
	blocks: [];
	urls?: IUrl[];
	ts?: Date;
	isReadReceiptEnabled?: boolean;
	unread?: boolean;
	appiaTodo?: object;
	showRefer?: (doc: IDoc) => void;
}

export interface IMessage extends IMessageRepliedThread, IMessageInner, IMessageAvatar, IMessageAppia {
	isThreadReply: boolean;
	isThreadSequential: boolean;
	isInfo: string | boolean;
	isTemp: boolean;
	isHeader: boolean;
	hasError: boolean;
	style: any;
	// style: ViewStyle;
	onLongPress?: (item: TAnyMessageModel) => void;
	isReadReceiptEnabled?: boolean;
	unread?: boolean;
	isIgnored: boolean;
	dcount: number | undefined;
	dlm: string | Date | undefined;
	reeditMessage?: (message: string) => void;
	appiaTodo?: object;
	showRefer?: (doc: IDoc) => void;
}
