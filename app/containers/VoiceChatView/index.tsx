import React, { createRef } from 'react';
import {
	Animated as RNAnimated,
	Dimensions,
	Image,
	Keyboard,
	PanResponder,
	PanResponderInstance,
	PermissionsAndroid,
	TouchableOpacity,
	View,
	Vibration,
	NativeModules
} from 'react-native';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { ChannelProfileType, ClientRoleType, createAgoraRtcEngine, IRtcEngine, RtcStats } from 'react-native-agora';
import { RtcConnection } from 'react-native-agora/src/IAgoraRtcEngineEx';
import { ErrorCodeType, UserOfflineReasonType } from 'react-native-agora/src/AgoraBase';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
// eslint-disable-next-line import/no-unresolved
import InCallManager from 'react-native-incall-manager';

import { IApplicationState, IBaseScreen, IUser, SubscriptionType } from '../../definitions';
import { isAndroid } from '../../utils/deviceInfo';
import { getUserSelector } from '../../selectors/login';
import { TopLeftIcon } from './components/Icon';
import { setAcceptCall, setCloseChat, setIsConnect } from '../../actions/chat';
import Server from './server';
import { IVChatCallMsg, IVChatHoster, IVChatStatusType, IVCReceiveUser, IVCUser } from '../../definitions/IVChat';
import { Services } from '../../lib/services';
import { ILogin } from '../../reducers/login';
import EventEmitter from '../../lib/methods/helpers/events';
import { showToast } from '../../lib/methods/helpers/showToast';
import BottomToast, { showBottomToast } from './components/bottomToast';
import UserListView from './components/userListView';
import UnAcceptCenterView from './components/unAcceptCenterView';
import ContainerView from './components/containerView';
import UnConnectedView from './components/unConnectedView';
import ConnectedView from './components/connectedView';
import ConnectStatusText, { showConnectStatus } from './components/connectStatusText';
import ConnectTimeView from './components/connectTimeView';
import I18n from '../../i18n';

const { JSToNativeManager } = NativeModules;

export const HOSTER_OPEN_VOICECHAT_EMITTER = 'Hoster_VoiceChat_Open';
export const RECEIVER_OPEN_VOICECHAT_EMITTER = 'Receiver_VoiceChat_Open';

export const JOIN_VOICECHAT_EMITTER = 'VoiceChat_Join';
export const CLOSE_VOICECHAT_EMITTER = 'VoiceChat_Close';

interface VCState {
	pan: RNAnimated.ValueXY;
	panResponder: null | PanResponderInstance;
	left: number;
	bottom: number;
	leftAnimation: any;
	bottomAnimation: any;
	tansformAni: any;
	smallOpAn: any;
	isSmall: boolean;
	lastBottom: number;
	lastLeft: number;
	btnEnable: boolean;
	agoraEngineRef: any;
	isJoined: boolean;
	remoteUid: number;
	token: string;
	receiveUsers: IVCReceiveUser[];
	usersData: IVCUser[];
	muteLocalAudioStream: boolean;
	enableSpeakerphone: boolean;
	isOpenChat: boolean;
	isStartTheClock: boolean;
	isAccept: boolean;
	isConnect: boolean;
}

interface VCProps extends IBaseScreen<any, any> {
	allowCenter?: boolean;
	user: IUser;
	login: ILogin;
	insets: { left: number; bottom: number; right: number; top: number };
	userid: string;
	channelId: string;
	userNames: string[];
	org: string;
	hoster: IVChatHoster;
	callMsg: IVChatCallMsg;
	onCallStatus: boolean;
	isOpenChat: boolean;
}

class VoiceChatView extends React.Component<VCProps, VCState> {
	private smallSize = 60;
	private startX = 0;
	private startY = 0;
	private duration = 300;
	private defualIsSmall = false;
	private appId = '';
	private localUid = 0;

	private hosterOpenListener: any;
	private receiverOpenListener: any;
	private joinListener: any;
	private closeListener: any;
	private isCancelCall: boolean;
	private recordId = '';
	private isHost = false;
	private roomMembers: any = null;
	private callStartTime: any;
	private callTimeOut: any;
	private cancelTimeOut: any;

