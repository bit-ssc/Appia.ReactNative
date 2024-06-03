import React from 'react';
import { View } from 'react-native';

import { DisplayMode } from '../../lib/constants';
import { useTheme } from '../../theme';
import IconOrAvatar from './IconOrAvatar';
import { IWrapperProps } from './interfaces';
import styles from './styles';
import UnreadBadge from '../UnreadBadge';
import ChannelDotIcon from '../Icon/ChannelDotIcon';
import DiscussionDotIcon from '../Icon/DiscussionDotIcon';

const renderDot = (
	prid: string,
	teamMain: boolean,
	type: string,
	teamDotColor?: string,
	discussionDotColor?: string,
	channelDotColor?: string
) => {
	if (type === 'c' && channelDotColor) {
		const [p, s] = channelDotColor.split(',');
		return <ChannelDotIcon style={{ position: 'absolute', right: 0, bottom: 0 }} primaryColor={p} secondaryColor={s} />;
	}

	if ((type === 'p' || teamMain) && discussionDotColor) {
		const [p, s] = discussionDotColor.split(',');
		return <DiscussionDotIcon style={{ position: 'absolute', right: 0, bottom: 0 }} primaryColor={p} secondaryColor={s} />;
	}
	return <></>;
};

const Wrapper = ({
	accessibilityLabel,
	children,
	displayMode,
	favorite,
	unread,
	userMentions,
	groupMentions,
	tunread,
	tunreadUser,
	tunreadGroup,
	hideUnreadStatus,
	alert,
	prid,
	type,
	teamMain,
	showDot,
	channelDotColor,
	discussionDotColor,
	teamDotColor,
	borderRadius,
	todoCount,
	isRoomToDo,
	...props
}: IWrapperProps): React.ReactElement => {
	const { colors } = useTheme();

	// console.log(groupMentions, tunread, tunreadGroup, accessibilityLabel);
	return (
		<View
			style={[styles.container, displayMode === DisplayMode.Condensed && styles.containerCondensed]}
			accessibilityLabel={accessibilityLabel}
		>
			<View style={styles.avatarBox}>
				{Boolean(groupMentions > 0 || userMentions > 0) && <View style={[styles.redBadge]} />}
				{Boolean((!unread || unread <= 0) && !tunread?.length && alert) && <View style={[styles.redBadge]}></View>}
				<UnreadBadge
					unread={todoCount}
					userMentions={userMentions}
					groupMentions={groupMentions}
					tunread={tunread}
					tunreadUser={tunreadUser}
					tunreadGroup={tunreadGroup}
					small={true}
					style={[styles.unreadNum, { borderRadius: 4, top: -2, right: 6, backgroundColor: '#E34D59' }]}
				/>
				<View>
					<IconOrAvatar
						type={type}
						prid={prid}
						teamMain={teamMain}
						displayMode={displayMode}
						borderRadius={borderRadius}
						{...props}
					/>
					{showDot && renderDot(prid, teamMain, type, teamDotColor, discussionDotColor, channelDotColor)}
				</View>
			</View>

			<View
				style={[
					styles.centerContainer,
					{
						borderColor: colors.separatorColor,
						borderBottomWidth: 0
					}
				]}
			>
				{children}
			</View>
		</View>
	);
};

export default Wrapper;
