import { Q } from '@nozbe/watermelondb';
import { dequal } from 'dequal';
import moment from 'moment';
import React from 'react';
import { FlatListProps, View, ViewToken, StyleSheet, Platform, Text, InteractionManager, Animated } from 'react-native';
import { event, Value } from 'react-native-reanimated';
import { Observable, Subscription } from 'rxjs';
import LinearGradient from 'react-native-linear-gradient';
import { RefreshControl as GHRefreshControl } from 'react-native-gesture-handler';

import ActivityIndicator from '../../../containers/ActivityIndicator';
import { TAnyMessageModel, TMessageModel, TThreadMessageModel, TThreadModel } from '../../../definitions';
import database from '../../../lib/database';
import { ApprovalBot } from '../ButtonFooter';
import { compareServerVersion, debounce } from '../../../lib/methods/helpers';
import { animateNextTransition } from '../../../lib/methods/helpers/layoutAnimation';
import log from '../../../lib/methods/helpers/log';
import EmptyRoom from '../EmptyRoom';
import List, { IListProps, TListRef } from './List';
import NavBottomFAB from './NavBottomFAB';
import {
	NEXTCOUNT,
	isAndroid,
	loadMessagesForRoom,
	loadMissedMessages,
	loadNextMessages,
	loadThreadMessages
} from '../../../lib/methods';
import { Services } from '../../../lib/services';
import RefreshControl from './RefreshControl';
import Touch from '../../../utils/touch';
import AppIcon from '../../../containers/Icon/AppIcon';
import { sendLoadingEvent } from '../../../containers/Loading';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../../lib/constants';
import UnReadTop from './toUnReadTop';

const QUERY_SIZE = 50;
// const UNJOINED_QUERY_SIZE = 10;
const FADE = 'fade';

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

const onScroll = ({ y }: { y: Value<number> }) =>
	event(
		[
			{
				nativeEvent: {
					contentOffset: { y }
				}
			}
		],
		{ useNativeDriver: true }
	);

export { IListProps };

export interface IListContainerProps {
	renderRow: Function;
	rid: string;
	t: string;
	tmid?: string;
	loading: boolean;
	listRef: TListRef;
	hideSystemMessages?: string[];
	tunread?: string[];
	ignored?: string[];
	navigation: any; // TODO: type me
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	onJoin?: () => void;
	setShowWelcomeMsg?: (showWelcomeMsg: boolean) => void;
	onScrollBeginDrag?: () => void;
	unread: string;
}

interface IListContainerState {
	messages: TAnyMessageModel[];
	refreshing: boolean;
	highlightedMessage: string | null;
	inRoom: boolean;
	unreadNumber: number;
	unreadMsgId: string;
}

class ListContainer extends React.Component<IListContainerProps, IListContainerState> {
	private count = 0;
	private mounted = false;
	private animated = false;
	private jumping = false;
	private cancelJump = false;
	private isJumpList = false;
	private y = new Value(0);
	private onScroll = onScroll({ y: this.y });
	private unsubscribeFocus: () => void;
	private viewabilityConfig = {
		itemVisiblePercentThreshold: 70
	};
	private highlightedMessageTimeout: ReturnType<typeof setTimeout> | undefined | false;
	private thread?: TThreadModel;
	private messagesObservable?: Observable<TMessageModel[] | TThreadMessageModel[]>;
	private messagesSubscription?: Subscription;
	private viewableItems?: ViewToken[];
	private fastModeMessage?: any;
	private answering?: boolean;
	private listItemHeight = [];
	private jumpLoadNextTimeout: ReturnType<typeof setTimeout> | undefined | false;
	private jumpCancelRefreshingTimeout: ReturnType<typeof setTimeout> | undefined | false;
	private position: Animated.Value;

