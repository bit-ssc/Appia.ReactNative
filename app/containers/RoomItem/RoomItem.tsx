import React from 'react';
import { Text, View } from 'react-native';

import styles from './styles';
import Wrapper from './Wrapper';
import TypeIcon from './TypeIcon';
// import LastMessage from './LastMessage';
import LastMessage from './components/lastMessage/index';
import Title from './Title';
import UpdatedAt from './UpdatedAt';
import Touchable from './Touchable';
import Tag from './Tag';
import I18n from '../../i18n';
import { DisplayMode } from '../../lib/constants';
import { IRoomItemProps } from './interfaces';
import { CustomIcon } from '../CustomIcon';
import GroupIcon from '../Icon/GroupSymbolIcon';

const RoomItem = ({
	rid,
	type,
	prid,
	name,
	avatar,
	width,
	username,
	showLastMessage,
	status = 'offline',
	useRealName,
	isFocused,
	isGroupChat,
	isToDo,
	date,
	accessibilityLabel,
	favorite,
	lastMessage,
	alert,
	hideUnreadStatus,
	unread,
	userMentions,
	groupMentions,
	tunread,
	tunreadUser,
	tunreadGroup,
	testID,
	swipeEnabled = true,
	onPress,
	onLongPress,
	toggleFav,
	toggleToDo,
	hideChannel,
	teamMain,
	autoJoin,
	showAvatar,
	displayMode,
	sourceType,
	todoCount,
	draftMessage,
	showDot,
	channelDotColor,
	teamDotColor,
	discussionDotColor,
	borderRadius,
	allSearch,
	perName,
	searchKey
}: IRoomItemProps) => {
	const draftAndCalledText = () => {
		if (draftMessage) {
			return <Text style={styles.textTodo}>{`[${I18n.t('Draft_Message')}] `}</Text>;
		}
		if (groupMentions > 0 || userMentions > 0) {
			return <Text style={styles.textTodo}>[{I18n.t('Some_One_Call_Me')}] </Text>;
		}
		return null;
	};

	const unreadText = () => {
		if (!hideUnreadStatus && unread > 0) {
			let width = 16;
			if (unread > 9) {
				width = 24;
			}
			if (unread > 99) {
				width = 28;
			}
			return (
				<View
					style={{
						width,
						height: 16,
						borderRadius: 8,
						backgroundColor: '#3677F2',
						alignItems: 'center',
						justifyContent: 'center',
						marginRight: 10,
						marginTop: 4,
						marginLeft: 5
					}}
				>
					<Text style={{ fontSize: 10, color: 'white' }}>{unread > 99 ? '99+' : unread}</Text>
				</View>
			);
		}
		return null;
	};

	return (
		<Touchable
			onPress={onPress}
			onLongPress={onLongPress}
			width={width}
			favorite={favorite}
			toggleFav={toggleFav}
			isToDo={isToDo}
			rid={rid}
			toggleToDo={toggleToDo}
			hideChannel={hideChannel}
			testID={testID}
			type={type}
			isFocused={!!isFocused}
			swipeEnabled={swipeEnabled}
			displayMode={displayMode}
		>
			<Wrapper
				accessibilityLabel={accessibilityLabel}
				avatar={avatar}
				favorite={favorite}
				unread={unread}
				todoCount={todoCount}
				isRoomToDo={isToDo}
				userMentions={userMentions}
				groupMentions={groupMentions}
				tunread={tunread}
				tunreadUser={tunreadUser}
				tunreadGroup={tunreadGroup}
				hideUnreadStatus={hideUnreadStatus}
				alert={alert}
				type={type}
				rid={rid}
				prid={prid}
				status={status}
				isGroupChat={isGroupChat}
				teamMain={teamMain}
				displayMode={displayMode}
				showAvatar={showAvatar}
				showLastMessage={!!showLastMessage}
				sourceType={sourceType}
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
							{type !== 'd' && <GroupIcon style={{ margin: 5 }} />}
							{autoJoin ? <Tag testID='auto-join-tag' name={I18n.t('Auto-join')} /> : null}
							<View style={[{ flex: 1 }]}></View>
							<UpdatedAt date={date} hideUnreadStatus={hideUnreadStatus} alert={false} />
						</View>
						<View style={[styles.row, styles.descContainer, { width: '100%' }]}>
							{draftAndCalledText()}
							<LastMessage
								lastMessage={lastMessage}
								type={type}
								showLastMessage={showLastMessage}
								username={username || ''}
								alert={false}
								useRealName={useRealName}
								userMentions={userMentions}
								groupMentions={groupMentions}
								draftMessage={draftMessage}
								allSearch={allSearch}
								perName={perName}
								searchKey={searchKey}
								hideUnreadStatus={hideUnreadStatus}
							/>
							{hideUnreadStatus && (
								<CustomIcon
									style={{ marginTop: 0, marginLeft: 5, marginRight: 10 }}
									name='notification-disabled'
									size={20}
									color={'#9ca2a8'}
								/>
							)}
							{unreadText()}
						</View>
					</>
				) : (
					<View style={[styles.titleContainer, styles.flex]}>
						<TypeIcon
							type={type}
							prid={prid}
							status={status}
							isGroupChat={isGroupChat}
							teamMain={teamMain}
							size={22}
							style={{ marginRight: 8 }}
							sourceType={sourceType}
						/>
						<Title name={name} hideUnreadStatus={hideUnreadStatus} alert={alert} />
						{autoJoin ? <Tag name={I18n.t('Auto-join')} /> : null}
						<View style={styles.wrapUpdatedAndBadge}>
							<UpdatedAt date={date} hideUnreadStatus={hideUnreadStatus} alert={alert} />
							{hideUnreadStatus && (
								<CustomIcon style={{ marginTop: 5 }} name='notification-disabled' size={20} color={'#9ca2a8'} />
							)}
						</View>
					</View>
				)}
			</Wrapper>
		</Touchable>
	);
};

export default RoomItem;
