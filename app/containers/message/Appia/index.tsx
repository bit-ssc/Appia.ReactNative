import React from 'react';
import { Text, View } from 'react-native';

import Approval from './approval';
import MentionType from './MentionType';
import UdeskMsg from './UdeskMsg';
import ForwardMsg from './ForwardMsg';
import { IMessageInner } from '../interfaces';
import styles from '../styles';
import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';
import ShareDynamic from './ShareDynamic';
import FeedbackMsg from './FeedbackMsg';
import LeXiangMsg from './LeXiang';
import CloudDocMsg from './CloudDocMsg';
import VoiceChatMsg from './VoiceChatMsg';

const map: Record<string, React.FC<IMessageInner>> = {
	approval: Approval,
	approvalNeedAuth: Approval,
	meeting_room: Approval,
	mentionType: MentionType,
	shareDynamic: ShareDynamic,
	udeskMsg: UdeskMsg,
	forwardMergeMessage: ForwardMsg,
	'field_list:feedback': FeedbackMsg,
	applyJoinRoom: Approval,
	lexiangMsg: LeXiangMsg,
	docCloud: CloudDocMsg,
	docCloudNotice: Approval,
	oncall: VoiceChatMsg
};

const Appia: React.FC<IMessageInner> = props => {
	const { msgType } = props;
	const { theme } = useTheme();

	const Component = map[msgType as string];

	if (Component) {
		return <Component {...props} />;
	}

	return (
		<View style={[styles.msgText]}>
			<Text style={[styles.textInfo, { color: themes[theme].auxiliaryText }]}>{I18n.t('Not_Support')}</Text>
		</View>
	);
};

export default Appia;
