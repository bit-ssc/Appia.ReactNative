import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

import { isIOS } from '../../../lib/methods';
import { CloseVoice, OpenVoice, CloseChat, OpenSound, CloseSound } from './Icon';
import I18n from '../../../i18n';

const ConnectedView: React.FC<{
	muteLocalAudioStream: boolean;
	enableSpeakerphone: boolean;
	onVoicePress: () => void;
	onClosePress: () => void;
	onSoundPress: () => void;
}> = ({ muteLocalAudioStream, enableSpeakerphone, onVoicePress, onClosePress, onSoundPress }) => {
	const voicePress = () => {
		if (onVoicePress) {
			onVoicePress();
		}
	};

	const closePress = () => {
		if (onClosePress) {
			onClosePress();
		}
	};

	const soundPress = () => {
		if (onSoundPress) {
			onSoundPress();
		}
	};

	return (
		<View
			style={{
				backgroundColor: 'black',
				width: '100%',
				height: isIOS ? 100 + 20 : 100,
				flexDirection: 'row',
				justifyContent: 'flex-start',
				paddingHorizontal: 10
			}}
		>
			<View style={{ flexDirection: 'row', justifyContent: 'center', height: 84, flex: 1 }}>
				<View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 7, flex: 1 }}>
					<TouchableOpacity onPress={() => voicePress()}>
						{muteLocalAudioStream ? <CloseVoice /> : <OpenVoice />}
					</TouchableOpacity>
					<Text style={{ color: 'white', marginTop: 5, fontSize: 12 }}>
						{muteLocalAudioStream ? I18n.t('Voice_Chat_Close_Local_Audio') : I18n.t('Voice_Chat_Open_Local_Audio')}
					</Text>
				</View>
				<TouchableOpacity onPress={() => closePress()}>
					<CloseChat />
				</TouchableOpacity>
				<View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 7, flex: 1 }}>
					<TouchableOpacity onPress={() => soundPress()}>{enableSpeakerphone ? <OpenSound /> : <CloseSound />}</TouchableOpacity>
					<Text style={{ color: 'white', marginTop: 5, fontSize: 12 }}>
						{enableSpeakerphone ? I18n.t('Voice_Chat_Open_Speaker_Phone') : I18n.t('Voice_Chat_Close_Speaker_Phone')}
					</Text>
				</View>
			</View>
		</View>
	);
};

export default ConnectedView;
