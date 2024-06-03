import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Svg, { Path } from 'react-native-svg';

import { IMessageInner } from '../interfaces';
import { IApplicationState, SubscriptionType } from '../../../definitions';
import { getUserSelector } from '../../../selectors/login';
import { IVChatHoster, IVCReceiveUser } from '../../../definitions/IVChat';
import { store } from '../../../lib/store/auxStore';
import { setOpenChatView, setStartVoiceChat } from '../../../actions/chat';
import EventEmitter from '../../../lib/methods/helpers/events';
import { RECEIVER_OPEN_VOICECHAT_EMITTER, HOSTER_OPEN_VOICECHAT_EMITTER } from '../../VoiceChatView';

interface IMsgUser {
	name: string;
	userName: string;
}

export interface IMsgData {
	initiatorMsg: string;
	receiverMsg: string;
	type: string;
	channelId: string;
	initiatorName: string;
	initiatorAvatar: string;
	duration: string;
	receiverUsername: string;
	initiatorUsername: string;
	roomType: SubscriptionType;
	roomId: string;
	receivers?: string[];
	users: IMsgUser[];
}

const VoiceChatMsg: React.FC<IMessageInner> = props => {
	const { msgData, msg, author, rid } = props;
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	let text = '';
	let type = '';

	if (typeof msgData === 'string') {
		const msgDataDetail: IMsgData = JSON.parse(msgData);
		if (user.username === author?.username) {
			text = msgDataDetail.initiatorMsg;
		} else {
			text = msgDataDetail.receiverMsg;
		}
		type = msgDataDetail.type;
	}

	if (!msgData) {
		return <Text>message error</Text>;
	}

	const press = () => {
		if (typeof msgData === 'string') {
			const msgDataDetail: IMsgData = JSON.parse(msgData);

			if (msgDataDetail.roomType === 'd') {
				if (msgDataDetail.type !== 'calling') {
					let username = '';
					if (user.username === author?.username) {
						username = msgDataDetail.receiverUsername;
					} else {
						// 接收者
						username = msgDataDetail.initiatorUsername;
					}
					if (rid && msgDataDetail.roomType && username) {
						const hoster = {
							roomId: msgDataDetail.roomId,
							roomType: msgDataDetail.roomType,
							receivers: [{ receiver: username } as IVCReceiveUser]
						} as IVChatHoster;
						store.dispatch(setStartVoiceChat(hoster));
						EventEmitter.emit(HOSTER_OPEN_VOICECHAT_EMITTER, { hoster });
					}
				} else {
					store.dispatch(setOpenChatView());
					EventEmitter.emit(RECEIVER_OPEN_VOICECHAT_EMITTER, { isAccept: false });
				}
			}
		}
	};

	const renderIcon = () => {
		if (type === 'calling') {
			if (user.username === author?.username) {
				return <CallingIcon />;
			}
			return <ReceiveCallIcon />;
		}
		return <CallIcon />;
	};

	return (
		<TouchableOpacity
			style={{
				paddingVertical: 10,
				paddingHorizontal: 12,
				backgroundColor: '#fff',
				alignItems: 'center',
				borderRadius: 8,
				marginTop: 4,
				flexDirection: type !== 'end' ? 'row-reverse' : 'row'
			}}
			onPress={() => press()}
		>
			{renderIcon()}
			<Text style={{ paddingLeft: type === 'end' ? 7 : 0, paddingRight: type !== 'end' ? 7 : 0, fontSize: 14 }}>
				{text !== '' ? text : msg}
			</Text>
		</TouchableOpacity>
	);
};

export default VoiceChatMsg;

export const CallIcon = () => (
	<Svg width='22' height='22' viewBox='0 0 22 22' fill='none'>
		<Path
			d='M11.5 8.0498C10.5111 8.0498 9.55858 8.12272 8.64257 8.26855C7.73111 8.40983 6.90624 8.62858 6.16796 8.9248C5.42967 9.22103 4.83039 9.59928 4.3701 10.0596C4.05565 10.374 3.82095 10.7227 3.666 11.1055C3.51106 11.4837 3.44497 11.903 3.46776 12.3633C3.48143 12.6413 3.52928 12.8988 3.61132 13.1357C3.6979 13.3727 3.82323 13.571 3.98729 13.7305C4.11034 13.8535 4.25162 13.9469 4.41112 14.0107C4.57518 14.07 4.7552 14.0837 4.95116 14.0518L7.48729 13.6211C7.86099 13.5573 8.13443 13.4388 8.3076 13.2656C8.42154 13.1562 8.49901 13.0195 8.54003 12.8555C8.58104 12.6914 8.60155 12.5023 8.60155 12.2881V11.5977C8.60155 11.5065 8.64029 11.4199 8.71776 11.3379C8.74966 11.2969 8.7884 11.2673 8.83397 11.249C8.8841 11.2262 8.9274 11.2103 8.96385 11.2012C9.19628 11.1465 9.53579 11.0986 9.98241 11.0576C10.4336 11.012 10.9394 10.9893 11.5 10.9893C12.0605 10.9893 12.5641 11.0098 13.0107 11.0508C13.4573 11.0872 13.7991 11.1396 14.0361 11.208C14.0726 11.2171 14.1113 11.2331 14.1523 11.2559C14.1979 11.2741 14.2389 11.3014 14.2754 11.3379C14.3437 11.4108 14.3802 11.4951 14.3848 11.5908L14.3916 12.2881C14.3961 12.5023 14.4189 12.6914 14.4599 12.8555C14.501 13.0195 14.5762 13.1562 14.6855 13.2656C14.7721 13.3522 14.8838 13.4251 15.0205 13.4844C15.1572 13.5436 15.3213 13.5892 15.5127 13.6211L18.0146 14.0449C18.2152 14.0814 18.3997 14.0677 18.5683 14.0039C18.7415 13.9355 18.8942 13.8376 19.0264 13.71C19.3545 13.391 19.5254 12.9398 19.539 12.3564C19.5482 11.8962 19.4684 11.4769 19.2998 11.0986C19.1357 10.7158 18.8988 10.3695 18.5889 10.0596C18.1286 9.59473 17.5316 9.21419 16.7978 8.91797C16.0641 8.62174 15.2438 8.40299 14.3369 8.26172C13.43 8.12044 12.4844 8.0498 11.5 8.0498Z'
			fill='black'
			fill-opacity='0.26'
		/>
	</Svg>
);