	constructor(props: IListContainerProps) {
		super(props);
		console.time(`${this.constructor.name} init`);
		console.time(`${this.constructor.name} mount`);
		this.state = {
			messages: [],
			refreshing: false,
			highlightedMessage: null,
			inRoom: false,
			unreadMsgId: '',
			unreadNumber: 9
		};

		this.position = new Animated.Value(0); // 初始化动画值

		this.getInRoom();
		this.init();
		this.query();
		this.unsubscribeFocus = props.navigation.addListener('focus', () => {
			this.animated = true;
		});
		console.timeEnd(`${this.constructor.name} init`);
	}

	getInRoom = async () => {
		try {
			const { rid } = this.props;
			const db = database.active;

			const subsCollection = db.get('subscriptions');
			const sub = await subsCollection.find(rid);
			this.setState({
				inRoom: !!sub
			});
		} catch (e) {
			console.info(e);
		}
	};

	setAnswering = (answering: boolean) => {
		this.answering = answering;
	};

	init = () => {
		const { rid } = this.props;
		Promise.resolve().then(async () => {
			const { message, unread } = await Services.getFirstUnread(rid);
			this.setState({
				unreadNumber: unread,
				unreadMsgId: message?._id || ''
			});
		});
	};
	componentDidMount() {
		this.mounted = true;
		console.timeEnd(`${this.constructor.name} mount`);
	}