	constructor(props: VCProps) {
		super(props);
		this.state = {
			pan: new RNAnimated.ValueXY(),
			panResponder: null,
			left: 0,
			bottom: 80,
			isSmall: this.defualIsSmall,
			tansformAni: new RNAnimated.Value(this.defualIsSmall ? 0 : 1),
			leftAnimation: new RNAnimated.Value(0),
			bottomAnimation: new RNAnimated.Value(0),
			smallOpAn: new RNAnimated.Value(this.defualIsSmall ? 1 : 0),
			lastBottom: 0,
			lastLeft: 0,
			btnEnable: true,
			agoraEngineRef: createRef<IRtcEngine>(),
			isJoined: false,
			remoteUid: 0,
			token: '',
			receiveUsers: [],
			usersData: [],
			muteLocalAudioStream: false,
			enableSpeakerphone: false,
			isOpenChat: false,
			isStartTheClock: false,
			isAccept: false,
			isConnect: false
		};

		this.closeListener = EventEmitter.addEventListener(CLOSE_VOICECHAT_EMITTER, this.closeChatView);
		this.joinListener = EventEmitter.addEventListener(JOIN_VOICECHAT_EMITTER, this.joinChat);
		this.hosterOpenListener = EventEmitter.addEventListener(HOSTER_OPEN_VOICECHAT_EMITTER, this.hosterOpenEvent);
		this.receiverOpenListener = EventEmitter.addEventListener(RECEIVER_OPEN_VOICECHAT_EMITTER, this.receiverOpenEvent);

		this.isCancelCall = false;
	}

	shouldComponentUpdate(nextProps: VCProps): boolean {
		if (nextProps.callMsg !== this.props.callMsg) {
			this.updateUserData(nextProps);
		}
		return true;
	}

	componentDidMount() {
		const panResponder = this.createPanResponder();
		this.setState({ panResponder });

		Audio.setAudioModeAsync({
			allowsRecordingIOS: false,
			playsInSilentModeIOS: false,
			staysActiveInBackground: true,
			shouldDuckAndroid: true,
			playThroughEarpieceAndroid: true,
			interruptionModeIOS: InterruptionModeIOS.DuckOthers,
			interruptionModeAndroid: InterruptionModeAndroid.DoNotMix
		});
	}
	componentWillUnmount() {
		EventEmitter.removeListener(CLOSE_VOICECHAT_EMITTER, this.closeListener);
		EventEmitter.removeListener(JOIN_VOICECHAT_EMITTER, this.joinListener);
		EventEmitter.removeListener(HOSTER_OPEN_VOICECHAT_EMITTER, this.hosterOpenListener);
		EventEmitter.removeListener(RECEIVER_OPEN_VOICECHAT_EMITTER, this.receiverOpenListener);
		this.state.agoraEngineRef.current?.release();
	}
	componentDidUpdate(prevProps: VCProps, preState: VCState) {
		if (prevProps.callMsg !== this.props.callMsg) {
			this.updateUserData(this.props);
			if (this.isHost) {
				if (this.props.callMsg && this.props.callMsg.status === IVChatStatusType.TALKING) {
					showConnectStatus(I18n.t('Voice_Chat_Call_Connecting'), 0);
				}
				if (this.props.callMsg?.userStatus && this.props.callMsg.userStatus.length > 0) {
					const users = this.props.callMsg.userStatus.filter(
						user => user.username !== this.props.user.username && user.operation && user.operation === 'waiting'
					);
					if (users.length > 0 && !this.state.isConnect) {
						const time = new Date().getTime();
						console.info(`拨号时间：${time - this.callStartTime} 毫秒`);
						showConnectStatus(I18n.t('Voice_Chat_Call_Waiting'), 0);
					}
				}
			}
		}
		if (preState.isConnect !== this.state.isConnect && this.state.isConnect) {
			ReactNativeHapticFeedback.trigger('selection', {
				enableVibrateFallback: true,
				ignoreAndroidSystemSettings: false
			});
			this.stopAudio();
		}

		if (prevProps.onCallStatus !== this.props.onCallStatus && !this.props.onCallStatus) {
			if (this.props.callMsg?.status === IVChatStatusType.REJECT) {
				showBottomToast('对方已拒绝', 1000);
			}
			this.closeChatView();
		}
	}