export const CallingIcon = () => (
	<Svg viewBox='0 0 1024 1024' width='14' height='14'>
		<Path
			d='M928 544c-17.673 0-32-14.327-32-32 0-212.077-171.923-384-384-384-17.673 0-32-14.327-32-32s14.327-32 32-32c247.423 0 448 200.576 448 448 0 17.673-14.327 32-32 32z m-192 0c-17.673 0-32-14.327-32-32 0-106.039-85.961-192-192-192-17.673 0-32-14.327-32-32 0-17.673 14.327-32 32-32 141.385 0 256 114.615 256 256 0 17.673-14.327 32-32 32z m-88.784 175.522a315.728 315.728 0 0 0 3.439-3.633c0.06-0.057 0.117-0.114 0.174-0.172 18.348-19.517 52.528-56.062 69.331-75.469 0-0.019 0.029-0.033 0.029-0.048 23.217-25.868 57.372-20.356 75.542-10.443 35.903 19.617 109.872 60.172 134.399 74.73 16.857 9.708 29.866 31.495 29.866 46.43v59.733c0 16.074-5.485 37.756-20.242 58.074-28.147 37.913-85.545 91.262-171.267 91.262-134.837 0-286.592-64.983-453.979-223.694-131.396-124.559-210.815-293.678-238.93-374.021C67.381 339.989 64 309.395 64 287.985v-50.282c0-69.327 53.344-126.815 87.673-154.977 14.116-12.207 31.966-18.74 46.726-18.74h45.499c23.918 0.439 39.199 16.317 45.033 29.821 14.525 33.731 45.822 112.538 62.562 158.362 6.243 16.932 11.172 39.74 11.172 65.508 0 23.742-45.733 72.479-61.398 87.471-15.69 14.992-10.849 69.985 132.448 214.929 95.023 96.135 154 112.567 182.991 112.743 16.391-0.042 24.236-6.693 30.51-13.298z'
			p-id='4665'
			fill='#2c2c2c'
		/>
	</Svg>
);

export const ReceiveCallIcon = () => (
	<Svg viewBox='0 0 1024 1024' width='12' height='12'>
		<Path
			d='M787.080745 756.869565c-50.881988-38.161491-89.043478-57.242236-120.84472-57.242236-44.521739 0-69.962733 25.440994-95.403727 57.242236L558.111801 763.229814c0 0-6.360248 0-6.360248 0-19.080745 0-63.602484-12.720497-165.36646-120.84472C271.900621 534.26087 259.180124 489.73913 259.180124 477.018634c0-6.360248 0-6.360248 0-6.360248l6.360248-6.360248c57.242236-57.242236 89.043478-101.763975 0-216.248447-31.801242-44.521739-69.962733-63.602484-108.124224-63.602484-50.881988 0-82.68323 38.161491-114.484472 69.962733-6.360248 6.360248-12.720497 12.720497-12.720497 12.720497-38.161491 38.161491-38.161491 114.484472 0 209.888199 38.161491 101.763975 114.484472 209.888199 209.888199 311.652174 178.086957 178.086957 343.453416 235.329193 432.496894 235.329193 38.161491 0 63.602484-12.720497 82.68323-25.440994 6.360248-6.360248 12.720497-12.720497 12.720497-12.720497 31.801242-31.801242 69.962733-69.962733 69.962733-120.84472C844.322981 820.47205 825.242236 788.670807 787.080745 756.869565z'
			p-id='3171'
		></Path>
		<Path
			d='M1003.329193 19.080745c-25.440994-25.440994-63.602484-25.440994-89.043478 0L577.192547 356.173913 577.192547 190.807453c0-38.161491-25.440994-63.602484-63.602484-63.602484s-63.602484 25.440994-63.602484 63.602484l0 318.012422c0 6.360248 0 19.080745 6.360248 25.440994 0 6.360248 6.360248 6.360248 6.360248 12.720497 0 0 0 6.360248 6.360248 6.360248 0 0 6.360248 6.360248 6.360248 6.360248 6.360248 0 6.360248 6.360248 12.720497 6.360248C494.509317 572.42236 507.229814 572.42236 513.590062 572.42236c0 0 0 0 0 0l318.012422 0c38.161491 0 63.602484-25.440994 63.602484-63.602484s-25.440994-63.602484-63.602484-63.602484l-165.36646 0 337.093168-337.093168C1028.770186 82.68323 1028.770186 44.521739 1003.329193 19.080745z'
			p-id='3172'
		></Path>
	</Svg>
);
