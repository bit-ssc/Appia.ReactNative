import { Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

import styles from './styles';
import Avatar from '../../containers/Avatar';
import { IUserSummary, SubscriptionType } from '../../definitions';
import Navigation from '../../lib/navigation/appNavigation';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';

interface IProps {
	user: IUserSummary;
	theme: TSupportedThemes;
	pressDisabled?: boolean;
}

const UserItem: React.FC<IProps> = ({ user, theme, pressDisabled }) => {
	console.info('user', user);
	const content = (
		<View style={styles.itemView}>
			<Avatar style={styles.userAvatar} text={user.username} size={40} />
			<Text style={[styles.userName, { color: themes[theme].titleText }]}>{user.name}</Text>
			{user.propertyDesc ? (
				<View style={styles.departmentCountWrapper}>
					<Text style={{ color: 'rgba(0, 0, 0, 0.4)' }}>{user.propertyDesc}</Text>
				</View>
			) : null}
			{user.jobName ? (
				<View style={styles.departmentCountWrapper}>
					<Text style={{ color: 'rgba(0, 0, 0, 0.4)' }}>{user.jobName}</Text>
				</View>
			) : null}
		</View>
	);
	const isOuterUser = user._id.startsWith('none|');
	return (
		<View style={styles.itemViewBox}>
			{pressDisabled ? (
				content
			) : (
				<TouchableOpacity
					onPress={() =>
						Navigation.navigate('RoomInfoView', {
							rid: user.username,
							t: SubscriptionType.DIRECT,
							importIds: user.importIds,
							positions: user.positions,
							isOuterUser,
							member: isOuterUser ? user : ''
						})
					}
				>
					{content}
				</TouchableOpacity>
			)}
			<View style={[styles.borderBottom, { borderBottomColor: themes[theme].borderColor }]} />
		</View>
	);
};

export default UserItem;
