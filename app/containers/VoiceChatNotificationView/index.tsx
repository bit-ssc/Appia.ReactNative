import { View, Animated, Text, TouchableOpacity, SafeAreaView, Vibration } from 'react-native';
import React from 'react';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { Notifier, NotifierRoot } from 'react-native-notifier';
import InCallManager from 'react-native-incall-manager';

import { IApplicationState, IBaseScreen, IUser } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import { AcceptIcon, Logo, RefuseIcon } from './Icon';
import { search } from '../../lib/methods';
import { setAcceptCall, setOpenCallingNotification, setOpenChatView, setRefuseCall } from '../../actions/chat';
import Server from '../VoiceChatView/server';
import { IVChatCallMsg, IVChatStatusType } from '../../definitions/IVChat';
import EventEmitter from '../../lib/methods/helpers/events';
import { RECEIVER_OPEN_VOICECHAT_EMITTER } from '../VoiceChatView';
import { IApp } from '../../reducers/app';

interface VNState {
	topAnimation: any;
	initiatorName: string;
	authCode: string;
}

interface VNProps extends IBaseScreen<any, any> {
	user: IUser;
	isOpenChat: boolean;
	org: string;
	recordId: string;
	isCalled: boolean;
	callMsg: IVChatCallMsg;
	onCallStatus: boolean;
	app: IApp;
}
class VoiceChatNotificationView extends React.Component<VNProps, VNState> {
	private isShow: boolean | undefined;
	private isAccept = false;

	constructor(props: VNProps) {
		super(props);
		this.state = {
			topAnimation: new Animated.Value(-240),
			initiatorName: '',
			authCode: ''
		};
	}

	componentDidMount() {
		this.isShow = false;
	}

	componentDidUpdate(prevProps: VNProps) {
		if (prevProps.isOpenChat !== this.props.isOpenChat) {
			if (this.props.isOpenChat) {
				this.closeNotification();
			} else {
				this.stopAudio();
			}
		}
		if (prevProps.onCallStatus !== this.props.onCallStatus && this.props.onCallStatus) {
			const status = this.props.callMsg.userStatus?.filter(
				u => u.username === this.props.user.username && this.props.callMsg.recordData?.initiator !== this.props.user.username
			);
			if (
				status &&
				status.length > 0 &&
				status[0].status !== 'in' &&
				(!status[0].operation || (status[0].operation !== 'reject' && status[0].operation !== 'hangup'))
			) {
				this.showNotification();
			}
		}

		if (prevProps.onCallStatus !== this.props.onCallStatus && !this.props.onCallStatus) {
			this.closeNotification();
			this.stopAudio();
		}

		if (prevProps.app.foreground !== this.props.app.foreground && this.props.app.foreground && this.isShow && !this.isAccept) {
			this.startAudio();
		}
		if (prevProps.app.foreground !== this.props.app.foreground && !this.props.app.foreground && this.isShow) {
			this.stopAudio();
		}
	}

	startAudio = () => {
		Vibration.vibrate([0, 500, 1000, 500], true);
		InCallManager.start({ media: 'audio', ringback: '_BUNDLE_' });
		InCallManager.setForceSpeakerphoneOn(false);
	};

	stopAudio = () => {
		InCallManager.stopRingback();
		InCallManager.stop();
		Vibration.cancel();
	};

	refusePress = () => {
		this.stopAudio();
		this.props.dispatch(setRefuseCall());
		const { callMsg } = this.props;
		this.isAccept = false;
		this.closeNotification();
		if (callMsg.recordData?.receivers && callMsg.recordData.receivers.length > 1) {
			Server.rejectCall(this.props.org, callMsg.recordData.recordId, this.props.user.username).then(() => {});
		} else {
			Server.updateChannelStatus(callMsg.recordData?.recordId, IVChatStatusType.REJECT, this.props.org).then(res => {
				console.info('结束结果 = ', res);
			});
		}
	};

