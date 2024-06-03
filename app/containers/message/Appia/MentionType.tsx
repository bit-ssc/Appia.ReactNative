import React, { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { IMessageInner } from '../interfaces';
import styles from '../styles';
import { useTheme } from '../../../theme';
import Touchable from '../Touchable';
import { themes } from '../../../lib/constants';
import Navigation from '../../../lib/navigation/appNavigation';
import { Services } from '../../../lib/services';
import { sendMessage } from '../../../lib/methods';
import { getUserSelector } from '../../../selectors/login';
import { IApplicationState } from '../../../definitions';

interface IMentionType {
	content: string;
	buttonText: string;
	name: string;
	roomName: string;
	askContent?: string;
}

const defaultMsgData = {
	content: '',
	buttonText: '',
	name: '',
	roomName: ''
};

const MentionType = React.memo(({ msgData, ts }: IMessageInner) => {
	const { theme } = useTheme();
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const setting = useSelector((state: IApplicationState) => state.settings.Udesk_Buttons_Expired);

	const { content, buttonText, name, roomName, askContent, type, source } = useMemo(() => {
		try {
			return JSON.parse((msgData as string) || '') || (defaultMsgData as IMentionType);
		} catch (e) {
			return defaultMsgData;
		}
	}, [msgData]);
	const onPress = useCallback(async () => {
		const result = await Services.createDirectMessage(name);

		if (result.success) {
			const { room } = result;

			try {
				if (
					askContent &&
					type === 1 &&
					source === user.username &&
					(ts as Date)?.getTime() + ((setting as number) || 360) * 60 * 1000 > Date.now()
				) {
					sendMessage(room.rid, askContent, undefined, user);
				}
			} catch (e) {
				console.error(e);
			}

			const params = {
				rid: room.rid,
				t: room.t,
				name: roomName,
				roomUserId: name
			};

			Navigation.replace('RoomView', params);
		}
	}, [askContent, name, roomName, setting, source, ts, type, user]);

	return (
		<View style={{ flexDirection: 'column' }}>
			{content ? (
				<View style={[styles.msgText]}>
					<Text style={[styles.text, { color: themes[theme].bodyText }]}>{content}</Text>
				</View>
			) : null}

			<View style={styles.buttonContainer}>
				<Touchable
					onPress={onPress}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
					style={[styles.button, { backgroundColor: themes[theme].tintColor }]}
				>
					<Text style={[styles.text, { color: themes[theme].buttonText }]}>{buttonText}</Text>
				</Touchable>
			</View>
		</View>
	);
});
export default MentionType;