	shouldComponentUpdate(nextProps: IListContainerProps, nextState: IListContainerState) {
		const { refreshing, highlightedMessage } = this.state;
		const { hideSystemMessages, tunread, ignored, loading } = this.props;
		if (loading !== nextProps.loading) {
			return true;
		}
		if (highlightedMessage !== nextState.highlightedMessage) {
			return true;
		}
		if (refreshing !== nextState.refreshing) {
			return true;
		}
		if (!dequal(hideSystemMessages, nextProps.hideSystemMessages)) {
			return true;
		}
		if (!dequal(tunread, nextProps.tunread)) {
			return true;
		}
		if (!dequal(ignored, nextProps.ignored)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps: IListContainerProps) {
		const { hideSystemMessages } = this.props;
		if (!dequal(hideSystemMessages, prevProps.hideSystemMessages)) {
			this.reload();
		}
	}

	componentWillUnmount() {
		this.unsubscribeMessages();
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		this.clearHighlightedMessageTimeout();
		this.clearJumpLoadNextTimeout();
		this.clearJumpCancelRefreshingTimeout();
		console.countReset(`${this.constructor.name}.render calls`);
	}

	//  回到顶部 逃离动画
	startAnimation = () => {
		Animated.timing(this.position, {
			toValue: 1,
			duration: 5000, // 动画持续时间，例如5秒
			useNativeDriver: true // 使用原生驱动
		}).start(() => this.position.setValue(0)); // 动画完成后重置位置
	};

	updateFastModeMessage = (message: any) => {
		this.fastModeMessage = message;
		this.update();
	};

	// clears previous highlighted message timeout, if exists
	clearHighlightedMessageTimeout = () => {
		if (this.highlightedMessageTimeout) {
			clearTimeout(this.highlightedMessageTimeout);
			this.highlightedMessageTimeout = false;
		}
	};

	clearJumpLoadNextTimeout = () => {
		if (this.jumpLoadNextTimeout) {
			clearTimeout(this.jumpLoadNextTimeout);
			this.jumpLoadNextTimeout = false;
		}
	};

	clearJumpCancelRefreshingTimeout = () => {
		if (this.jumpCancelRefreshingTimeout) {
			clearTimeout(this.jumpCancelRefreshingTimeout);
			this.jumpCancelRefreshingTimeout = false;
		}
	};

	query = async () => {
		if (this.isJumpList) {
			return;
		}
		const { rid, tmid, showMessageInMainThread, serverVersion } = this.props;
		// const { inRoom } = this.state;
		this.count += QUERY_SIZE;
		const db = database.active;

		// handle servers with version < 3.0.0
		let { hideSystemMessages = [] } = this.props;
		if (!Array.isArray(hideSystemMessages)) {
			hideSystemMessages = [];
		}

		if (tmid) {
			try {
				this.thread = await db.get('threads').find(tmid);
			} catch (e) {
				console.log(e);
			}
			this.messagesObservable = db
				.get('thread_messages')
				.query(Q.where('rid', tmid), Q.experimentalSortBy('ts', Q.desc), Q.experimentalSkip(0), Q.experimentalTake(this.count))
				.observe();
		} else if (rid) {
			const whereClause = [
				Q.where('rid', rid),
				Q.experimentalSortBy('ts', Q.desc),
				Q.experimentalSkip(0),
				Q.experimentalTake(this.count)
			] as (Q.WhereDescription | Q.Or)[];

			if (!showMessageInMainThread) {
				whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
			}
			this.messagesObservable = db
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		if (rid) {
			this.unsubscribeMessages();
			this.messagesSubscription = this.messagesObservable?.subscribe(messages => {
				if (tmid && this.thread) {
					messages = [...messages, this.thread];
				}
				/**
				 * Since 3.16.0 server version, the backend don't response with messages if
				 * hide system message is enabled
				 */
				if (compareServerVersion(serverVersion, 'lowerThan', '3.16.0') || hideSystemMessages.length) {
					messages = messages.filter(m => !m.t || !hideSystemMessages?.includes(m.t));
				}
				if (this.fastModeMessage && !this.answering) {
					this.fastModeMessage = undefined;
					this.update();
				}
				if (this.mounted) {
					this.setState({ messages }, () => {
						this.update();
					});
				} else {
					// @ts-ignore
					this.state.messages = messages;
				}
				const { setShowWelcomeMsg } = this.props;
				setShowWelcomeMsg && setShowWelcomeMsg(!(messages && messages.length > 0));

				// TODO: move it away from here
				this.readThreads();
			});
		}
	};

	reload = () => {
		this.count = 0;
		this.query();
	};

	readThreads = debounce(async () => {
		const { tmid } = this.props;

		if (tmid) {
			try {
				await Services.readThreads(tmid);
			} catch {
				// Do nothing
			}
		}
	}, 300);

	onEndReached = async () => {
		if (!this.isJumpList) {
			this.query();
		} else {
			const { messages, refreshing } = this.state;
			if (refreshing) {
				return;
			}
			const { rid, t } = this.props;
			if (messages.length) {
				const topMsg = messages[messages.length - 1];
				if (MESSAGE_TYPE_ANY_LOAD.includes(topMsg.t as MessageTypeLoad)) {
					try {
						const data = await loadMessagesForRoom({
							rid,
							t: t as any,
							latest: topMsg.ts as Date,
							loaderItem: topMsg,
							fromSearch: true
						});

						let result = [...messages.slice(0, -1), ...data];

						const { tmid, serverVersion } = this.props;
						if (tmid && this.thread) {
							result = [...result, this.thread];
						}

						let { hideSystemMessages = [] } = this.props;
						if (!Array.isArray(hideSystemMessages)) {
							hideSystemMessages = [];
						}
						/**
						 * Since 3.16.0 server version, the backend don't response with messages if
						 * hide system message is enabled
						 */
						if (compareServerVersion(serverVersion, 'lowerThan', '3.16.0') || hideSystemMessages.length) {
							result = messages.filter(m => !m.t || !hideSystemMessages?.includes(m.t));
						}

						if (this.fastModeMessage && !this.answering) {
							this.fastModeMessage = undefined;
							this.update();
						}

						result = result.map(item => {
							item.id = item._id;
							return item;
						});
						this.setState(
							{
								messages: result
							},
							() => this.update()
						);

						this.readThreads();
					} catch (error) {
						log(error);
					}
				}
			}
		}
	};

	onRefresh = () => {
		this.setState({ refreshing: true }, async () => {
			const { messages } = this.state;
			const { rid, tmid } = this.props;
			if (messages.length) {
				if (!this.isJumpList) {
					try {
						if (tmid) {
							await loadThreadMessages({ tmid, rid });
						} else {
							await loadMissedMessages({ rid, lastOpen: moment().subtract(7, 'days').toDate() });
						}
					} catch (e) {
						log(e);
					}
					this.setState({ refreshing: false });
				} else {
					const firstMsg = messages[0];
					if (MESSAGE_TYPE_ANY_LOAD.includes(firstMsg.t as MessageTypeLoad)) {
						const data = await loadNextMessages({
							rid,
							ts: this.timeToDate(firstMsg.ts),
							loaderItem: firstMsg,
							fromSearch: true
						});

						let result = [...data.reverse(), ...messages.slice(1)];

						if (!MESSAGE_TYPE_ANY_LOAD.includes(result[0].t as MessageTypeLoad)) {
							this.setState({ refreshing: false });
							this.isJumpList = false;
							this.query();
							return;
						}
						result = result.map(item => {
							item.id = item._id;
							return item;
						});
						this.setState(
							{
								messages: result
							},
							() => {
								this.listItemHeight = [];
								this.forceUpdate(() => {
									// const { listRef } = this.props;
									// // animateNextTransition();
									// // sendLoadingEvent({ visible: true });
									// // InteractionManager.runAfterInteractions(() => {
									// this.clearJumpLoadNextTimeout();
									// this.jumpLoadNextTimeout = setTimeout(() => {
									// 	listRef.current?.scrollToOffset({ offset: this.getAllHeight(NEXTCOUNT) - 50, animated: false });
									// 	// sendLoadingEvent({ visible: false });
									// 	this.clearJumpCancelRefreshingTimeout();
									// 	this.jumpCancelRefreshingTimeout = setTimeout(() => {
									// 		this.setState({ refreshing: false });
									// 	}, 1000);
									// }, 50);
								});

								// });
							}
						);
					}
				}
			}
		});
	};

	timeToDate = (dateOrString: any) => {
		if (dateOrString instanceof Date) {
			// 如果已经是Date对象，直接返回
			return dateOrString;
		}
		if (typeof dateOrString === 'string') {
			// 尝试将字符串解析为Date对象
			const parsedDate = new Date(dateOrString);
			// 检查解析结果是否是有效日期
			return parsedDate;
		}
		return new Date();
	};

	update = () => {
		if (this.animated) {
			animateNextTransition();
		}
		this.forceUpdate();
	};

	unsubscribeMessages = () => {
		if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
			this.messagesSubscription.unsubscribe();
		}
	};

	getLastMessage = (): TMessageModel | TThreadMessageModel | null => {
		const { messages } = this.state;
		if (messages.length > 0) {
			return messages[0];
		}
		return null;
	};

	handleScrollToIndexFailed: FlatListProps<any>['onScrollToIndexFailed'] = params => {
		const { listRef } = this.props;
		listRef.current?.scrollToIndex({ index: params.highestMeasuredFrameIndex, animated: false });
	};

	updateJumpMessages = (msgs: TAnyMessageModel[], messageId: string) => {
		this.unsubscribeMessages();
		this.isJumpList = true;
		this.jumping = true;
		this.cancelJump = false;
		this.setState(
			{
				messages: msgs.reverse()
			},
			() => {
				this.update();

				InteractionManager.runAfterInteractions(async () => {
					await Promise.race([this.jumpToMessage(messageId), new Promise(res => setTimeout(res, 15000))]);

					setTimeout(() => {
						this.cancelJumpToMessage();
						sendLoadingEvent({ visible: false });
					}, 300);
				});
			}
		);
	};

	jumpToMessage = (messageId: string) =>
		new Promise<void>(async resolve => {
			const { messages } = this.state;
			const { listRef } = this.props;
			// if jump to message was cancelled, reset variables and stop
			if (this.cancelJump) {
				this.resetJumpToMessage();
				return resolve();
			}
			this.jumping = true;
			sendLoadingEvent({ visible: true });

			// look for the message on the state
			const index = messages.findIndex(item => item._id === messageId);
			// if found message, scroll to it
			if (index > -1) {
				if (!this.isJumpList) {
					listRef.current?.scrollToIndex({ index, viewPosition: 0.5, viewOffset: 100 });
					// wait for scroll animation to finish
					await new Promise(res => setTimeout(res, 100));
				}

				// if message is not visible
				if (!this.viewableItems?.map(vi => vi.key).includes(messageId)) {
					// listRef.current?.scrollToEnd({ animated: false });
					listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: !this.isJumpList });
					await setTimeout(() => resolve(this.jumpToMessage(messageId)), this.isJumpList ? 50 : 100);
					return;
				}
				sendLoadingEvent({ visible: false });

				// if message is visible, highlight it
				this.setState({ highlightedMessage: messageId });
				this.clearHighlightedMessageTimeout();
				// clears highlighted message after some time
				this.highlightedMessageTimeout = setTimeout(() => {
					this.setState({ highlightedMessage: null });
				}, 3000);
				this.resetJumpToMessage();

				resolve();
			} else {
				// if message not found, wait for scroll to top and then jump to message
				listRef.current?.scrollToIndex({ index: messages.length - 1, animated: false });
				await setTimeout(() => resolve(this.jumpToMessage(messageId)), 300);
				sendLoadingEvent({ visible: false });
			}
		});

	resetJumpToMessage = () => {
		this.cancelJump = false;
		this.jumping = false;
	};

	cancelJumpToMessage = () => {
		if (this.jumping) {
			this.cancelJump = true;
			return;
		}
		this.resetJumpToMessage();
	};

	jumpToBottom = () => {
		const { listRef } = this.props;
		listRef.current?.scrollToOffset({ offset: -100 });
	};

	jumpToOffsetByShow = (show: boolean) => {
		console.info('文本键盘状态 = ', show);
		this.forceUpdate();

		const { listRef } = this.props;
		listRef.current?.forceUpdate();
	};

	getTopMsg = () => {
		const { messages } = this.state;
		if (messages && messages.length) {
			return messages[messages.length - 1];
		}
		return null;
	};

	renderHead = () => {
		const { rid } = this.props;
		if (rid.startsWith('approval.bot') || rid.endsWith('approval.bot')) return <ApprovalBot name={'approval.bot'} />;
		if (rid.startsWith('meeting.bot') || rid.endsWith('meeting.bot')) return <ApprovalBot name={'meeting.bot'} />;
		return null;
	};

	renderFooter = () => {
		const { rid, loading } = this.props;
		if (loading && rid) {
			return <ActivityIndicator />;
		}
		return null;
	};

	renderItem: FlatListProps<any>['renderItem'] = ({ item, index }) => {
		const { messages, highlightedMessage, inRoom } = this.state;
		const { renderRow, onJoin } = this.props;

		if (item.type === FADE && !inRoom) {
			return (
				<View style={[styles.inverted, { flexDirection: 'row', justifyContent: 'center', marginTop: 16, paddingTop: 8 }]}>
					<View style={[{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, paddingTop: 8 }]}>
						<AppIcon />
						<Text>最多预览10条消息， </Text>
						<Touch
							theme={'light'}
							onPress={() => {
								onJoin && onJoin();
								this.setState({
									inRoom: true
								});
							}}
						>
							<Text style={[{ color: '#1B5BFF' }]}>点击加入</Text>
						</Touch>
						<Text>可查看更多</Text>
					</View>

					<LinearGradient
						colors={['#F5F5F5', 'rgba(245,245,245,0.5)', 'rgba(245,245,245,0)']}
						style={[{ width: '100%', height: 250, position: 'absolute', marginTop: 52 }]}
					/>
				</View>
			);
		}

		return (
			<View onLayout={this.isJumpList ? e => this.handleLayout(e, index) : undefined} style={styles.inverted}>
				{renderRow(item, messages[index + 1], highlightedMessage)}
			</View>
		);
	};

	handleLayout = ({ nativeEvent: e }, index) => {
		if (this.isJumpList && index < NEXTCOUNT) {
			console.info(`onLayout===${index}===${e.layout.height}`);
			// this.listItemHeight[index] = e.layout.height; // 如果你需要按索引保存高度
			this.listItemHeight.push(e.layout.height); // 如果你只需要保存高度列表

			if (this.listItemHeight.length === NEXTCOUNT) {
				const { listRef } = this.props;
				// animateNextTransition();
				// sendLoadingEvent({ visible: true });

				listRef.current?.scrollToOffset({
					offset: this.getAllHeight(NEXTCOUNT) - 80,
					animated: false
				});

				// sendLoadingEvent({ visible: false });

				this.clearJumpCancelRefreshingTimeout(); // 假设这是一个清除定时器的方法
				this.jumpCancelRefreshingTimeout = setTimeout(() => {
					this.setState({ refreshing: false });
				}, 1000);
			}
		}
	};

	getAllHeight = (index: number) => {
		if (index > this.listItemHeight.length) {
			index = this.listItemHeight.length - 1;
		}
		let height = 0;
		for (const i in this.listItemHeight) {
			if (i < index) {
				height += this.listItemHeight[i];
			}
		}
		return height;
	};

	onViewableItemsChanged: FlatListProps<any>['onViewableItemsChanged'] = ({ viewableItems }) => {
		const { unreadMsgId, unreadNumber } = this.state;

		this.viewableItems = viewableItems;

		if (viewableItems.some(({ key, index }) => key === unreadMsgId && (index || 0) + 1 >= unreadNumber)) {
			this.toUnreadTop();
		}
	};
	//  到未读消息顶部时执行此方法隐藏提示
	toUnreadTop = (): void =>
		Animated.timing(this.position, {
			toValue: 1,
			duration: 1500,
			useNativeDriver: true
		}).start();

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { rid, tmid, listRef, onScrollBeginDrag } = this.props;
		const { messages, refreshing, inRoom, unreadMsgId, unreadNumber } = this.state;
		let newMessage = !inRoom && messages.length >= 10 ? [...messages, { type: FADE }] : [...messages];
		if (this.fastModeMessage) {
			newMessage = [this.fastModeMessage, ...newMessage];
		}

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} mounted={this.mounted} />
				<UnReadTop
					lastUnreadMsgId={unreadMsgId}
					unread={unreadNumber}
					jumpToMessage={this.jumpToMessage}
					toUnreadTop={this.toUnreadTop}
					position={this.position}
				/>
				<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh}>
					<List
						onScroll={this.onScroll}
						scrollEventThrottle={16}
						listRef={listRef}
						data={newMessage}
						refreshControl={
							isAndroid ? <GHRefreshControl onRefresh={this.onRefresh} refreshing={refreshing} enabled={true} /> : undefined
						}
						fromSearch={this.isJumpList}
						renderItem={this.renderItem}
						ListHeaderComponent={this.renderHead}
						onEndReached={this.onEndReached}
						ListFooterComponent={this.renderFooter}
						onScrollToIndexFailed={this.handleScrollToIndexFailed}
						onViewableItemsChanged={this.onViewableItemsChanged}
						viewabilityConfig={this.viewabilityConfig}
						onScrollBeginDrag={() => {
							onScrollBeginDrag && onScrollBeginDrag();
						}}
					/>
				</RefreshControl>
				{this.isJumpList ? null : <NavBottomFAB y={this.y} onPress={this.jumpToBottom} isThread={!!tmid} />}
			</>
		);
	}
}

export type ListContainerType = ListContainer;

export default ListContainer;
