import React, { useContext } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

import { IMessageInner, IForwardMessage } from '../interfaces';
import styles from './styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import I18n from '../../../i18n';
import LastMessage from '../../RoomItem/LastMessage';
import MessageContext from '../Context';
import Navigation from '../../../lib/navigation/appNavigation';
import Reactions from '../Reactions';

export const getForwardMsgTitle = (msgData?: string): string => {
	if (!msgData) {
		return '';
	}
	const data = JSON.parse(msgData as string) as IForwardMessage;
	let title = I18n.t('Chat_record');
	const names = data.originRoom?.names;
	if (names && names.length > 0) {
		title = names.length === 2 ? I18n.t('Chat_record_title_users', names) : I18n.t('Chat_record_title', { title: names[0] });
	} else if (data.originRoom?.name) {
		title = I18n.t('Chat_record_title', { title: data.originRoom.name });
	}
	return title;
};

const ForwardMsg: React.FC<IMessageInner> = props => {
	const { msgData, useRealName } = props;
	const { theme } = useTheme();
	const { user, onLongPress } = useContext(MessageContext);
	const data = JSON.parse(msgData as string) as IForwardMessage;

	const title = getForwardMsgTitle(msgData);
	const msgs = (data.messages && data.messages.filter((a, i) => i < 2)) || [];

	const openForwardDetail = (data: IForwardMessage) => {
		Navigation.navigate('ForwardMessageView', { title, list: data.messages });
	};

	return (
		<>
			<TouchableOpacity onLongPress={onLongPress} onPress={() => openForwardDetail(data)}>
				<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
					<View style={[styles.headerWrapper]}>
						<Text style={[styles.header, { color: themes[theme].headerTitleColor }]}>{title}</Text>
					</View>
					{msgs.map(msg => (
						<View style={[styles.body]}>
							<LastMessage
								lastMessage={msg}
								numberOfLines={1}
								showLastMessage={true}
								username={user && user.username}
								useRealName={useRealName}
								theme={theme}
							/>
						</View>
					))}
					<View style={[styles.footerWrapper, { borderColor: themes[theme].borderColor }]}>
						<Text style={[styles.footer, { color: themes[theme].auxiliaryText }]}>{I18n.t('Chat_record')}</Text>
					</View>
				</View>
			</TouchableOpacity>
			<Reactions {...props} />
		</>
	);
};

export default ForwardMsg;
