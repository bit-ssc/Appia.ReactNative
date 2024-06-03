import React, { Component } from 'react';
import { Alert, Keyboard, NativeModules, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import DocumentPicker from 'react-native-document-picker';
import ImagePicker, { Image, ImageOrVideo, Options } from 'react-native-image-crop-picker';
import { dequal } from 'dequal';
// import DocumentPicker from 'react-native-document-picker';
import { Q } from '@nozbe/watermelondb';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Touchable from 'react-native-platform-touchable';

import { generateTriggerId } from '../../lib/methods/actions';
import { TextInput, IThemedTextInput } from '../TextInput';
import { userTyping as userTypingAction } from '../../actions/room';
import styles from './styles';
import database from '../../lib/database';
import { emojis } from '../EmojiPicker/emojis';
import log, { events, logEvent } from '../../utils/log';
import RecordAudio from './RecordAudio';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import debounce from '../../utils/debounce';
import { themes } from '../../lib/constants';
// @ts-ignore
// eslint-disable-next-line import/extensions,import/no-unresolved
import LeftButtons from './LeftButtons';
// @ts-ignore
// eslint-disable-next-line import/extensions,import/no-unresolved
import RightButtons from './RightButtons';
import { isAndroid, isIOS, isTablet } from '../../utils/deviceInfo';
import { canUploadFile } from '../../utils/media';
import EventEmiter from '../../utils/events';
import { KEY_COMMAND, handleCommandShowUpload, handleCommandSubmit, handleCommandTyping } from '../../commands';
import getMentionRegexp from './getMentionRegexp';
import MessageboxContext from './Context';
import {
	MENTIONS_COUNT_TO_DISPLAY,
	MENTIONS_TRACKING_TYPE_CANNED,
	MENTIONS_TRACKING_TYPE_COMMANDS,
	MENTIONS_TRACKING_TYPE_EMOJIS,
	MENTIONS_TRACKING_TYPE_ROOMS,
	MENTIONS_TRACKING_TYPE_USERS,
	TIMEOUT_CLOSE_EMOJI
} from './constants';
import CommandsPreview from './CommandsPreview';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/navigation/appNavigation';
import { withActionSheet } from '../ActionSheet';
import { sanitizeLikeString } from '../../lib/database/utils';
import { CustomIcon } from '../CustomIcon';
import { IMessage } from '../../definitions/IMessage';
import { forceJpgExtension } from './forceJpgExtension';
import {
	IBaseScreen,
	IPreviewItem,
	IShareAttachment,
	IUser,
	SubscriptionType,
	TGetCustomEmoji,
	TSubscriptionModel,
	TThreadModel
} from '../../definitions';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { getPermalinkMessage, hasPermission, search, searchRoomMembers, sendFileMessage } from '../../lib/methods';
import { Services } from '../../lib/services';
import { TSupportedThemes } from '../../theme';
// import { ToggleEmojiButton } from './buttons';
import './EmojiKeyboard';
import AttachmentKeyboard from './AttachmentKeyboard';
import { showToast } from '../../lib/methods/helpers/showToast';
import { setStartVoiceChat } from '../../actions/chat';
import { IVChatHoster, IVCReceiveUser, IVChatCallMsg } from '../../definitions/IVChat';
import EventEmitter from '../../lib/methods/helpers/events';
import { HOSTER_OPEN_VOICECHAT_EMITTER } from '../VoiceChatView';
import BottomDrawerView from './BottomDrawerView';
import MessageBoxUserSelectView from './MessageBoxUserSelectView';
import sdk from '../../lib/services/sdk';

const imagePickerConfig = {
	cropping: true,
	avoidEmptySpaceAroundImage: false,
	freeStyleCropEnabled: true,
	forceJpg: true
};

const libraryPickerConfig: Options = {
	multiple: true,
	compressVideoPreset: 'Passthrough',
	mediaType: 'any',
	forceJpg: true
};

const videoPickerConfig: Options = {
	mediaType: 'video'
};

export interface IMessageBoxProps extends IBaseScreen<MasterDetailInsideStackParamList, any> {
	rid: string;
	baseUrl: string;
	message: IMessage;
	replying: boolean;
	editing: boolean;
	threadsEnabled: boolean;
	isFocused(): boolean;
	user: IUser;
	roomType: SubscriptionType;
	tmid: string;
	replyWithMention: boolean;
	FileUpload_MediaTypeWhiteList: string;
	FileUpload_MaxFileSize: number;
	Message_AudioRecorderEnabled: boolean;
	getCustomEmoji: TGetCustomEmoji;
	editCancel: Function;
	editRequest: Function;
	onSubmit: Function;
	typing: Function;
	theme: TSupportedThemes;
	replyCancel(): void;
	showSend: boolean;
	children: JSX.Element;
	isMasterDetail: boolean;
	showActionSheet: Function;
	iOSScrollBehavior: number;
	sharing: boolean;
	isActionsEnabled: boolean;
	usedCannedResponse: string;
	uploadFilePermission: string[];
	serverVersion: string;
	onAttachmentShow: Function;
	cloudDisk?: Function;
	federated?: boolean;
	isBot?: boolean;
	answering?: boolean;
}

interface IMessageBoxState {
	mentions: any[];
	showEmojiKeyboard: boolean;
	showAttachmentKeyboard: boolean;
	showSend: any;
	recording: boolean;
	trackingType: string;
	commandPreview: IPreviewItem[];
	showCommandPreview: boolean;
	command: {
		appId?: string;
	};
	tshow: boolean;
	mentionLoading: boolean;
	permissionToUpload: boolean;
	showComment: boolean;
	animateModal: boolean;
}

class MessageBox extends Component<IMessageBoxProps, IMessageBoxState> {
	public text: string;

	public proText: string;

	private selection: { start: number; end: number };

	private mentionList: [{ username: string; fname: string }];

	private focused: boolean;

	private imagePickerConfig: Options;

	private libraryPickerConfig: Options;

	private videoPickerConfig: Options;

	private room!: TSubscriptionModel;

	private thread!: TThreadModel;

	private unsubscribeFocus: any;

	private trackingTimeout: any;

	private tracking: any;

	private unsubscribeBlur: any;

	private component: any;

	private typingTimeout: any;

	private openListener: any;

	static defaultProps = {
		message: {
			id: ''
		},
		sharing: false,
		iOSScrollBehavior: NativeModules.KeyboardTrackingViewTempManager?.KeyboardTrackingScrollBehaviorFixedOffset,
		isActionsEnabled: true,
		getCustomEmoji: () => {}
	};

	constructor(props: IMessageBoxProps) {
		super(props);
		this.state = {
			mentions: [],
			showEmojiKeyboard: false,
			showAttachmentKeyboard: false,
			showSend: props.showSend,
			recording: false,
			trackingType: '',
			commandPreview: [],
			showCommandPreview: false,
			command: {},
			tshow: false,
			mentionLoading: false,
			permissionToUpload: true,
			showComment: false,
			animateModal: false
		};
		this.text = '';
		this.proText = '';
		this.selection = { start: 0, end: 0 };
		this.focused = false;
		this.mentionList = [{ username: '', fname: '' }];

		const libPickerLabels = {
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			loadingLabelText: I18n.t('Processing')
		};

		this.imagePickerConfig = {
			...imagePickerConfig,
			...libPickerLabels
		};

		this.libraryPickerConfig = {
			...libraryPickerConfig,
			...libPickerLabels
		};

		this.videoPickerConfig = {
			...videoPickerConfig,
			...libPickerLabels
		};
	}

	async componentDidMount() {
		const db = database.active;
		const { rid, tmid, navigation, sharing, usedCannedResponse, isMasterDetail } = this.props;
		let msg;
		try {
			const threadsCollection = db.get('threads');
			const subsCollection = db.get('subscriptions');
			try {
				this.room = await subsCollection.find(rid);
			} catch (error) {
				console.log(`Messagebox.didMount: Room not found${rid}`);
			}
			if (tmid) {
				try {
					this.thread = await threadsCollection.find(tmid);
					if (this.thread && !sharing) {
						msg = this.thread.draftMessage;
					}
				} catch (error) {
					console.log('Messagebox.didMount: Thread not found');
				}
			} else if (!sharing) {
				msg = this.room?.draftMessage;
			}
		} catch (e) {
			log(e);
		}

		if (msg) {
			this.setInput(msg);
			this.setShowSend(true);
		}

		if (isTablet) {
			EventEmiter.addEventListener(KEY_COMMAND, this.handleCommands);
		}

		if (isMasterDetail && usedCannedResponse) {
			this.onChangeText(usedCannedResponse);
		}

		this.setOptions();

		this.unsubscribeFocus = navigation.addListener('focus', () => {
			// didFocus
			// We should wait pushed views be dismissed
			this.trackingTimeout = setTimeout(() => {
				if (this.tracking && this.tracking.resetTracking) {
					// Reset messageBox keyboard tracking
					this.tracking.resetTracking();
				}
			}, 500);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.component?.blur();
			this.saveDraftMessage();
		});
	}

	saveDraftMessage = async () => {
		try {
			const db = database.active;
			const subscription = await db.get('subscriptions').find(this.room.rid);

			await sdk.post('subscriptions.read', { rid: this.room.rid });

			await db.write(async () => {
				try {
					await subscription.update((s: TSubscriptionModel) => {
						s.draftMessage = this.text;
					});
				} catch (e) {
					// Do nothing
				}
			});
		} catch (e) {
			log(e);
		}
	};

	UNSAFE_componentWillReceiveProps(nextProps: any) {
		const { isFocused, editing, replying, sharing, usedCannedResponse } = this.props;
		if (!isFocused?.()) {
			return;
		}
		if (usedCannedResponse !== nextProps.usedCannedResponse) {
			this.onChangeText(nextProps.usedCannedResponse ?? '');
		}
		if (sharing) {
			this.setInput(nextProps.message.msg ?? '');
			return;
		}
		if (editing !== nextProps.editing && nextProps.editing) {
			this.setInput(nextProps.message.msg);
			if (this.text) {
				this.setShowSend(true);
			}
			this.focus();
		} else if (replying !== nextProps.replying && nextProps.replying) {
			this.focus();
		} else if (!nextProps.message) {
			this.clearInput();
		}
		if (this.trackingTimeout) {
			clearTimeout(this.trackingTimeout);
			this.trackingTimeout = false;
		}
	}

	shouldComponentUpdate(nextProps: IMessageBoxProps, nextState: IMessageBoxState) {
		const {
			showEmojiKeyboard,
			showAttachmentKeyboard,
			showSend,
			recording,
			mentions,
			commandPreview,
			tshow,
			mentionLoading,
			trackingType,
			permissionToUpload,
			showComment
		} = this.state;

		const { roomType, replying, editing, isFocused, message, theme, usedCannedResponse, uploadFilePermission, answering } =
			this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!isFocused()) {
			return false;
		}
		if (nextProps.roomType !== roomType) {
			return true;
		}
		if (nextProps.replying !== replying) {
			return true;
		}
		if (nextProps.editing !== editing) {
			return true;
		}
		if (nextState.showEmojiKeyboard !== showEmojiKeyboard) {
			return true;
		}
		if (nextState.showAttachmentKeyboard !== showAttachmentKeyboard) {
			return true;
		}
		if (nextState.trackingType !== trackingType) {
			return true;
		}
		if (nextState.mentionLoading !== mentionLoading) {
			return true;
		}
		if (nextState.showSend !== showSend) {
			return true;
		}
		if (nextState.recording !== recording) {
			return true;
		}
		if (nextState.tshow !== tshow) {
			return true;
		}
		if (nextProps.answering !== answering) {
			return true;
		}
		if (nextState.permissionToUpload !== permissionToUpload) {
			return true;
		}
		if (!dequal(nextState.mentions, mentions)) {
			return true;
		}
		if (!dequal(nextState.commandPreview, commandPreview)) {
			return true;
		}
		if (!dequal(nextProps.message?.id, message?.id)) {
			return true;
		}
		if (!dequal(nextProps.uploadFilePermission, uploadFilePermission)) {
			return true;
		}
		if (nextProps.usedCannedResponse !== usedCannedResponse) {
			return true;
		}
		if (nextState.showComment !== showComment) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps: IMessageBoxProps) {
		const { uploadFilePermission } = this.props;
		if (!dequal(prevProps.uploadFilePermission, uploadFilePermission)) {
			this.setOptions();
		}
	}

	componentWillUnmount() {
		console.countReset(`${this.constructor.name}.render calls`);
		if (this.onChangeText && this.onChangeText.stop) {
			this.onChangeText.stop();
		}
		if (this.getUsers && this.getUsers.stop) {
			this.getUsers.stop();
		}
		if (this.getRooms && this.getRooms.stop) {
			this.getRooms.stop();
		}
		if (this.getEmojis && this.getEmojis.stop) {
			this.getEmojis.stop();
		}
		if (this.getSlashCommands && this.getSlashCommands.stop) {
			this.getSlashCommands.stop();
		}
		if (this.getCannedResponses && this.getCannedResponses.stop) {
			this.getCannedResponses.stop();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (isTablet) {
			EventEmiter.removeListener(KEY_COMMAND, this.handleCommands);
		}
	}

	setOptions = async () => {
		const { uploadFilePermission, rid } = this.props;

		// Servers older than 4.2
		if (!uploadFilePermission) {
			this.setState({ permissionToUpload: true });
			return;
		}

		const permissionToUpload = await hasPermission([uploadFilePermission], rid);
		this.setState({ permissionToUpload: permissionToUpload[0] });
	};

	onChangeText: any = (text: string): void => {
		const isTextEmpty = text.length === 0;
		this.setShowSend(!isTextEmpty);
		this.debouncedOnChangeText(text);
		this.setInput(text);
	};

	onSelectionChange = (e: any) => {
		this.selection = e.nativeEvent.selection;
	};

	// eslint-disable-next-line react/sort-comp
	debouncedOnChangeText = debounce(async (text: any) => {
		const { sharing, roomType } = this.props;
		const isTextEmpty = text.length === 0;
		if (isTextEmpty) {
			this.stopTrackingMention();
			return;
		}
		this.handleTyping(!isTextEmpty);
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		const txt = cursor < text.length ? text.substr(0, cursor).split(' ') : text.split(' ');
		const lastWord = txt[txt.length - 1];
		let result = lastWord.substring(1);

		const commandMention = text.match(/^\//); // match only if message begins with /
		const channelMention = lastWord.match(/^#/);
		const userMention = lastWord.match('@');
		const emojiMention = lastWord.match(/^:/);
		const cannedMention = lastWord.match(/^!/);
		console.log(this.state, this.props, 'this.state,this.props');

		if (commandMention && !sharing) {
			const command = text.substr(1);
			const commandParameter = text.match(/^\/([a-z0-9._-]+) (.+)/im);
			if (commandParameter) {
				const db = database.active;
				const [, name, params] = commandParameter;
				const commandsCollection = db.get('slash_commands');
				try {
					const commandRecord = await commandsCollection.find(name);
					if (commandRecord.providesPreview) {
						return this.setCommandPreview(commandRecord, name, params);
					}
				} catch (e) {
					// do nothing
				}
			}
			return this.identifyMentionKeyword(command, MENTIONS_TRACKING_TYPE_COMMANDS);
		}
		if (channelMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_ROOMS);
		}

		if (userMention && this.proText.length < this.text.length && roomType !== 'd') {
			// 只有新增的过程中输入@时候触发，删除的时候不触发
			result = result.includes('@') ? result.split('@')[1] : result;
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_USERS);
		}
		if (emojiMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_EMOJIS);
		}
		if (cannedMention && roomType === 'l') {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_CANNED);
		}
		return this.stopTrackingMention();
	}, 100);

	onKeyboardResigned = () => {
		this.closeEmoji();
		// this.closeMessageBoxActions();
	};

	onPressMention = (item: any) => {
		if (!this.component) {
			return;
		}
		const { trackingType } = this.state;
		const msg = this.text;
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		const regexp = getMentionRegexp();
		let result = msg.substr(0, cursor).replace(regexp, '');
		// Remove the ! after select the canned response
		if (trackingType === MENTIONS_TRACKING_TYPE_CANNED) {
			const lastIndexOfExclamation = msg.lastIndexOf('!', cursor);
			result = msg.substr(0, lastIndexOfExclamation).replace(regexp, '');
		}
		const mentionName =
			trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
				? `${item.name || item}:`
				: item.fname || item.username || item.name || item.command || item.text;
		const text = `${result}${mentionName} ${msg.slice(cursor)}`;
		// 为了记录提醒人列表用于后续替换
		if (item.fname) {
			this.mentionList.push({ username: item.username || item.name, fname: item.fname });
		}
		if (trackingType === MENTIONS_TRACKING_TYPE_COMMANDS && item.providesPreview) {
			this.setState({ showCommandPreview: true });
		}
		// @成员时让光标在文本最后添加空格，防止输入文本时@无效
		// 为了让输入文字后可以@成员，需要给@前添加空格， 那么相当于光标后移两位
		const newCursor = cursor + mentionName.length + 2;
		this.setInput(text.replace('@', ' @'), { start: newCursor, end: newCursor });
		this.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
		this.setState({ showComment: false });
	};

	onPressMentionWithUsers = (users: any) => {
		if (!this.component) {
			return;
		}
		const { trackingType } = this.state;
		const msg = this.text;
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		const regexp = getMentionRegexp();
		let result = msg.substr(0, cursor).replace(regexp, '');
		// Remove the ! after select the canned response
		if (trackingType === MENTIONS_TRACKING_TYPE_CANNED) {
			const lastIndexOfExclamation = msg.lastIndexOf('!', cursor);
			result = msg.substr(0, lastIndexOfExclamation).replace(regexp, '');
		}
		let mentionNames = '';
		for (let i = 0; i < users.length; i++) {
			const item = users[i];
			item.fname = item.name;
			item.name = item.username;
			item.username = item.username;

			if (i === 0) {
				mentionNames =
					trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
						? `${item.name || item}:`
						: item.fname || item.username || item.name || item.command || item.text;
			} else {
				const mentionName =
					trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
						? `${item.name || item}:`
						: item.fname || item.username || item.name || item.command || item.text;
				mentionNames = `${mentionNames} @${mentionName}`;
			}
			if (item.fname) {
				this.mentionList.push({ username: item.username || item.name, fname: item.fname });
			}
		}

		const text = `${result}${mentionNames} ${msg.slice(cursor)}`;
		// 为了记录提醒人列表用于后续替换

		// @成员时让光标在文本最后添加空格，防止输入文本时@无效
		// 为了让输入文字后可以@成员，需要给@前添加空格， 那么相当于光标后移两位
		const newCursor = cursor + mentionNames.length + 2;
		this.setInput(text.replace('@', ' @'), { start: newCursor, end: newCursor });
		this.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
		this.setState({ showComment: false });
	};

	onPressCommandPreview = (item: any) => {
		const { command } = this.state;
		const {
			rid,
			tmid,
			message: { id: messageTmid },
			replyCancel
		} = this.props;
		const { text } = this;
		const name = text.substr(0, text.indexOf(' ')).slice(1);
		const params = text.substr(text.indexOf(' ') + 1) || 'params';
		this.setState({ commandPreview: [], showCommandPreview: false, command: {} });
		this.stopTrackingMention();
		this.clearInput();
		this.handleTyping(false);
		try {
			const { appId } = command;
			const triggerId = generateTriggerId(appId);
			Services.executeCommandPreview(name, params, rid, item, triggerId, tmid || messageTmid);
			replyCancel();
		} catch (e) {
			log(e);
		}
	};

	onEmojiSelected = (keyboardId: string, params: { emoji: string }) => {
		const { emoji } = params;
		const { text } = this;
		let newText = '';

		// if messagebox has an active cursor
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		newText = `${text.substr(0, cursor)}${emoji}${text.substr(cursor)}`;
		const newCursor = cursor + emoji.length;
		this.setInput(newText, { start: newCursor, end: newCursor });
		this.setShowSend(true);
	};

	openCloudDisk = () => {
		const { cloudDisk } = this.props;
		cloudDisk && cloudDisk();
	};

	showAlert = () => {
		Alert.alert(
			'', // 弹窗标题
			I18n.t('Voice_Chat_Calling_Alert_Title'),
			[
				{
					text: I18n.t('Voice_Chat_OK'),
					onPress: () => console.log('确认操作')
				}
			],
			{ cancelable: false }
		);
	};

	// eslint-disable-next-line require-await
	openVoiceChat = async () => {
		const p_users: IVCReceiveUser[] = [];
		if (this.props.roomType === 'd') {
			this.room.usernames?.forEach(userName => {
				if (userName !== this.props.user.username) {
					p_users.push({ receiver: userName } as IVCReceiveUser);
				}
			});
			if (p_users.length > 0) {
				const hoster: IVChatHoster = { roomId: this.props.rid, roomType: this.props.roomType, receivers: p_users };
				this.props.startChat(hoster);
				EventEmitter.emit(HOSTER_OPEN_VOICECHAT_EMITTER, { hoster });
			}
		}
		if (this.props.roomType === 'p' || this.props.roomType === 'c') {
			if (this.room.usernames && this.room.usernames.length === 1) return;
			let flag = true;
			if (this.room.callMsg) {
				const msgData = JSON.parse(this.room.callMsg) as IVChatCallMsg;
				if (msgData && (msgData.status === 'talking' || msgData.status === 'calling')) {
					this.showAlert();
					flag = false;
				}
			}
			if (flag) {
				Navigation.navigate('VoiceChatUsersSelectView', {
					rid: this.props.rid,
					roomType: this.room.t,
					nextAction: (navigation: any, users: any) => {
						navigation.pop();
						users.forEach(user => {
							if (user.username !== this.props.user.username) {
								p_users.push({ receiver: user.username, receiverAppiaId: user._id } as IVCReceiveUser);
							}
						});
						if (p_users.length > 0) {
							const hoster: IVChatHoster = { roomId: this.props.rid, roomType: this.props.roomType, receivers: p_users };
							this.props.startChat(hoster);
							EventEmitter.emit(HOSTER_OPEN_VOICECHAT_EMITTER, { hoster });
						}
					}
				});
			}
		}
	};

	onAttachmentItemSelected = (type: string) => {
		switch (type) {
			case 'photo':
				this.chooseFromLibrary();
				break;
			case 'photogragh':
				this.takePhoto();
				break;
			case 'video':
				this.takeVideo();
				break;
			case 'file':
				this.chooseFile();
				break;
			case 'cloud_disk':
				this.openCloudDisk();
				break;
			case 'voice_chat':
				this.openVoiceChat();
				break;
			default:
				break;
		}
	};

	getPermalink = async (message: any) => {
		try {
			return await getPermalinkMessage(message);
		} catch (error) {
			return null;
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getFixedMentions = (keyword: any) => {
		let result: any = [];
		if ('all'.indexOf(keyword) !== -1) {
			result = [{ username: 'all', fname: 'all', name: 'all' }];
		}
		// if ('here'.indexOf(keyword) !== -1) {
		// 	result = [{ rid: -2, username: 'here' }, ...result];
		// }
		return result;
	};
	getUsers = debounce(async (keyword: any) => {
		// let res = await search({ text: keyword, filterRooms: false, filterUsers: true });
		const { rid, roomType } = this.props;
		let res = await searchRoomMembers({ keyword, rid, roomType });

		res = [
			...this.getFixedMentions(keyword),
			...res.map(value => ({
				fname: value.name,
				name: value.username,
				username: value.username
			}))
		];
		this.setState({ mentions: res, mentionLoading: false, showComment: res.length > 1, animateModal: res.length > 1 });
	}, 100);

	getRooms = debounce(async (keyword = '') => {
		const res = await search({ text: keyword, filterRooms: true, filterUsers: false });
		this.setState({ mentions: res, mentionLoading: false });
	}, 300);

	getEmojis = debounce(async (keyword: any) => {
		const db = database.active;
		const customEmojisCollection = db.get('custom_emojis');
		const likeString = sanitizeLikeString(keyword);
		const whereClause = [];
		if (likeString) {
			whereClause.push(Q.where('name', Q.like(`${likeString}%`)));
		}
		let customEmojis = await customEmojisCollection.query(...whereClause).fetch();
		customEmojis = customEmojis.slice(0, MENTIONS_COUNT_TO_DISPLAY);
		const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
		const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
		this.setState({ mentions: mergedEmojis || [], mentionLoading: false });
	}, 300);

	getSlashCommands = debounce(async (keyword: any) => {
		const db = database.active;
		const commandsCollection = db.get('slash_commands');
		const likeString = sanitizeLikeString(keyword);
		const commands = await commandsCollection.query(Q.where('id', Q.like(`${likeString}%`))).fetch();
		this.setState({ mentions: commands || [], mentionLoading: false });
	}, 300);

	getCannedResponses = debounce(async (text?: string) => {
		const res = await Services.getListCannedResponse({ text });
		this.setState({ mentions: res.success ? res.cannedResponses : [], mentionLoading: false });
	}, 500);

	focus = () => {
		if (this.component && this.component.focus) {
			this.component.focus();
		}
	};

	handleTyping = (isTyping: boolean) => {
		const { typing, rid, sharing } = this.props;
		if (sharing) {
			return;
		}
		if (!isTyping) {
			if (this.typingTimeout) {
				clearTimeout(this.typingTimeout);
				this.typingTimeout = false;
			}
			typing(rid, false);
			return;
		}

		if (this.typingTimeout) {
			return;
		}

		this.typingTimeout = setTimeout(() => {
			typing(rid, true);
			this.typingTimeout = false;
		}, 1000);
	};

	setCommandPreview = async (command: any, name: string, params: string) => {
		const { rid } = this.props;
		try {
			const response = await Services.getCommandPreview(name, rid, params);
			if (response.success) {
				return this.setState({ commandPreview: response.preview?.items || [], showCommandPreview: true, command });
			}
		} catch (e) {
			log(e);
		}
		this.setState({ commandPreview: [], showCommandPreview: true, command: {} });
	};

	setInput = (text: any, selection?: any) => {
		this.proText = this.text;
		this.text = text;
		if (selection) {
			return this.component.setNativeProps({ text });
		}
		this.component.setNativeProps({ text });
	};

	setReEditMessage = (text: string) => {
		this.text += text;
		text = this.text;
		this.setShowSend(!!this.text);
		this.component.setNativeProps({ text });
	};

	setShowSend = (showSend: any) => {
		const { showSend: prevShowSend } = this.state;
		const { showSend: propShowSend } = this.props;
		if (prevShowSend !== showSend && !propShowSend) {
			this.setState({ showSend });
		}
	};

	clearInput = () => {
		this.setInput('');
		this.setShowSend(false);
		this.setState({ tshow: false });
	};

	canUploadFile = (file: any) => {
		const { permissionToUpload } = this.state;
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;
		const result = canUploadFile({
			file,
			allowList: FileUpload_MediaTypeWhiteList,
			maxFileSize: FileUpload_MaxFileSize,
			permissionToUploadFile: permissionToUpload
		});
		if (result.success) {
			return true;
		}
		Alert.alert(I18n.t('Error_uploading'), result.error && I18n.isTranslated(result.error) ? I18n.t(result.error) : result.error);
		return false;
	};

	takePhoto = async () => {
		logEvent(events.ROOM_BOX_ACTION_PHOTO);
		try {
			let image = (await ImagePicker.openCamera(this.imagePickerConfig)) as Image;
			image = forceJpgExtension(image);
			if (this.canUploadFile(image)) {
				await this.refreshRoomInfo();
				this.getNewAttachments([image]);
			}
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_PHOTO_F);
			if ((e as { code: string })?.code === 'E_NO_CAMERA_PERMISSION') {
				this.alertNativePermisson(I18n.t('Alert_Open_Camera_Permission'));
			}
		}
	};

	takeVideo = async () => {
		logEvent(events.ROOM_BOX_ACTION_VIDEO);
		try {
			const video = await ImagePicker.openCamera(this.videoPickerConfig);
			if (this.canUploadFile(video)) {
				await this.refreshRoomInfo();
				this.getNewAttachments([video]);
			}
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_VIDEO_F);
			if ((e as { code: string })?.code === 'E_NO_CAMERA_PERMISSION') {
				this.alertNativePermisson(I18n.t('Alert_Open_Camera_Permission'));
			}
		}
	};

	chooseFromLibrary = async () => {
		logEvent(events.ROOM_BOX_ACTION_LIBRARY);
		const chooseFromGallery = NativeModules?.JSToNativeManager?.chooseFromGallery;
		try {
			let attachments = null;
			if (chooseFromGallery != null && isAndroid) {
				attachments = (await chooseFromGallery()) as unknown as ImageOrVideo[];
			} else {
				attachments = (await ImagePicker.openPicker(this.libraryPickerConfig)) as unknown as ImageOrVideo[];
			}
			// @ts-ignore
			attachments = attachments.map(att => forceJpgExtension(att));
			await this.refreshRoomInfo();
			await this.getNewAttachments(attachments);
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_LIBRARY_F);
			if ((e as { code: string })?.code === 'E_NO_LIBRARY_PERMISSION') {
				this.alertNativePermisson(I18n.t('Alert_Open_Gallary_Permission'));
			}
		}
	};

	chooseFile = async () => {
		logEvent(events.ROOM_BOX_ACTION_FILE);

		if (this.room.t !== 'd') {
			try {
				const res = await DocumentPicker.pickSingle({
					type: [DocumentPicker.types.allFiles]
				});
				if (res.size === 0) {
					showToast('不能选择0KB的文件');
					return;
				}
				const file = {
					filename: res.name,
					size: res.size,
					mime: res.type,
					path: res.uri
				};
				if (this.canUploadFile(file)) {
					await this.refreshRoomInfo();
					this.getNewAttachments([file]);
				}
			} catch (e: any) {
				if (!DocumentPicker.isCancel(e)) {
					logEvent(events.ROOM_BOX_ACTION_FILE_F);
					log(e);
				}
			}
			return;
		}

		Navigation.navigate('DocumentPickerView', {
			room: this.room,
			callback: async (files: any[]) => {
				try {
					if (this.canUpload(files)) {
						await this.refreshRoomInfo();
						this.getNewAttachments(files);
					}
				} catch (e: any) {
					logEvent(events.ROOM_BOX_ACTION_FILE_F);
					log(e);
				}
			}
		});
	};

	canUpload = (files: any[]) => {
		if (!files || files.length <= 0) return false;
		return files.every(value => canUploadFile(value));
	};

	getPermissionMobileUpload = async () => {
		const db = database.active;
		const permissionsCollection = db.get('permissions');
		const uploadFilePermissionFetch = await permissionsCollection.query(Q.where('id', Q.like('mobile-upload-file'))).fetch();
		const uploadFilePermission = uploadFilePermissionFetch[0]?.roles;
		const permissionToUpload = await hasPermission([uploadFilePermission], this.room.rid);
		// uploadFilePermission as undefined is considered that there isn't this permission, so all can upload file.
		return !uploadFilePermission || permissionToUpload[0];
	};

	getNewAttachments = async (attachments: any) => {
		const permissionToUploadFile = await this.getPermissionMobileUpload();

		const items = await Promise.all(
			attachments.map(async (item: any) => {
				// Check server settings
				const { success: canUpload, error } = canUploadFile({
					file: item,
					allowList: this.props.FileUpload_MediaTypeWhiteList,
					maxFileSize: this.props.FileUpload_MaxFileSize,
					permissionToUploadFile
				});
				item.canUpload = canUpload;
				item.error = error;

				// get video thumbnails
				if (isAndroid && attachments.length > 1 && item.mime?.match?.(/video/)) {
					try {
						const VideoThumbnails = require('expo-video-thumbnails');
						const { uri } = await VideoThumbnails.getThumbnailAsync(item.path);
						item.uri = uri;
					} catch {
						// Do nothing
					}
				}

				// Set a filename, if there isn't any
				if (!item.filename) {
					if (isAndroid && item.path) {
						item.filename = item.path.substring(item.path.lastIndexOf('/') + 1);
					} else {
						item.filename = `${new Date().toISOString()}.jpg`;
					}
				}
				return item;
			})
		);
		this.sendAttachment(items as unknown as IShareAttachment[]);
	};

	delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	sendAttachment = async (attachments: IShareAttachment[]) => {
		const { message, replyCancel, replyWithMention } = this.props;
		// Start a thread with an attachment
		let value: TThreadModel | IMessage = this.thread;
		if (replyWithMention) {
			value = message;
			replyCancel();
		}
		try {
			// Send attachment
			if (attachments.length) {
				const uploadPromises = attachments.map((attachment, index) =>
					this.delay(index * 1) // 这里为每个上传操作添加了(index * 1)毫秒的延迟
						.then(() => {
							const { filename: name, mime: type, description, size, path, canUpload, width, height } = attachment;
							if (canUpload) {
								return sendFileMessage(
									this.room.rid,
									{ name, description, size, type, path, store: 'Uploads', width, height },
									value?.id,
									this.props.baseUrl,
									{
										id: this.props.user.id,
										token: this.props.user.token,
										username: this.props.user.username,
										name: this.props.user.name
									}
								);
							}
						})
				);

				await Promise.all(uploadPromises);
				if (isIOS) {
					const JSToNativeManager = NativeModules?.JSToNativeManager;
					JSToNativeManager?.changeFileUploadStatus(0);
				}
				// Send text message
			}
		} catch {
			// Do nothing
			if (isIOS) {
				const JSToNativeManager = NativeModules?.JSToNativeManager;
				JSToNativeManager?.changeFileUploadStatus(0);
			}
		}
	};

	alertNativePermisson = (title: string) => {
		Alert.alert(
			I18n.t('Alert_Permission'),
			title,
			[
				{
					text: I18n.t('Confirm'),
					onPress: () => {
						// if (isIOS) {
						const JSToNativeManager = NativeModules?.JSToNativeManager;
						JSToNativeManager.jumpToSystemSetting();
						// }
					}
				}
			],
			{ cancelable: false }
		);
	};

	refreshRoomInfo = async () => {
		const { rid } = this.props;
		try {
			if (!this.room) {
				const db = database.active;
				const subsCollection = db.get('subscriptions');
				this.room = await subsCollection.find(rid);
				console.log(`重新更新room信息：${this.room?.rid}`);
			}
		} catch (error) {
			console.log(`重新更新room信息失败：${rid}`);
		}
	};

	onPressNoMatchCanned = () => {
		const { isMasterDetail, rid } = this.props;
		const params = { rid };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CannedResponsesListView', params });
		} else {
			Navigation.navigate('CannedResponsesListView', params);
		}
	};

	openShareView = (attachments: any) => {
		const { message, replyCancel, replyWithMention } = this.props;
		// Start a thread with an attachment
		let value: TThreadModel | IMessage = this.thread;
		if (replyWithMention) {
			value = message;
			replyCancel();
		}
		console.log(`当前的聊天房间：${JSON.stringify(this.room?.rid)}`);
		Navigation.navigate('ShareView', { room: this.room, thread: value, attachments });
	};

	createDiscussion = () => {
		logEvent(events.ROOM_BOX_ACTION_DISCUSSION);
		const { isMasterDetail } = this.props;
		const params = { channel: this.room, showCloseModal: true };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
		}
	};

	showMessageBoxActions = () => {
		if (isIOS) {
			if (!this.state.showAttachmentKeyboard) {
				this.props.onAttachmentShow(true);
			} else {
				this.props.onAttachmentShow(false);
			}
		}

		this.setState(
			prevState => ({
				showAttachmentKeyboard: !prevState.showAttachmentKeyboard
			}),
			() => {
				if (isIOS) {
					this.tracking.resetTracking();
				}
			}
		);

		this.closeEmoji();
		setTimeout(() => this.component?.blur(), 100);
		logEvent(events.ROOM_SHOW_BOX_ACTIONS);
	};

	closeMessageBoxActions = () => {
		if (isIOS) {
			this.props.onAttachmentShow(false);
		}
		this.setState({
			showAttachmentKeyboard: false
		});
	};

	editCancel = () => {
		const { editCancel } = this.props;
		editCancel();
		this.clearInput();
	};

	openEmoji = () => {
		logEvent(events.ROOM_OPEN_EMOJI);
		this.closeMessageBoxActions();
		this.setState({ showEmojiKeyboard: true });
	};

	recordingCallback = (recording: any) => {
		this.closeEmoji();
		this.closeMessageBoxActions();
		this.setState({ recording });
	};

	finishAudioMessage = async (fileInfo: any) => {
		const { rid, tmid, baseUrl: server, user } = this.props;

		if (fileInfo) {
			try {
				if (this.canUploadFile(fileInfo)) {
					await sendFileMessage(rid, fileInfo, tmid, server, user);
					if (isIOS) {
						const JSToNativeManager = NativeModules?.JSToNativeManager;
						JSToNativeManager?.changeFileUploadStatus(0);
					}
				}
			} catch (e) {
				log(e);
			}
		}
	};

	closeEmoji = () => {
		this.setState({ showEmojiKeyboard: false });
	};

	closeEmojiAndAction = (action?: Function, params?: any) => {
		const { showEmojiKeyboard } = this.state;

		this.closeEmoji();
		setTimeout(() => action && action(params), showEmojiKeyboard && isIOS ? TIMEOUT_CLOSE_EMOJI : undefined);
	};

	submit = async () => {
		const { tshow } = this.state;
		const { onSubmit, rid: roomId, tmid, showSend, sharing } = this.props;

		let tmpMessage = this.text;
		if (tmpMessage && this.mentionList) {
			this.mentionList.forEach(u => {
				if (!u.fname || !u.username) {
					return;
				}
				const tmpName = `@${u.fname}`;
				const tmpUsername = `@${u.username}`;
				tmpMessage = tmpMessage.replace(tmpName, tmpUsername);
			});
		}
		const message = tmpMessage;

		// if sharing, only execute onSubmit prop
		if (sharing) {
			onSubmit(message);
			return;
		}

		this.clearInput();
		this.debouncedOnChangeText.stop();
		this.closeEmoji();
		this.closeMessageBoxActions();
		this.stopTrackingMention();
		this.handleTyping(false);
		if (message.trim() === '' && !showSend) {
			return;
		}

		const {
			editing,
			replying,
			message: { id: messageTmid },
			replyCancel
		} = this.props;

		// Slash command
		if (message[0] === MENTIONS_TRACKING_TYPE_COMMANDS) {
			const db = database.active;
			const commandsCollection = db.get('slash_commands');
			const command = message.replace(/ .*/, '').slice(1);
			const likeString = sanitizeLikeString(command);
			const slashCommand = await commandsCollection.query(Q.where('id', Q.like(`${likeString}%`))).fetch();
			if (slashCommand.length > 0) {
				logEvent(events.COMMAND_RUN);
				try {
					const messageWithoutCommand = message.replace(/([^\s]+)/, '').trim();
					const [{ appId }] = slashCommand;
					const triggerId = generateTriggerId(appId);
					await Services.runSlashCommand(command, roomId, messageWithoutCommand, triggerId, tmid || messageTmid);
					replyCancel();
				} catch (e) {
					logEvent(events.COMMAND_RUN_F);
					log(e);
				}
				this.clearInput();
				return;
			}
		}
		// Edit
		if (editing) {
			const { message: editingMessage, editRequest } = this.props;
			const {
				id,
				// @ts-ignore
				subscription: { id: rid }
			} = editingMessage;
			editRequest({ id, msg: message, rid });

			// Reply
		} else if (replying) {
			const { message: replyingMessage, threadsEnabled, replyWithMention } = this.props;

			// Thread
			if (threadsEnabled && replyWithMention) {
				onSubmit(message, replyingMessage.id, tshow);

				// Legacy reply or quote (quote is a reply without mention)
			} else {
				const { user, roomType } = this.props;
				const permalink = await this.getPermalink(replyingMessage);
				let msg = `[ ](${permalink}) `;

				// if original message wasn't sent by current user and neither from a direct room
				if (user.username !== replyingMessage?.u?.username && roomType !== 'd' && replyWithMention) {
					msg += `@${replyingMessage?.u?.username} `;
				}

				msg = `${msg} ${message}`;
				onSubmit(msg);
			}
			replyCancel();

			// Normal message
		} else {
			// @ts-ignore
			onSubmit(message, undefined, tshow);
		}
	};

	updateMentions = (keyword: any, type: string) => {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			this.getUsers(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_EMOJIS) {
			this.getEmojis(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_COMMANDS) {
			this.getSlashCommands(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_CANNED) {
			this.getCannedResponses(keyword);
		} else {
			this.getRooms(keyword);
		}
	};

	identifyMentionKeyword = (keyword: any, type: string) => {
		this.setState({
			showEmojiKeyboard: false,
			showAttachmentKeyboard: false,
			trackingType: type,
			mentionLoading: true
		});
		this.updateMentions(keyword, type);
	};

	stopTrackingMention = () => {
		const { trackingType, showCommandPreview } = this.state;
		if (!trackingType && !showCommandPreview) {
			return;
		}
		this.setState({
			mentions: [],
			trackingType: '',
			commandPreview: [],
			showCommandPreview: false
		});
	};

	handleCommands = ({ event }: { event: any }) => {
		if (handleCommandTyping(event)) {
			if (this.focused) {
				Keyboard.dismiss();
			} else {
				this.component.focus();
			}
			this.focused = !this.focused;
		} else if (handleCommandSubmit(event)) {
			this.submit();
		} else if (handleCommandShowUpload(event)) {
			this.showMessageBoxActions();
		}
	};

	resetKeyboard = () => {
		this.closeMessageBoxActions();
		this.closeEmoji();
		this.tracking.resetTracking();
		setTimeout(() => this.component?.blur(), 100);
	};

	onPressSendToChannel = () => this.setState(({ tshow }) => ({ tshow: !tshow }));

	renderSendToChannel = () => {
		const { tshow } = this.state;
		const { theme, tmid, replyWithMention } = this.props;

		if (!tmid && !replyWithMention) {
			return null;
		}
		return (
			<TouchableWithoutFeedback
				style={[styles.sendToChannelButton, { backgroundColor: themes[theme].messageboxBackground }]}
				onPress={this.onPressSendToChannel}
				testID='messagebox-send-to-channel'
			>
				<CustomIcon name={tshow ? 'checkbox-checked' : 'checkbox-unchecked'} size={24} color={themes[theme].auxiliaryText} />
				<Text style={[styles.sendToChannelText, { color: themes[theme].auxiliaryText }]}>
					{I18n.t('Messagebox_Send_to_channel')}
				</Text>
			</TouchableWithoutFeedback>
		);
	};

	renderContent = () => {
		const {
			recording,
			showEmojiKeyboard,
			showAttachmentKeyboard,
			showSend,
			commandPreview,
			showCommandPreview,
			permissionToUpload,
			showComment
		} = this.state;
		const {
			editing,
			message,
			replying,
			replyCancel,
			user,
			getCustomEmoji,
			theme,
			Message_AudioRecorderEnabled,
			children,
			isActionsEnabled,
			tmid,
			federated,
			isBot,
			answering
		} = this.props;

		const isAndroidTablet: Partial<IThemedTextInput> =
			isTablet && isAndroid
				? {
						multiline: false,
						onSubmitEditing: this.submit,
						returnKeyType: 'send'
				  }
				: {};

		const recordAudio = !Message_AudioRecorderEnabled ? null : (
			<RecordAudio
				theme={theme}
				recordingCallback={this.recordingCallback}
				onFinish={this.finishAudioMessage}
				permissionToUpload={permissionToUpload}
			/>
		);

		const commandsPreviewAndMentions = !recording ? (
			<>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<BottomDrawerView
					modalVisible={showComment}
					PressToanimate={false}
					// if you don't pass HeaderContent you should pass marginTop in view of ContentModel to Make modal swipeable
					ContentModal={
						<Touchable
							style={{ width: '100%', height: '100%', justifyContent: 'flex-end', backgroundColor: '' }}
							onPress={() => {
								this.setState({ showComment: false });
							}}
						>
							<MessageBoxUserSelectView
								rid={this.props.rid}
								roomType={this.props.roomType}
								onCancel={() => {
									this.setState({ showComment: false });
								}}
								onSubmit={users => {
									this.onPressMentionWithUsers(users);
								}}
							/>
						</Touchable>
					}
					HeaderStyle={{
						marginTop: 0
					}}
					ContentModalStyle={{
						backgroundColor: 'clear',
						marginTop: 0
					}}
					onClose={() => {
						this.setState({ showComment: false });
					}}
				/>
			</>
		) : null;

		const replyPreview = !recording ? (
			<ReplyPreview
				message={message}
				close={replyCancel}
				username={user.username}
				replying={replying}
				getCustomEmoji={getCustomEmoji}
			/>
		) : null;

		const textInputAndButtons = !recording ? (
			<>
				<LeftButtons
					recordAudio={recordAudio}
					theme={theme}
					showEmojiKeyboard={showEmojiKeyboard}
					showAttachmentKeyboard={showAttachmentKeyboard}
					editing={editing}
					showMessageBoxActions={this.showMessageBoxActions}
					editCancel={this.editCancel}
					openEmoji={this.openEmoji}
					closeEmoji={this.closeEmoji}
					isActionsEnabled={isActionsEnabled}
				/>
				<TextInput
					ref={component => (this.component = component)}
					style={[styles.textBoxInput, { color: themes[theme].bodyText }]}
					returnKeyType='default'
					keyboardType='default'
					blurOnSubmit={false}
					placeholder={I18n.t('New_Message')}
					placeholderTextColor={themes[theme].auxiliaryText}
					onChangeText={this.onChangeText}
					onSelectionChange={this.onSelectionChange}
					underlineColorAndroid='transparent'
					defaultValue={this.text || ''}
					multiline
					testID={`messagebox-input${tmid ? '-thread' : ''}`}
					onFocus={() => this.closeMessageBoxActions()}
					{...isAndroidTablet}
				/>
				{/* {!editing && isActionsEnabled && (*/}
				{/*	<ToggleEmojiButton show={showEmojiKeyboard} open={this.openEmoji} close={this.closeEmoji} />*/}
				{/* )}*/}
				<RightButtons
					theme={theme}
					showSend={showSend}
					submit={this.submit}
					showMessageBoxActions={this.showMessageBoxActions}
					isActionsEnabled={isActionsEnabled}
					isBot={isBot}
					answering={answering}
				/>
			</>
		) : null;

		return (
			<>
				{commandsPreviewAndMentions}
				<View style={[styles.composer, { borderTopColor: themes[theme].borderColor }]}>
					{replyPreview}
					<View
						style={[
							styles.textArea,
							{ backgroundColor: themes[theme].messageboxBackground },
							!recording && editing && { backgroundColor: themes[theme].chatComponentBackground }
						]}
						testID='messagebox'
					>
						{/* {recordAudio}*/}
						{textInputAndButtons}
					</View>
					{this.renderSendToChannel()}
				</View>
				{children}
				<AttachmentKeyboard
					theme={theme}
					onItemSelected={this.onAttachmentItemSelected}
					federated={federated}
					roomType={this.props.roomType}
					showAppiaTag={this.room?.showAppiaTag}
					isShow={showAttachmentKeyboard}
				/>
			</>
		);
	};

	render() {
		// console.count(`${this.constructor.name}.render calls`);
		const { showEmojiKeyboard } = this.state;
		const { user, baseUrl, theme, iOSScrollBehavior } = this.props;
		return (
			<MessageboxContext.Provider
				value={{
					user,
					baseUrl,
					onPressMention: this.onPressMention,
					onPressCommandPreview: this.onPressCommandPreview,
					onPressNoMatchCanned: this.onPressNoMatchCanned
				}}
			>
				<KeyboardAccessoryView
					ref={(ref: any) => (this.tracking = ref)}
					renderContent={this.renderContent}
					kbInputRef={this.component}
					kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
					onKeyboardResigned={this.onKeyboardResigned}
					onItemSelected={this.onEmojiSelected}
					trackInteractive
					requiresSameParentToManageScrollView
					addBottomView
					bottomViewColor={themes[theme].messageboxBackground}
					iOSScrollBehavior={iOSScrollBehavior}
				/>
			</MessageboxContext.Provider>
		);
	}
}

const mapStateToProps = (state: any) => ({
	isMasterDetail: state.app.isMasterDetail,
	baseUrl: state.server.server,
	threadsEnabled: state.settings.Threads_enabled,
	user: getUserSelector(state),
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
	Message_AudioRecorderEnabled: state.settings.Message_AudioRecorderEnabled,
	uploadFilePermission: state.permissions['mobile-upload-file']
});

const dispatchToProps = {
	typing: (rid: any, status: any) => userTypingAction(rid, status),
	startChat: (hoster: IVChatHoster) => setStartVoiceChat(hoster)
};

export type MessageBoxType = MessageBox;

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(withActionSheet(MessageBox));
