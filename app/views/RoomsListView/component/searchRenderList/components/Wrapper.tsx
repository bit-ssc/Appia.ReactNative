import React from 'react';
import { View } from 'react-native';

import { DisplayMode } from '../../../../../lib/constants';
import { useTheme } from '../../../../../theme';
import IconOrAvatar from './IconOrAvatar';
import styles from '../styles';
import ChannelDotIcon from './Icon/ChannelDotIcon';
import DiscussionDotIcon from './Icon/DiscussionDotIcon';
// import TeamDotIcon from './Icon/TeamDotIcon';

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
	prid,
	type,
	teamMain,
	showDot,
	channelDotColor,
	discussionDotColor,
	teamDotColor,
	borderRadius,
	showAvatar,
	rid,
	avatar
}: any): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View
			style={[
				styles.container,
				displayMode === DisplayMode.Condensed && styles.containerCondensed,
				favorite ? { backgroundColor: '#F3F3F3' } : {}
			]}
			accessibilityLabel={accessibilityLabel}
		>
			<View style={styles.avatarBox}>
				<View>
					<IconOrAvatar
						type={type}
						rid={rid}
						avatar={avatar}
						teamMain={teamMain}
						displayMode={displayMode}
						borderRadius={borderRadius}
						showAvatar={showAvatar}
					/>
					{showDot && renderDot(prid, teamMain, type, teamDotColor, discussionDotColor, channelDotColor)}
				</View>
			</View>

			<View
				style={[
					styles.centerContainer,
					{
						borderColor: colors.separatorColor
					}
				]}
			>
				{children}
			</View>
		</View>
	);
};

export default Wrapper;
