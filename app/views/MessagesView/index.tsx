import React from 'react';
import { FlatList, Keyboard, NativeModules, Text, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/core';
import Spinner from 'react-native-loading-spinner-overlay';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { Q } from '@nozbe/watermelondb';
import FastImage from 'react-native-fast-image';

import CustomTabBar from '../../containers/CustomTabBar';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { BackButton } from '../../containers/HeaderButton';
// import getFileUrlFromMessage from '../../lib/methods/helpers/getFileUrlFromMessage';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { withActionSheet } from '../../containers/ActionSheet';
import SafeAreaView from '../../containers/SafeAreaView';
import getThreadName from '../../lib/methods/getThreadName';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import database from '../../lib/database';
import {
	IApplicationState,
	TMessageModel,
	IEmoji,
	ISubscription,
	SubscriptionType,
	IAttachment,
	IMessage,
	TAnyMessageModel,
	IUrl,
	IServerAttachment,
	IMessageFromServer,
	TSubscriptionModel,
	attachmentToPhoto
} from '../../definitions';
import { Services } from '../../lib/services';
import FileItemView from './FileItemView';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import debounce from '../../utils/debounce';
import log from '../../utils/log';
import SearchBox from '../../containers/SearchBox';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import { sanitizeLikeString } from '../../lib/database/utils';
import { compareServerVersion } from '../../lib/methods/helpers/compareServerVersion';
import { IRoomInfoParam } from '../SearchMessagesView';
import { OpenFile } from '../../lib/methods/openFile';
import { CustomIcon } from '../../containers/CustomIcon';
import { sendLoadingEvent } from '../../containers/Loading';

const QUERY_SIZE = 50;
interface IMessagesViewProps {
	user: {
		id: string;
		username: string;
		token: string;
	};
	baseUrl: string;
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'MessagesView'>,
		StackNavigationProp<MasterDetailInsideStackParamList>
	>;
	route: RouteProp<ChatsStackParamList, 'MessagesView'>;
	customEmojis: { [key: string]: IEmoji };
	theme: TSupportedThemes;
	showActionSheet: (params: { options: string[]; hasCancel: boolean }) => void;
	useRealName: boolean;
	isMasterDetail: boolean;
	serverVersion: string;
	enterpriseId: string;
	shimoWebUrl: string;
}

interface IMessagesViewState {
	loading: boolean;
	messages: (IMessageFromServer | TMessageModel | IMessage)[];
	fileMessages: (IMessageFromServer | TMessageModel | IMessage)[];
	mediaMessages: (IMessageFromServer | TMessageModel | IMessage)[];
	metionMessages: (IMessageFromServer | TMessageModel | IMessage)[];
	message?: IMessage;
	fileLoading: boolean;
	total: number;
	spinner: boolean;
	searchText: string;
	selectedIndex?: number;
	delayShow: boolean;
}

interface IParams {
	rid: string;
	t: SubscriptionType;
	tmid?: string;
	message?: TMessageModel;
	name?: string;
	fname?: string;
	prid?: string;
	room?: ISubscription;
	jumpToMessageId?: string;
	jumpToThreadId?: string;
	roomUserId?: string;
}

interface LoadFileParams {
	item: any;
}

class MessagesView extends React.Component<IMessagesViewProps, IMessagesViewState> {
	private rid: string;
	private t: SubscriptionType;
	// private content: any;
	private room?: ISubscription;
	private encrypted: boolean | undefined;
	private msgContent: any;
	private fileContent: any;
	private mediaContent: any;
	private mentionsContent: any;
	private initialIndex: number;

	constructor(props: IMessagesViewProps) {
		super(props);
		this.state = {
			loading: false,
			messages: [],
			fileMessages: [],
			mediaMessages: [],
			metionMessages: [],
			fileLoading: true,
			total: -1,
			spinner: false,
			searchText: '',
			selectedIndex: this.props.route.params.selectIndex,
			delayShow: this.props.route.params.selectIndex === 0 || !isAndroid
		};
		this.setHeader();
		this.offset = 0;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		// this.content = this.defineMessagesViewContent(props.route.params?.name);
		this.encrypted = props.route.params?.encrypted;
		this.initialIndex = props.route.params.selectIndex ? props.route.params.selectIndex : 0;
	}

	get currentContent() {
		const { selectedIndex } = this.state;
		if (selectedIndex === 0) {
			return this.getMsgContent;
		}
		if (selectedIndex === 1) {
			return this.getFileContent;
		}
		if (selectedIndex === 2) {
			return this.getMediaContent;
		}
		if (selectedIndex === 3) {
			return this.getMetionsContent;
		}
		return this.getMsgContent;
	}

	get getMsgContent() {
		if (!this.msgContent) {
			this.msgContent = this.defineMessagesViewContent('Messages');
		}
		return this.msgContent;
	}

	get getFileContent() {
		if (!this.fileContent) {
			this.fileContent = this.defineMessagesViewContent('Files');
		}
		return this.fileContent;
	}

	get getMediaContent() {
		if (!this.mediaContent) {
			this.mediaContent = this.defineMessagesViewContent('Media');
		}
		return this.mediaContent;
	}

	get getMetionsContent() {
		if (!this.mentionsContent) {
			this.mentionsContent = this.defineMessagesViewContent('Mentions');
		}
		return this.mentionsContent;
	}

	componentDidMount() {
		if (this.props.route.params.selectIndex === 0) {
			// this.getMessages('');
		} else if (isAndroid) {
			setTimeout(() => {
				this.setState({ delayShow: true });
				this.load();
			}, 100);
		} else {
			this.load();
		}
	}

	shouldComponentUpdate(nextProps: IMessagesViewProps, nextState: IMessagesViewState) {
		const { loading, messages, fileLoading, spinner, searchText } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.loading !== loading) {
			return true;
		}
		if (!dequal(nextState.messages, messages)) {
			return true;
		}
		if (fileLoading !== nextState.fileLoading) {
			return true;
		}
		if (nextState.searchText !== searchText) {
			return true;
		}
		if (spinner !== nextState.spinner) {
			return true;
		}
		return false;
	}

	setHeader = () => {
		const { navigation } = this.props;
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Messages'),
			headerLeft: () => <BackButton navigation={navigation} />
		});
	};

	navToRoomInfo = (navParam: IRoomInfoParam) => {
		const { navigation, user } = this.props;
		if (navParam.rid === user.id) {
			return;
		}
		navigation.navigate('RoomInfoView', navParam);
	};

	jumpToOtherMessage = async ({ item }: { item: IMessage }) => {
		const { navigation, isMasterDetail } = this.props;
		let params: IParams = {
			rid: this.rid,
			jumpToMessageId: item._id,
			t: this.t,
			room: this.room
		};
		if (item.tmid) {
			if (isMasterDetail) {
				navigation.navigate('DrawerNavigator');
			} else {
				navigation.pop(2);
			}
			params = {
				...params,
				tmid: item.tmid,
				name: await getThreadName(this.rid, item.tmid, item._id),
				t: SubscriptionType.THREAD
			};
			navigation.push('RoomView', params);
		} else {
			navigation.navigate('RoomView', params);
		}
	};

	findFileType = (url: string) => {
		const reg = url.split('.').pop();
		return reg;
	};

	findFileName = (title: string) => {
		const index = title.lastIndexOf('.');
		if (index === -1) {
			return title;
		}
		return title.substring(0, index);
	};

	loadFile = async ({ item }: LoadFileParams) => {
		if (item === null) return;

		const { user, baseUrl } = this.props;
		const attachment = {
			title: item.name,
			title_link: item.path
		} as IAttachment;

		if (item.typeGroup === 'video' || item.typeGroup === 'audio') {
			if (isIOS) {
				Keyboard.dismiss();
			}
			attachment.video_url = item.path;
			const photo = attachmentToPhoto(attachment);
			const JSToNativeManager = NativeModules?.JSToNativeManager;
			JSToNativeManager.showPhoto(photo);
			return;
		}

		this.setState(
			{
				spinner: true
			},
			() => {
				console.log('spinner open', this.state.spinner);
			}
		);
		// @ts-ignore
		const url = formatAttachmentUrl(item.url, user.id, user.token);
		await OpenFile(attachment, { downloadUrl: `${baseUrl}/file-proxy/${item._id}/${item.name}`, url });
		this.setState({ spinner: false });
	};

	defineMessagesViewContent = (name: string) => {
		const { user, baseUrl, theme, useRealName } = this.props;
		const renderItemCommonProps = (item: TAnyMessageModel) => ({
			item,
			baseUrl,
			user,
			author: item.u || item.user,
			timeFormat: 'MMM Do YYYY, h:mm:ss a',
			isEdited: !!item.editedAt,
			isHeader: true,
			isThreadRoom: true,
			attachments: item.attachments || [],
			useRealName,
			showAttachment: this.showAttachment,
			getCustomEmoji: this.getCustomEmoji,
			navToRoomInfo: this.navToRoomInfo,
			onPress: () => this.jumpToOtherMessage({ item }),
			rid: this.rid
		});
		return {
			// Files Messages Screen
			Files: {
				name: I18n.t('Files'),
				fetchFunc: async () => {
					const { fileMessages } = this.state;
					const result = await Services.searchFiles(this.rid, this.t, fileMessages.length, undefined, 'file');
					if (result.success) {
						return { ...result, messages: result.files };
					}
				},
				noDataMsg: I18n.t('No_files'),
				testID: 'room-files-view',
				renderItem: (item: any) => (
					<TouchableHighlight underlayColor={'#DDDDDD'} onPress={() => this.loadFile({ item })}>
						<View>
							<FileItemView
								sender={item?.user?.name ?? '员工服务'}
								date={item.uploadedAt}
								fileName={item.name}
								fileSize={item.size}
							></FileItemView>
						</View>
					</TouchableHighlight>
				)
			},
			// Media Messages Screen
			Media: {
				name: I18n.t('Media'),
				fetchFunc: async () => {
					const { mediaMessages } = this.state;
					const result = await Services.searchFiles(this.rid, this.t, mediaMessages.length, undefined, 'media');
					if (result.success) {
						return { ...result, messages: result.files };
					}
				},
				noDataMsg: I18n.t('No_files'),
				testID: 'room-files-view',
				renderItem: (item: any) => {
					const isVideo = item.typeGroup === 'video' || item.typeGroup === 'audio';
					return (
						<TouchableHighlight
							style={{ flex: 0.5, aspectRatio: 1.78, justifyContent: 'center', alignItems: 'center' }}
							underlayColor={'#DDDDDD'}
							onPress={() => this.loadFile({ item })}
						>
							{isVideo ? (
								<View
									style={{
										backgroundColor: themes[theme].videoBackground,
										width: '90%',
										height: '90%',
										justifyContent: 'center',
										alignItems: 'center'
									}}
								>
									<CustomIcon name='play-filled' size={54} color={themes[theme].buttonText} />
								</View>
							) : (
								<FastImage
									source={{ uri: item.url.replace('ufs/FileSystem:Uploads', 'file-proxy') }}
									style={{ width: '90%', height: '90%' }}
									resizeMode='cover'
								/>
							)}
						</TouchableHighlight>
					);
				}
			},
			// Mentions Messages Screen
			Mentions: {
				name: I18n.t('Mentions'),
				fetchFunc: () => {
					const { metionMessages } = this.state;
					return Services.getMessages(this.rid, this.t, { 'mentions._id': { $in: [user.id] } }, metionMessages.length);
				},
				noDataMsg: I18n.t('No_mentioned_messages'),
				testID: 'mentioned-messages-view',
				renderItem: (item: TAnyMessageModel) => <Message {...renderItemCommonProps(item)} msg={item.msg} theme={theme} />
			},
			// Starred Messages Screen
			Starred: {
				name: I18n.t('Starred'),
				fetchFunc: () => {
					const { messages } = this.state;
					return Services.getMessages(this.rid, this.t, { 'starred._id': { $in: [user.id] } }, messages.length);
				},
				noDataMsg: I18n.t('No_starred_messages'),
				testID: 'starred-messages-view',
				renderItem: (item: TAnyMessageModel) => (
					<Message {...renderItemCommonProps(item)} msg={item.msg} onLongPress={() => this.onLongPress(item)} theme={theme} />
				),
				action: (message: IMessage) => ({
					title: I18n.t('Unstar'),
					icon: message.starred ? 'star-filled' : 'star',
					onPress: this.handleActionPress
				}),
				handleActionPress: (message: IMessage) => Services.toggleStarMessage(message._id, message.starred)
			},
			// Pinned Messages Screen
			Pinned: {
				name: I18n.t('Pinned'),
				fetchFunc: () => {
					const { messages } = this.state;
					return Services.getMessages(this.rid, this.t, { pinned: true }, messages.length);
				},
				noDataMsg: I18n.t('No_pinned_messages'),
				testID: 'pinned-messages-view',
				renderItem: (item: TAnyMessageModel) => (
					<Message {...renderItemCommonProps(item)} msg={item.msg} onLongPress={() => this.onLongPress(item)} theme={theme} />
				),
				action: () => ({ title: I18n.t('Unpin'), icon: 'pin', onPress: this.handleActionPress }),
				handleActionPress: (message: IMessage) => Services.togglePinMessage(message._id, message.pinned)
			},
			// Messages Screen
			Messages: {
				name: '消息',
				fetchFunc: () => {},
				noDataMsg: I18n.t('No_results_found'),
				testID: 'search-messages-view',
				renderItem: (item: IMessageFromServer | TMessageModel) => {
					const message = item as TMessageModel;
					const { user, baseUrl, theme, useRealName } = this.props;
					return (
						<Message
							item={message}
							baseUrl={baseUrl}
							user={user}
							timeFormat='search'
							isThreadRoom
							showAttachment={this.showAttachment}
							getCustomEmoji={this.getCustomEmoji}
							navToRoomInfo={this.navToRoomInfo}
							useRealName={useRealName}
							theme={theme}
							onPress={() => this.jumpToMessage({ item })}
							jumpToMessage={() => this.jumpToMessage({ item })}
							rid={message.rid}
						/>
					);
				}
			}
		}[name];
	};

	// Handle encrypted rooms search messages
	searchMessages = async (searchText: string): Promise<(IMessageFromServer | TMessageModel)[]> => {
		if (!searchText) {
			return [];
		}
		// If it's a encrypted, room we'll search only on the local stored messages
		if (this.encrypted) {
			const db = database.active;
			const messagesCollection = db.get('messages');
			const likeString = sanitizeLikeString(searchText);
			return messagesCollection
				.query(
					// Messages of this room
					Q.where('rid', this.rid),
					// Message content is like the search text
					Q.where('msg', Q.like(`%${likeString}%`))
				)
				.fetch();
		}
		// If it's not a encrypted room, search messages on the server
		const result = await Services.searchMessages(this.rid, searchText, QUERY_SIZE, this.offset);
		if (result.success) {
			const urlRenderMessages = result.messages?.map(message => {
				if (message.urls && message.urls.length > 0) {
					message.urls = message.urls?.map((url, index) => {
						if (url.meta) {
							return {
								_id: index,
								title: url.meta.pageTitle,
								description: url.meta.ogDescription,
								image: url.meta.ogImage,
								url: url.url
							} as IUrl;
						}
						return {} as IUrl;
					});
				}
				return message;
			});
			return urlRenderMessages;
		}
		return [];
	};

	getMessages = async (searchText: string, debounced?: boolean) => {
		try {
			const messages = await this.searchMessages(searchText);
			this.setState(prevState => ({
				messages: debounced ? messages : [...prevState.messages, ...messages],
				loading: false
			}));
		} catch (e) {
			this.setState({ loading: false });
			log(e);
		}
	};

	jumpToMessage = async ({ item }: { item: IMessageFromServer | TMessageModel }) => {
		const { navigation } = this.props;
		let params: {
			rid: string;
			jumpToMessageId: string;
			t: SubscriptionType;
			room: TSubscriptionModel | undefined;
			tmid?: string;
			name?: string;
			fromSearch?: boolean;
		} = {
			rid: this.rid,
			jumpToMessageId: item._id,
			t: this.t,
			room: this.room as TSubscriptionModel,
			fromSearch: true
		};
		sendLoadingEvent({ visible: true, bgColor: true });
		if ('tmid' in item && item.tmid) {
			navigation.pop();
			params = {
				...params,
				tmid: item.tmid,
				name: await getThreadName(this.rid, item.tmid as string, item._id),
				t: SubscriptionType.THREAD
			};
			navigation.push('RoomView', params);
		} else {
			navigation.push('RoomView', params);
		}
	};

	load = async (tabChangeing?: boolean) => {
		const { messages, fileMessages, mediaMessages, metionMessages, total, loading, searchText, selectedIndex } = this.state;

		let currentMsgs = messages;
		if (selectedIndex === 1) {
			currentMsgs = fileMessages;
		} else if (selectedIndex === 2) {
			currentMsgs = mediaMessages;
		} else if (selectedIndex === 3) {
			currentMsgs = metionMessages;
		}
		if ((currentMsgs.length === total && !tabChangeing) || loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			if (selectedIndex !== 3 && searchText) {
				await this.searchFiles(searchText, currentMsgs.length);
			} else {
				const result = await this.currentContent.fetchFunc();
				if (result.success) {
					const urlRenderMessages = result.messages?.map((message: any) => {
						if (message.urls && message.urls.length > 0) {
							message.urls = message.urls?.map((url: any, index: any) => {
								if (url.meta) {
									return {
										_id: index,
										title: url.meta.pageTitle,
										description: url.meta.ogDescription,
										image: url.meta.ogImage,
										url: url.url
									} as IUrl;
								}
								return {} as IUrl;
							});
						}
						return message;
					});
					if (selectedIndex === 1) {
						this.setState({
							fileMessages: [...fileMessages, ...urlRenderMessages]
						});
					} else if (selectedIndex === 2) {
						this.setState({
							mediaMessages: [...mediaMessages, ...urlRenderMessages]
						});
					} else if (selectedIndex === 3) {
						this.setState({
							metionMessages: [...metionMessages, ...urlRenderMessages]
						});
					}
					this.setState({
						total: result.total,
						loading: false
					});
				}
			}
		} catch (error) {
			this.setState({ loading: false });
			console.warn('MessagesView -> catch -> error', error);
		}
	};

	onEndReached = async () => {
		const { serverVersion } = this.props;
		const { searchText, messages, loading } = this.state;
		if (
			messages.length < this.offset ||
			this.encrypted ||
			loading ||
			compareServerVersion(serverVersion, 'lowerThan', '3.17.0')
		) {
			return;
		}
		this.setState({ loading: true });
		this.offset += QUERY_SIZE;

		await this.getMessages(searchText);
	};

	getCustomEmoji = (name: string) => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	showAttachment = (attachment: IAttachment) => {
		// const { navigation } = this.props;
		// navigation.navigate('AttachmentView', { attachment });
		if (isIOS) {
			Keyboard.dismiss();
		}
		const photo = attachmentToPhoto(attachment);
		const JSToNativeManager = NativeModules?.JSToNativeManager;
		JSToNativeManager.showPhoto(photo);
	};

	onLongPress = (message: IMessage) => {
		this.setState({ message }, this.showActionSheet);
	};

	showActionSheet = () => {
		const { message } = this.state;
		const { showActionSheet } = this.props;
		showActionSheet({ options: [this.currentContent.action(message)], hasCancel: true });
	};

	handleActionPress = async () => {
		const { message } = this.state;

		try {
			const result = await this.currentContent.handleActionPress(message);
			if (result.success) {
				this.setState((prevState: IMessagesViewState) => ({
					messages: prevState.messages.filter((item: IMessage) => item._id !== message?._id),
					total: prevState.total - 1
				}));
			}
		} catch {
			// Do nothing
		}
	};

	setFileLoading = (fileLoading: boolean) => {
		this.setState({ fileLoading });
	};

	private offset: number;

	search = (searchText: string) => {
		const { selectedIndex } = this.state;
		this.offset = 0;
		this.setState({ searchText, loading: true });
		if (selectedIndex === 0) {
			this.setState({
				messages: []
			});
		} else if (selectedIndex === 1) {
			this.setState({
				fileMessages: []
			});
		} else if (selectedIndex === 2) {
			this.setState({
				mediaMessages: []
			});
		}

		this.searchDebounced(searchText, 0);
	};

	searchDebounced = debounce(async (searchText: string, offset: number) => {
		const { selectedIndex } = this.state;
		if (selectedIndex === 0) {
			await this.getMessages(searchText, true);
		} else if (selectedIndex === 1 || selectedIndex === 2) {
			await this.getFiles(searchText, offset);
		}
	}, 1000);

	getFiles = async (searchText: string, offset: number) => {
		try {
			await this.searchFiles(searchText, offset);
		} catch (e) {
			log(e);
		}
	};

	searchFiles = async (searchText: string, offset: number): Promise<IServerAttachment[]> => {
		// let response;
		const { fileMessages, mediaMessages, metionMessages, selectedIndex } = this.state;

		// if (!searchText) {
		// 	response = await Services.getFiles(this.rid, this.t, 0);
		// } else {
		let fileType = '';
		if (selectedIndex === 1) {
			fileType = 'file';
		} else if (selectedIndex === 2) {
			fileType = 'media';
		}

		const response = await Services.searchFiles(this.rid, this.t, offset, searchText, fileType);
		// }

		let result;
		if (response.success) {
			result = { ...response, messages: response.files };
		}

		if (result?.success) {
			const urlRenderMessages = result.messages?.map((message: any) => {
				if (message.urls && message.urls.length > 0) {
					message.urls = message.urls?.map((url: any, index: any) => {
						if (url.meta) {
							return {
								_id: index,
								title: url.meta.pageTitle,
								description: url.meta.ogDescription,
								image: url.meta.ogImage,
								url: url.url
							} as IUrl;
						}
						return {} as IUrl;
					});
				}
				return message;
			});
			if (selectedIndex === 1) {
				this.setState({
					fileMessages: [...fileMessages, ...urlRenderMessages]
				});
			} else if (selectedIndex === 2) {
				this.setState({
					mediaMessages: [...mediaMessages, ...urlRenderMessages]
				});
			} else if (selectedIndex === 3) {
				this.setState({
					metionMessages: [...metionMessages, ...urlRenderMessages]
				});
			}

			this.setState({
				total: result.total,
				loading: false
			});
		}
		return [];
	};

	renderEmpty = () => {
		const { theme } = this.props;
		return (
			<View
				style={[styles.listEmptyContainer, { backgroundColor: themes[theme].backgroundColor }]}
				testID={this.currentContent.testID}
			>
				<Text style={[styles.noDataFound, { color: themes[theme].titleText }]}>{this.currentContent.noDataMsg}</Text>
			</View>
		);
	};

	renderItem = (index: number, { item }: { item: IMessageFromServer | TMessageModel }) => {
		if (index === 0) {
			return this.getMsgContent.renderItem(item);
		}

		if (index === 1) {
			return this.getFileContent.renderItem(item);
		}
		if (index === 2) {
			return this.getMediaContent.renderItem(item);
		}

		if (index === 3) {
			return this.getMetionsContent.renderItem(item);
		}
		return this.getMsgContent.renderItem(item);
	};

	renderSearchBar = () => <SearchBox onChangeText={text => this.search(text)} />;

	renderList = (index: number) => {
		const { messages, fileMessages, mediaMessages, metionMessages, loading } = this.state;
		const { theme } = this.props;

		let currentMsgs = messages;
		if (index === 1) {
			currentMsgs = fileMessages;
		} else if (index === 2) {
			currentMsgs = mediaMessages.filter(item => item.category);
		} else if (index === 3) {
			currentMsgs = metionMessages;
		}
		return (
			<FlatList
				data={currentMsgs}
				ListHeaderComponent={index === 3 ? null : this.renderSearchBar}
				renderItem={item => this.renderItem(index, item)}
				numColumns={index === 2 ? 2 : 1}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				keyExtractor={item => item._id}
				onEndReached={index === 0 ? this.onEndReached : () => this.load}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
			/>
		);
	};

	render() {
		const { theme } = this.props;
		const { fileMessages, mediaMessages, metionMessages, delayShow, spinner } = this.state;
		// if (!loading && messages.length === 0 && searchText.length) {
		// 	return this.renderEmpty();
		// }
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor, flex: 1 }}>
				<StatusBar />
				{isAndroid ? (
					<Spinner visible={this.state.spinner} textContent={'Loading...'} textStyle={styles.spinnerTextStyle} />
				) : null}
				{isIOS && spinner ? <ActivityIndicator absolute size='large' /> : null}
				<View style={{ flex: 1 }}>
					{delayShow && (
						<ScrollableTabView
							initialPage={this.initialIndex}
							style={{ minHeight: 400 }}
							renderTabBar={() => <CustomTabBar theme={'black'}></CustomTabBar>}
							tabBarBackgroundColor='#fff'
							tabBarActiveTextColor='#2878ff'
							tabBarInactiveTextColor='black'
							tabBarUnderlineStyle={{ backgroundColor: '#2878ff' }}
							prerenderingSiblingsNumber={Infinity}
							onChangeTab={obj => {
								const curIndex = obj.i;
								this.setState(
									{
										selectedIndex: curIndex
									},
									() => {
										if (curIndex === 1 && fileMessages.length === 0) {
											this.load(true);
										}
										if (curIndex === 2 && mediaMessages.length === 0) {
											this.load(true);
										}
										if (curIndex === 3 && metionMessages.length === 0) {
											this.load(true);
										}
									}
								);
							}}
						>
							<View style={{ flex: 1 }} tabLabel={I18n.t('Messages')}>
								{this.renderList(0)}
							</View>
							<View style={{ flex: 1 }} tabLabel={I18n.t('Files')}>
								{this.renderList(1)}
							</View>
							<View style={{ flex: 1 }} tabLabel={I18n.t('Media')}>
								{this.renderList(2)}
							</View>
							<View style={{ flex: 1 }} tabLabel={I18n.t('Mentions')}>
								{this.renderList(3)}
							</View>
						</ScrollableTabView>
					)}
				</View>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	serverVersion: state.server.version,
	baseUrl: state.server.server,
	user: getUserSelector(state),
	customEmojis: state.customEmojis,
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail,
	enterpriseId: state.settings.Enterprise_ID,
	shimoWebUrl: state.settings.Shimo_Web_Url
});

export default connect(mapStateToProps)(withTheme(withActionSheet(MessagesView)));
