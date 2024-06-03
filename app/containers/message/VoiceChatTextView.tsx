import { View, Text } from 'react-native';
import React from 'react';
import { useSelector } from 'react-redux';

import { getUserSelector } from '../../selectors/login';
import { IMsgData } from './Appia/VoiceChatMsg';
import { IApplicationState } from '../../definitions';
// import { IVCUser } from '../../definitions/IVChat';
// import { Services } from '../../lib/services';

const VoiceChatTextView: React.FC<{ callMsg: IMsgData; authorName: string | undefined }> = ({ callMsg, authorName }) => {
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	let text: any = null;
	if (callMsg.type === 'calling') {
		let firstName = '';
		const pNum = callMsg.receivers ? callMsg.receivers.length : 0;
		if (callMsg.users && callMsg.users.length > 0) {
			const u = callMsg.users.filter(item => item.userName !== user.username && item.userName !== callMsg.initiatorUsername);
			if (u && u.length > 0) {
				firstName = u[0].name;
			}
		}
		if (user.username === callMsg.initiatorUsername) {
			if (firstName !== '' && pNum > 0) {
				text = `你发起了语音通话，\n通话参与人还有：${firstName}等${pNum}人`;
			} else {
				text = '你发起了语音通话';
			}
		} else if (callMsg.receivers && callMsg.receivers.length > 0) {
			const p = callMsg.receivers.filter(item => item === user.username);
			if (p.length > 0) {
				if (firstName !== '' && pNum - 1 > 0) {
					text = `${authorName}邀请你语音通话，\n通话参与人还有：${firstName}等${pNum - 1}人`;
				} else {
					text = `${authorName}邀请你语音通话`;
				}
			} else {
				text = `${authorName}发起了与其他人的语音通话`;
			}
		} else {
			text = '发起语音';
		}
	} else if (callMsg.type === 'cancel') {
		text = `${authorName}发起的语音通话已取消`;
	} else {
		text = `${authorName}发起的语音通话已结束`;
	}
	return (
		<View style={{ alignItems: 'center', paddingVertical: 5, marginTop: 12, paddingHorizontal: 70 }}>
			<Text style={{ color: '#aaaaaa', textAlign: 'center', fontSize: 13, letterSpacing: 0.5 }}>{text}</Text>
		</View>
	);
};

export default VoiceChatTextView;
