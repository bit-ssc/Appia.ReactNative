import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import messageStyles from './styles';
import MessageContext from './Context';
import { messageHaveAuthorName } from './utils';
import { MessageType, MessageTypesValues, SubscriptionType } from '../../definitions';
import { IRoomInfoParam } from '../../views/SearchMessagesView';
import useMoment from '../../lib/hooks/useMoment';

// import moment from 'moment';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	actionIcons: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		flexShrink: 1,
		fontSize: 13,
		lineHeight: 22,
		color: '#666666',
		...sharedStyles.textRegular
	},
	usernameInfoMessage: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	titleContainer: {
		flexShrink: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	alias: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

interface IMessageUser {
	isHeader?: boolean;
	hasError: boolean;
	useRealName?: boolean;
	author?: {
		_id: string;
		name?: string;
		username?: string;
	};
	alias?: string;
	ts?: Date;
	timeFormat?: string;
	navToRoomInfo?: (navParam: IRoomInfoParam) => void;
	type: MessageType;
	isEdited: boolean;
	isReadReceiptEnabled?: boolean;
	unread?: boolean;
	surveyStatus?: boolean;
}

const User = React.memo(
	({ isHeader, useRealName, author, alias, ts, timeFormat, navToRoomInfo, type, surveyStatus }: IMessageUser) => {
		const { user } = useContext(MessageContext);
		const { theme } = useTheme();

		const timeDate = useMoment(ts, timeFormat);

		if (surveyStatus) {
			return null;
		}

		if (isHeader) {
			const username = (useRealName && author?.name) || author?.username;
			const aliasUsername = alias ? (
				<Text style={[styles.alias, { color: themes[theme].auxiliaryText }]}> @{username}</Text>
			) : null;
			// const time = moment(ts).format(timeFormat);
			const onUserPress = () => {
				navToRoomInfo?.({
					t: SubscriptionType.DIRECT,
					rid: author?._id || ''
				});
			};
			const isFederated = author?.username?.includes(':');
			const isDisabled = author?._id === user.id || isFederated;

			const textContent = (
				<>
					{alias || username}
					{aliasUsername}
				</>
			);
			if (messageHaveAuthorName(type as MessageTypesValues)) {
				return (
					<Text
						style={[styles.usernameInfoMessage, { color: themes[theme].titleText }]}
						onPress={onUserPress}
						// @ts-ignore // TODO - check this prop
						disabled={isDisabled}
					>
						{textContent}
					</Text>
				);
			}

			return (
				<View style={styles.container}>
					<TouchableOpacity style={styles.titleContainer} onPress={onUserPress} disabled={isDisabled}>
						<Text style={[styles.username, { color: themes[theme].titleText }]} numberOfLines={1}>
							{textContent}
						</Text>
						<Text style={[messageStyles.time, { color: themes[theme].auxiliaryText }]}>{timeDate}</Text>
					</TouchableOpacity>
				</View>
			);
		}
		return null;
	}
);

User.displayName = 'MessageUser';

export default User;