	updateUserData = async (props: VCProps) => {
		const { callMsg } = props;
		const membersResult = await this.getRoomMembers(callMsg.roomId, callMsg.roomType);

		const users: IVCUser[] = [];

		callMsg?.userStatus?.forEach(item => {
			const res = membersResult.filter((user: any) => user.username === item.username);
			let flag: boolean = res && res.length > 0 && item.operation !== 'reject' && item.operation !== 'hangup';

			if (callMsg.roomType === 'd') {
				flag = item.username !== this.props.user.username && res && res.length > 0;
			}
			if (flag) {
				const item2 = res[0];
				item2.status = item.status;
				users.push(item2);
			}
		});
		this.setState({ usersData: [...users] });
	};

	setupVideoSDKEngine = () => {
		try {
			this.state.agoraEngineRef.current = createAgoraRtcEngine();
			const agoraEngine = this.state.agoraEngineRef.current;

			// 初始化引擎
			agoraEngine.initialize({
				appId: this.appId
			});

			// 注册回调事件
			agoraEngine.registerEventHandler({
				onJoinChannelSuccess: () => {
					this.state.agoraEngineRef.current.setEnableSpeakerphone(this.state.enableSpeakerphone);
					InCallManager.setForceSpeakerphoneOn(this.state.enableSpeakerphone);
					this.state.agoraEngineRef.current.muteLocalAudioStream(this.state.muteLocalAudioStream);
					if (!this.isHost) {
						this.props.dispatch(setIsConnect(true));
						this.setState({ isStartTheClock: true, isConnect: true });
					}
				},
				onRejoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
					console.info(`重新成功加入频道：${connection.channelId} elapsed = ${elapsed}`);
				},
				onUserJoined: async (connection: RtcConnection, remoteUid: number, elapsed: number) => {
					console.info(`远端用户 ${remoteUid} 已加入  elapsed = ${elapsed} channelId = ${connection.channelId}`);
					console.info('userinfo = ', agoraEngine.getUserInfoByUid(remoteUid));
					this.stopAudio();
					this.setState({ remoteUid, isConnect: true });
					this.props.dispatch(setIsConnect(true));
					this.state.agoraEngineRef?.current?.enableLocalAudio(true);
					if (this.props.callMsg.recordData?.receivers && this.props.callMsg.recordData.receivers?.length > 1) {
						const members = await this.getRoomMembers(this.props.callMsg.roomId, this.props.callMsg.roomType);
						const user = this.props.callMsg.recordData.receivers.filter(user => user.receiverUid === remoteUid);
						if (user && user.length > 0 && members && members.length > 0) {
							const res = members.filter((item: any) => item.username === user[0].receiver);
							if (res && res.length > 0) {
								showBottomToast(`${res[0].name} 已接通`, 1000);
							}
						}
					} else {
						showBottomToast('已接通', 1000);
					}

					if (this.isHost) {
						this.setState({ isStartTheClock: true });
					}

					this.cleanTimer();
				},
				onUserOffline: async (connection: RtcConnection, remoteUid: number, reason: UserOfflineReasonType) => {
					console.info(`远端用户 ${remoteUid}已离开频道  reason = ${reason}`);
					if (this.props.callMsg.recordData?.receivers && this.props.callMsg.recordData.receivers?.length > 1) {
						const members = await this.getRoomMembers(this.props.callMsg.roomId, this.props.callMsg.roomType);
						const user = this.props.callMsg.recordData.receivers.filter(user => user.receiverUid === remoteUid);
						if (user && user.length > 0 && members && members.length > 0) {
							const res = members.filter((item: any) => item.username === user[0].receiver);
							if (res && res.length > 0) {
								showBottomToast(`${res[0].name} 已离开`, 1000);
							}
						}
					}
				},
				onLeaveChannel: (connection: RtcConnection, stats: RtcStats) => {
					console.info(`本地用以离开 ${stats.duration}`);
				},
				onTokenPrivilegeWillExpire: (connection: RtcConnection, token: string) => {
					console.info(`token ${token}即将过期`);
					// this.fetchToken();
				},
				onRequestToken: (connection: RtcConnection) => {
					console.info(`已过期 channelId = ${connection.channelId}  uid = ${connection.localUid}`);
				},
				onError: (err: ErrorCodeType, msg: string) => {
					console.info(`err = ${err}  mesg = ${msg}`);
				},
				onUserMuteAudio: (connection: RtcConnection, remoteUid: number, muted: boolean) => {
					console.info(`远端用户开启了/关闭了音频通道,remoteUid = ${remoteUid}  muted = ${muted}`);
				}
			});

			agoraEngine.enableAudio();
		} catch (e) {
			console.error('初始化失败', e);
		}
	};

	joinChat = async () => {
		const hasPermission = await this.requestMicrophonePermission();
		if (hasPermission) {
			if (!this.state.agoraEngineRef.current) {
				this.setupVideoSDKEngine();
			}
			const userStatus = this.props.callMsg.userStatus?.filter(u => u.username === this.props.user.username);
			if (this.state.isOpenChat || (userStatus && userStatus.length > 0 && userStatus[0].status === 'in')) {
				showToast('已在通话中');
			} else {
				Keyboard.dismiss();
				this.isHost = false;
				this.setState({ isAccept: true, isConnect: false, isOpenChat: true });
				this.isCancelCall = false;
				this.startChat();
				Server.joinChannel(this.props.org, this.props.callMsg.recordData?.recordId, this.props.user.username);
				this.stopAudio();
			}
		}
	};

	hosterOpenEvent = async ({ hoster }: { hoster: IVChatHoster | undefined }) => {
		const hasPermission = await this.requestMicrophonePermission();
		if (hasPermission) {
			if (!this.state.agoraEngineRef.current) {
				this.setupVideoSDKEngine();
			}
			this.callStartTime = new Date().getTime();
			this.isHost = true;
			if (hoster) {
				await this.loadHosterData(hoster);
			}
			this.showChatView();
			this.callTimeOut = setTimeout(() => {
				if (this.state.isOpenChat && !this.state.isConnect) {
					showConnectStatus(I18n.t('Voice_Chat_Call_Not_Connect'), 0);
				}
			}, 30 * 1000);

			this.cancelTimeOut = setTimeout(() => {
				if (this.state.isOpenChat && !this.state.isConnect) {
					this.closePress();
				}
			}, 60 * 1000);
		}
	};

	cleanTimer = () => {
		if (this.callTimeOut) {
			clearTimeout(this.callTimeOut);
			this.callTimeOut = null;
		}
		if (this.cancelTimeOut) {
			clearTimeout(this.cancelTimeOut);
			this.cancelTimeOut = null;
		}
	};

	receiverOpenEvent = async ({ isAccept }: { isAccept: boolean }) => {
		const hasPermission = await this.requestMicrophonePermission();
		if (hasPermission) {
			if (!this.state.agoraEngineRef.current) {
				this.setupVideoSDKEngine();
			}
			if (!this.state.isOpenChat) {
				Keyboard.dismiss();
				this.isHost = false;
				this.setState({ isAccept, isConnect: false, isOpenChat: true });
				this.isCancelCall = false;
				if (isAccept) {
					this.startChat();
				}
			}
		}
	};

	requestMicrophonePermission(): Promise<boolean> {
		return new Promise(async (resolve, reject) => {
			try {
				if (isAndroid) {
					const result = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]);
					if (result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED) {
						resolve(false);
						showToast('请授权麦克风权限');
					} else {
						resolve(true);
					}
				} else {
					const granted = await JSToNativeManager.requestMicrophonePermission();
					if (granted) {
						console.log('Microphone permission granted');
						resolve(true);
					} else {
						console.info('Microphone permission denied');
						showToast('请授权麦克风权限');
						resolve(false);
					}
				}
			} catch (error) {
				console.error('Error requesting microphone permission', error);
				showToast('请授权麦克风权限');
				reject(error);
			}
		});
	}

	showChatView = () => {
		if (!this.state.isOpenChat) {
			Keyboard.dismiss();
			this.setState({ isConnect: false, isOpenChat: true });
			this.isCancelCall = false;
			if (this.isHost || this.state.isAccept) {
				this.startChat();
			}
			if (this.isHost) {
				InCallManager.setForceSpeakerphoneOn(true);
				setTimeout(() => {
					// 开始通话时
					if (!this.isCancelCall) {
						InCallManager.start({ media: 'audio', ringback: '_BUNDLE_' });
					}
				}, this.duration);
			}
		}
	};

	loadHosterData = async (hoster: IVChatHoster) => {
		const membersResult = await this.getRoomMembers(hoster.roomId, hoster.roomType);
		const users: IVCUser[] = [];

		if (hoster.roomType !== 'd') {
			for (let i = 0; i < membersResult.length; i++) {
				if (this.props.user.username === membersResult[i].username) {
					const item = membersResult[i] as IVCUser;
					users.push(item);
					break;
				}
			}
		}

		hoster.receivers.forEach(user => {
			for (let i = 0; i < membersResult.length; i++) {
				if (user.receiver === membersResult[i].username) {
					const item = membersResult[i] as IVCUser;
					users.push(item);
					break;
				}
			}
		});

		this.setState({ usersData: users });
	};

	getRoomMembers = async (roomId: string, roomType: string) => {
		if (this.roomMembers && this.roomMembers.roomId && this.roomMembers.roomId === roomId) {
			return this.roomMembers.members;
		}
		const members = (await Services.getRoomMembers({
			rid: roomId,
			roomType: roomType as SubscriptionType,
			type: 'all',
			filter: '',
			skip: 0,
			limit: 0,
			allUsers: true
		})) as IVCUser[];
		this.roomMembers = { roomId, members };
		return this.roomMembers.members;
	};

	startChat = () => {
		const { callMsg, org } = this.props;
		let channelId: string | undefined = Date.parse(new Date().toString()).toString();
		let uid = this.localUid;
		this.setState({ isStartTheClock: false });

		if (!this.isHost) {
			channelId = callMsg.recordData?.channelId;
			callMsg.recordData?.receivers?.forEach(a => {
				if (a.receiver === this.props.user.username) {
					uid = a.receiverUid;
				}
			});
			this.recordId = callMsg.recordData?.recordId ? callMsg.recordData.recordId : '';
		}
		Server.fetchShengWangToken(channelId, uid, org)
			.then(res => {
				if (res.data) {
					if (!this.isCancelCall) {
						this.setState({ token: res.data });
						if (this.isHost) {
							this.informServer(channelId);
							this.state.agoraEngineRef.current.enableLocalAudio(false);
						} else {
							this.state.agoraEngineRef.current.enableLocalAudio(true);
						}
						this.joinChannel(channelId, uid);
					}
				} else {
					console.info('获取appia token失败');
					this.cancel();
				}
			})
			.catch(err => {
				console.info(err);
				this.cancel();
			});
	};

	cancel = () => {
		this.closeChatView();
		this.isCancelCall = true;
		this.stopAudio();
	};

	joinChannel = (channelId: string | undefined, uid: number) => {
		if (this.state.isJoined) {
			return;
		}
		try {
			// 加入频道后设置频道场景类型为直播场景
			this.state.agoraEngineRef.current?.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
			// 调用 joinChannel 方法加入频道
			this.state.agoraEngineRef.current?.joinChannel(this.state.token, channelId, uid, {
				// 设置用户角色为主播
				clientRoleType: ClientRoleType.ClientRoleBroadcaster
			});
			this.setState({ isJoined: true });
		} catch (e) {
			console.log(e);
		}
	};

	leave = () => {
		try {
			// 调用 leaveChannel 方法离开频道
			if (this.state.isJoined) {
				this.state.agoraEngineRef.current?.leaveChannel();
				this.setState({ remoteUid: 0, isJoined: false, isStartTheClock: false });
			}
			console.info('已离开频道');
		} catch (e) {
			console.info(e);
		}
	};

	informServer = (channelId: string | undefined) => {
		const { hoster, org } = this.props;

		if (!this.props.hoster.roomId) {
			return;
		}
		const receivers: IVCReceiveUser[] = [];

		const timeNum = Number(this.timetrans());

		for (let i = 0; i < hoster.receivers.length; i++) {
			receivers.push({
				receiver: hoster.receivers[i].receiver,
				receiverAppiaId: hoster.receivers[i].receiverAppiaId,
				receiverUid: timeNum + i
			} as IVCReceiveUser);
		}
		this.setState({ receiveUsers: receivers });
		if (!this.isCancelCall) {
			const beforeInformTime = new Date().getTime();
			console.info(`发起到通知服务器前的时间 = ${beforeInformTime - this.callStartTime} 毫秒`);
			Server.informServer(
				channelId,
				this.props.login.user.username,
				this.props.login.user.id,
				this.localUid,
				org,
				this.state.receiveUsers,
				hoster.roomId,
				hoster.roomType
			).then(res => {
				console.info('通知成功 = ', res);
				console.info(`informServer = ${new Date().getTime() - beforeInformTime} 毫秒`);
				if (res.data.status === 1) {
					if (!this.isCancelCall) {
						if (res && res.code === '0') {
							this.recordId = res.data.recordId;
						} else if (res.code === 40002) {
							console.info('token 无效');
							this.cancel();
						}
					} else {
						Server.updateChannelStatus(res.data.recordId, IVChatStatusType.CANCEL, org).then(res => {
							console.info('取消成功2 = ', res);
						});
					}
				} else {
					showBottomToast(res.data.message);
					this.cancel();
				}
			});
		}
	};

	closeChatView = () => {
		showConnectStatus('通话结束', 0);
		this.stopAudio();
		this.leave();
		this.setState({ isOpenChat: false });
		this.roomMembers = null;
		this.cleanTimer();
		if (!this.state.isSmall) {
			this.setState({ usersData: [], enableSpeakerphone: false, muteLocalAudioStream: false });
			this.props.dispatch(setCloseChat());
		} else {
			RNAnimated.timing(this.state.smallOpAn, {
				toValue: 0,
				duration: this.duration,
				useNativeDriver: false
			}).start(() => {
				this.changeToBigView();
				this.setState({ usersData: [], enableSpeakerphone: false, muteLocalAudioStream: false });
				this.props.dispatch(setCloseChat());
			});
		}
	};

	timetrans = () => {
		const date = new Date();
		const h = `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}`;
		const m = `${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}`;
		const s = `${date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()}`;
		const ss = date.getMilliseconds() < 10 ? `0${date.getMilliseconds()}` : date.getMilliseconds();
		return h + m + s + ss;
	};

	createPanResponder = () =>
		PanResponder.create({
			// 在onMoveShouldSetPanResponder修改一下，以此来判断用户是点击 还是 拖拽
			onMoveShouldSetPanResponder: (_, gestureState) => {
				this.startX = this.state.left; // 起始位置
				this.startY = this.state.bottom;
				// 解决PanResponder中的onPress无作用, 当大于5时才进入移动事件，有的情况下需要将onStartShouldSetPanResponderCapture设为false
				if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
					return true;
				}
				if (Math.abs(gestureState.dx) <= 5 || Math.abs(gestureState.dy) <= 5) {
					return false;
				}
				return false;
			},
			// 开始手势操作
			onPanResponderGrant: () => {
				// @ts-ignore
				this.state.pan.setOffset({ x: this.state.pan.x._value, y: this.state.pan.y._value });
				console.info('点击');
			},
			// 用户开始移动
			onPanResponderMove: (_, g) => {
				console.info(g);
				let left = this.startX + g.dx; // 距离左侧距离
				let bottom = this.startY - g.dy; // 距离底部距离
				// 边界处理
				if (left <= 0) {
					left = 0;
				}
				left = this.getSafeLeft(left);
				bottom = this.getSafeBottom(bottom);

				this.setState({
					left,
					bottom
				});
			},
			// 用户放开了所有的触摸点
			onPanResponderRelease: () => {
				const screen = Dimensions.get('window');
				this.startX = this.state.left > screen.width / 2 ? screen.width - this.smallSize : 0;
				this.startY = this.state.bottom;
				this.state.pan.flattenOffset();
				this.setState({ left: this.startX });
			}
		});

	getSafeLeft = (left: number): number => {
		const screen = Dimensions.get('window');
		if (left >= screen.width - this.smallSize) {
			return screen.width - this.smallSize;
		}
		return left;
	};

	getSafeBottom = (bottom: number): number => {
		const screen = Dimensions.get('window');
		const { insets } = this.props;

		if (bottom <= insets.bottom + 50) {
			bottom = insets.bottom + 50;
		}
		const insetsTop = isAndroid ? insets.top + 30 : insets.top;
		if (bottom >= screen.height - insetsTop - this.smallSize - 30) {
			return screen.height - insetsTop - this.smallSize - 30;
		}
		return bottom;
	};

	changeToSmallView = () => {
		const screen = Dimensions.get('window');
		if (this.state.btnEnable) {
			this.setState({ btnEnable: false });
			this.setState({ isSmall: !this.state.isSmall });

			let { lastBottom, lastLeft } = this.state;
			lastLeft = this.getSafeLeft(lastLeft);
			lastBottom = this.getSafeBottom(lastBottom);

			this.setState({ bottom: lastBottom, left: lastLeft, lastBottom, lastLeft });

			RNAnimated.timing(this.state.tansformAni, {
				toValue: 0,
				duration: this.duration,
				useNativeDriver: false
			}).start(() => {
				this.setState({ btnEnable: true });
			});
			RNAnimated.timing(this.state.leftAnimation, {
				toValue: -(screen.width / 2 - this.state.lastLeft),
				duration: this.duration,
				useNativeDriver: false
			}).start(() => {
				console.info(`lastBottom = ${this.state.lastBottom} lastLeft = ${this.state.lastLeft}`);
			});
			RNAnimated.timing(this.state.bottomAnimation, {
				toValue: -(screen.height / 2 - this.state.lastBottom),
				duration: this.duration,
				useNativeDriver: false
			}).start();
			RNAnimated.timing(this.state.smallOpAn, {
				toValue: 1,
				duration: this.duration,
				useNativeDriver: false
			}).start();
		}
	};

	changeToBigView = () => {
		if (this.state.btnEnable) {
			this.setState({ btnEnable: false });
			this.setState({ isSmall: !this.state.isSmall });

			const { bottom, left } = this.state;

			const h = this.state.lastBottom - this.state.bottom;
			const w = this.state.lastLeft - this.state.left;

			this.setState({ lastBottom: bottom });
			this.setState({ lastLeft: left });

			RNAnimated.timing(this.state.tansformAni, {
				toValue: 1,
				duration: this.duration,
				useNativeDriver: false
			}).start(() => {
				this.setState({ btnEnable: true });
			});

			if (w !== 0) {
				RNAnimated.timing(this.state.leftAnimation, {
					toValue: -w,
					duration: 0,
					useNativeDriver: false
				}).start();
			}
			if (h !== 0) {
				RNAnimated.timing(this.state.bottomAnimation, {
					toValue: -h,
					duration: 0,
					useNativeDriver: false
				}).start();
			}

			RNAnimated.timing(this.state.leftAnimation, {
				toValue: 0,
				duration: this.duration,
				useNativeDriver: false
			}).start(() => {
				this.setState({ left: this.state.lastLeft });
				this.setState({ bottom: this.state.lastBottom });
			});
			RNAnimated.timing(this.state.bottomAnimation, {
				toValue: 0,
				duration: this.duration,
				useNativeDriver: false
			}).start();

			RNAnimated.timing(this.state.smallOpAn, {
				toValue: 0,
				duration: this.duration,
				useNativeDriver: false
			}).start();
		}
	};

	voicePress = () => {
		if (this.state.muteLocalAudioStream) {
			console.info('打开声音频道');
			showBottomToast(I18n.t('Voice_Chat_Open_Local_Audio'), 1000);
			this.state.agoraEngineRef.current.muteLocalAudioStream(false);
			this.setState({ muteLocalAudioStream: false });
		} else {
			this.state.agoraEngineRef.current.muteLocalAudioStream(true);
			this.setState({ muteLocalAudioStream: true });
			showBottomToast(I18n.t('Voice_Chat_Close_Local_Audio'), 1000);
			console.info('关闭声音频道');
		}
	};

	soundPress = () => {
		if (this.state.enableSpeakerphone) {
			this.state.agoraEngineRef.current.setEnableSpeakerphone(false);
			this.setState({ enableSpeakerphone: false });
			InCallManager.setForceSpeakerphoneOn(false);
			showBottomToast(I18n.t('Voice_Chat_Close_Speaker_Phone_Tip'), 1000);
			console.info('关闭扬声器');
		} else {
			this.state.agoraEngineRef.current.setEnableSpeakerphone(true);
			this.setState({ enableSpeakerphone: true });
			InCallManager.setForceSpeakerphoneOn(true);
			showBottomToast(I18n.t('Voice_Chat_Open_Speaker_Phone_Tip'), 1000);
			console.info('打开扬声器');
		}
	};

	closePress = () => {
		this.isCancelCall = true;
		console.info('closePress = ', this.recordId);
		if (this.recordId !== '') {
			if (this.state.isConnect) {
				console.info('链接后：开始挂断电话');
				const startTime = performance.now();
				Server.leaveChannel(this.props.org, this.recordId, this.props.user.username).then(res => {
					console.info('挂断电话 = ', res);
					const endTime = performance.now();
					console.info(`Execution time: ${endTime - startTime} milliseconds`);
				});
			} else {
				console.info('未链接：开始挂断电话');
				const startTime = performance.now();
				Server.updateChannelStatus(this.recordId, IVChatStatusType.CANCEL, this.props.org).then(res => {
					console.info('取消成功1 = ', res);
					const endTime = performance.now();
					console.info(`Execution time: ${endTime - startTime} milliseconds`);
				});
			}
		}
		this.closeChatView();
	};

	rejectPress = () => {
		const { callMsg } = this.props;

		if (callMsg.recordData?.receivers && callMsg.recordData.receivers?.length > 1) {
			Server.rejectCall(this.props.org, callMsg.recordData.recordId, this.props.user.username).then(() => {
				console.info('已拒绝');
			});
		} else {
			Server.updateChannelStatus(callMsg.recordData?.recordId, IVChatStatusType.REJECT, this.props.org).then(res => {
				console.info('结束结果 = ', res);
			});
		}
		this.closeChatView();
	};

	stopAudio = () => {
		InCallManager.stopRingback();
		InCallManager.stop();
		Vibration.cancel();
	};

	acceptPress = () => {
		const { callMsg } = this.props;
		this.stopAudio();
		this.setState({ isAccept: true });
		this.props.dispatch(setAcceptCall());
		this.startChat();
		Server.joinChannel(this.props.org, callMsg.recordData?.recordId, this.props.user.username);
	};

	acceptCenterView = () => {
		const { isConnect } = this.state;
		return (
			<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<UserListView usersData={this.state.usersData} />
				{!isConnect && this.isHost && this.state.isOpenChat && <ConnectStatusText />}
			</View>
		);
	};

	topView = () => (
		<View style={{ width: '100%', flexDirection: 'row', paddingHorizontal: 10, marginTop: 40 }}>
			<TouchableOpacity
				onPress={() => this.changeToSmallView()}
				style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
			>
				<TopLeftIcon />
			</TouchableOpacity>
			{this.state.isStartTheClock && <ConnectTimeView />}
		</View>
	);

	centerView = () => {
		if (this.isHost || this.state.isAccept) {
			return this.acceptCenterView();
		}

		return <UnAcceptCenterView callMsg={this.props.callMsg} usersData={this.state.usersData} />;
	};

	bottomView = () => {
		const { muteLocalAudioStream, enableSpeakerphone } = this.state;
		return this.state.isAccept || this.isHost ? (
			<ConnectedView
				muteLocalAudioStream={muteLocalAudioStream}
				enableSpeakerphone={enableSpeakerphone}
				onClosePress={this.closePress}
				onSoundPress={this.soundPress}
				onVoicePress={this.voicePress}
			/>
		) : (
			<UnConnectedView onAcceptPress={this.acceptPress} onRejectPress={this.rejectPress} />
		);
	};

	smallView = () => {
		const { panResponder } = this.state;
		return (
			<RNAnimated.View
				style={{
					width: this.smallSize,
					height: this.smallSize,
					zIndex: this.state.isSmall ? 2 : 1,
					borderRadius: 50,
					position: 'absolute',
					opacity: this.state.smallOpAn,
					left: this.state.left,
					bottom: this.state.bottom
				}}
				{...panResponder?.panHandlers}
			>
				<TouchableOpacity style={{ width: '100%', height: '100%' }} onPress={() => this.changeToBigView()}>
					<Image source={require('./assets/call.png')} style={{ width: this.smallSize, height: this.smallSize }} />
				</TouchableOpacity>
			</RNAnimated.View>
		);
	};

	bigView = () => (
		<RNAnimated.View
			style={{
				width: '100%',
				height: '100%',
				backgroundColor: 'black',
				position: 'absolute',
				zIndex: 1,
				alignItems: 'center',
				flexDirection: 'column',
				transform: [{ scale: this.state.tansformAni }],
				left: this.state.leftAnimation,
				bottom: this.state.bottomAnimation
			}}
		>
			{this.topView()}
			{this.centerView()}
			{this.bottomView()}
		</RNAnimated.View>
	);

	render() {
		return (
			<ContainerView isOpen={this.state.isOpenChat}>
				{this.bigView()}
				{this.smallView()}
				<BottomToast />
			</ContainerView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	userid: state.chat.userid,
	isOpenChat: state.chat.isOpenChat,
	channelId: state.chat.callMsg?.recordData?.channelId,
	hoster: state.chat.hoster,
	org: (state.settings.Enterprise_ID || 'bitmain') as string,
	login: state.login,
	callMsg: state.chat.callMsg,
	onCallStatus: state.chat.onCallStatus
});

export default connect(mapStateToProps)(withSafeAreaInsets(VoiceChatView));
