import React from 'react';
import { TouchableHighlight, View } from 'react-native';

import styles from './styles';
import UpdatedAt from './components/UpdateAt';
import { CustomIcon } from '../../../../containers/CustomIcon/index';
import Title from './components/Title';
import GroupIcon from './components/GroupSymbolIcon';
import Wrapper from './components/Wrapper';
import { DisplayMode } from '../../../../lib/constants';
import LastMessage from '../../../../containers/RoomItem/components/lastMessage';

const RoomItem = ({
	type,
	alert,
	avatar,
	favorite,
	date,
	unread,
	userMentions,
	groupMentions,
	rid,
	prid,
	displayMode,
	showAvatar,
	showLastMessage,
	showDot,
	channelDotColor,
	discussionDotColor,
	teamDotColor,
	borderRadius,
	name,
	hideUnreadStatus,
	accessibilityLabel,
	username,
	lastMessage,
	useRealName,
	draftMessage,
	allSearch,
	perName,
	searchKey,
	onPress
}: any) => (
	<>
		<TouchableHighlight activeOpacity={0.6} underlayColor='#DDDDDD' onPress={onPress}>
			<Wrapper
				accessibilityLabel={accessibilityLabel}
				avatar={avatar}
				favorite={favorite}
				unread={unread}
				type={type}
				rid={rid}
				prid={prid}
				displayMode={displayMode}
				showAvatar={showAvatar}
				showDot={showDot}
				channelDotColor={channelDotColor}
				discussionDotColor={discussionDotColor}
				teamDotColor={teamDotColor}
				borderRadius={borderRadius}
			>
				{showLastMessage && displayMode === DisplayMode.Expanded ? (
					<>
						<View style={styles.titleContainer}>
							<Title name={name} hideUnreadStatus={hideUnreadStatus} alert={alert} />
							{type && type !== 'd' && <GroupIcon style={{ margin: 5 }} />}

							<View style={[{ flex: 1 }]}></View>
							<UpdatedAt date={date} hideUnreadStatus={hideUnreadStatus} alert={alert} />
						</View>
						<View style={[styles.row, styles.descContainer]}>
							<LastMessage
								lastMessage={lastMessage}
								type={type}
								showLastMessage={showLastMessage}
								username={username || ''}
								alert={alert && !hideUnreadStatus}
								useRealName={useRealName}
								userMentions={userMentions}
								groupMentions={groupMentions}
								draftMessage={draftMessage}
								allSearch={allSearch}
								perName={perName}
								searchKey={searchKey}
							/>
							{hideUnreadStatus && (
								<CustomIcon style={{ marginTop: 0, marginLeft: 5 }} name='notification-disabled' size={20} color={'#9ca2a8'} />
							)}
						</View>
					</>
				) : (
					<View style={[styles.titleContainer, styles.flex]}>
						<View style={styles.wrapUpdatedAndBadge}>
							<UpdatedAt date={date} hideUnreadStatus={hideUnreadStatus} alert={alert} />
							{hideUnreadStatus && (
								<CustomIcon style={{ marginTop: 5 }} name='notification-disabled' size={20} color={'#9ca2a8'} />
							)}
						</View>
					</View>
				)}
			</Wrapper>
		</TouchableHighlight>
	</>
);

export default RoomItem;