	acceptPress = () => {
		this.props.dispatch(setAcceptCall());
		this.isAccept = true;
		this.closeNotification();
		this.stopAudio();
		EventEmitter.emit(RECEIVER_OPEN_VOICECHAT_EMITTER, { isAccept: true });
		const { callMsg } = this.props;
		Server.joinChannel(this.props.org, callMsg.recordData?.recordId, this.props.user.username, this.state.authCode);
	};

	showNotification = async () => {
		const { callMsg, user, app } = this.props;
		this.isShow = true;
		this.isAccept = false;
		let isHost = false;
		if (callMsg.recordData?.initiator === user.username) {
			isHost = true;
		}

		if (!isHost && callMsg.recordData?.exist && callMsg.recordData?.recordId) {
			Server.notifyHost(this.props.org, callMsg.recordData?.recordId, user.username).then(res => {
				console.info('通知主持人结果 = ', res);
			});

			if (callMsg.recordData?.initiatorName) {
				this.setState({ initiatorName: callMsg.recordData?.initiatorName });
			} else {
				const result = (await search({ text: callMsg.recordData?.initiator, filterRooms: true })) as any;
				if (result.length > 0) {
					this.setState({ initiatorName: result[0].fname });
				}
			}
			this.props.dispatch(setOpenCallingNotification(callMsg.recordData?.channelId, callMsg.recordData?.recordId));
			Notifier.showNotification({
				title: 'Custom',
				description: 'Example of custom component',
				duration: 0,
				Component: this.componentView,
				swipeEnabled: false,
				onHidden: () => {
					this.isShow = false;
				}
			});
			if (app.foreground) {
				this.startAudio();
			}
		}
	};
	closeNotification = () => {
		this.isShow = false;
		Notifier.hideNotification();
	};

	acceptEvent = () => {
		this.isAccept = true;
		this.stopAudio();
	};

	componentView = () => {
		const { initiatorName } = this.state;
		const { callMsg } = this.props;
		return (
			<SafeAreaView style={{ backgroundColor: 'clear', alignItems: 'center', justifyContent: 'center' }}>
				<TouchableOpacity
					style={{
						backgroundColor: 'black',
						padding: 24,
						borderRadius: 12,
						justifyContent: 'center',
						width: '98%',
						flexDirection: 'row'
					}}
					onPress={() => {
						this.props.dispatch(setOpenChatView());
						this.closeNotification();
						EventEmitter.emit(RECEIVER_OPEN_VOICECHAT_EMITTER, { isAccept: false });
					}}
				>
					<View style={{ flexDirection: 'column', flex: 1, paddingRight: 20, alignItems: 'flex-start' }}>
						<Text style={{ color: '#FFFFFF', fontSize: 20 }}>{initiatorName}</Text>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
							<Logo />
							<Text style={{ color: '#FFFFFF', fontSize: 14, marginLeft: 4 }}>
								{callMsg.recordData?.receivers && callMsg.recordData?.receivers?.length > 1
									? '邀请你加入多人语音'
									: '来自appia会话'}
							</Text>
						</View>
					</View>
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							width: 105,
							height: '100%',
							alignItems: 'center'
						}}
					>
						<TouchableOpacity onPress={() => this.refusePress()}>
							<RefuseIcon />
						</TouchableOpacity>
						<TouchableOpacity onPress={() => this.acceptPress()}>
							<AcceptIcon />
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</SafeAreaView>
		);
	};
	render() {
		return <NotifierRoot />;
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	userid: state.chat.userid,
	isOpenChat: state.chat.isOpenChat,
	channelId: state.chat.channelId,
	org: (state.settings.Enterprise_ID || 'bitmain') as string,
	recordId: state.chat.callMsg?.recordData?.recordId,
	isCalled: state.chat.isCalled,
	callMsg: state.chat.callMsg,
	onCallStatus: state.chat.onCallStatus,
	app: state.app
});

export default connect(mapStateToProps)(withSafeAreaInsets(VoiceChatNotificationView as any));
