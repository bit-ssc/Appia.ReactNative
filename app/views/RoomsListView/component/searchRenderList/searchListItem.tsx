import React, { useEffect, useReducer, useRef } from 'react';
import { Subscription } from 'rxjs';

import I18n from '../../../../i18n';
import { getUserPresence } from '../../../../lib/methods';
import { isGroupChat } from '../../../../lib/methods/helpers';
import { formatDate } from '../../../../lib/methods/helpers/room';
import RoomItem from './ListItem';
import { useUserStatus } from '../../../../containers/RoomItem/useUserStatus';
// import { IRoomContainerProps } from "./type"

const attrs = ['item', 'width', 'isFocused', 'showLastMessage', 'autoJoin', 'showAvatar', 'displayMode'];
// IRoomContainerProps<ItemT>
const RoomItemContainer = React.memo(
	({
		item,
		id,
		onPress,
		showLastMessage,
		username,
		useRealName,
		showAvatar,
		displayMode,
		getRoomTitle = () => 'title',
		getRoomAvatar = () => '',
		showDot,
		channelDotColor,
		discussionDotColor,
		teamDotColor,
		borderRadius
	}: any) => {
		const name = getRoomTitle(item);
		const avatar = getRoomAvatar(item);
		const date = item.roomUpdatedAt && formatDate(item.roomUpdatedAt);
		const alert = item.alert || item.tunread?.length;
		const [_, forceUpdate] = useReducer(x => x + 1, 1);
		const roomSubscription = useRef<Subscription | null>(null);

		const { connected, status } = useUserStatus(item.t, item?.visitor?.status, id);

		useEffect(() => {
			const init = () => {
				if (item?.observe) {
					const observable = item.observe();
					roomSubscription.current = observable?.subscribe?.(() => {
						if (_) forceUpdate();
					});
				}
			};
			init();

			return () => roomSubscription.current?.unsubscribe();
		}, []);

		useEffect(() => {
			const isDirect = !!(item.t === 'd' && id && !isGroupChat(item));
			if (connected && isDirect) {
				getUserPresence(id);
			}
		}, [connected]);

		const handleOnPress = () => onPress(item);

		let accessibilityLabel = '';
		if (item.unread === 1) {
			accessibilityLabel = `, ${item.unread} ${I18n.t('alert')}`;
		} else if (item.unread > 1) {
			accessibilityLabel = `, ${item.unread} ${I18n.t('alerts')}`;
		}
		if (item.userMentions > 0) {
			accessibilityLabel = `, ${I18n.t('you_were_mentioned')}`;
		}
		if (date) {
			accessibilityLabel = `, ${I18n.t('last_message')} ${date}`;
		}

		return (
			<>
				<RoomItem
					name={name}
					avatar={avatar}
					onPress={handleOnPress}
					isGroupChat={isGroupChat(item)}
					date={date}
					accessibilityLabel={accessibilityLabel}
					favorite={item.f}
					rid={item.rid}
					type={item.t}
					prid={item.prid}
					status={status}
					hideUnreadStatus={item.hideUnreadStatus}
					alert={alert}
					lastMessage={item.lastMessage}
					showLastMessage={showLastMessage}
					username={username}
					useRealName={useRealName}
					unread={item.unread}
					userMentions={item.userMentions}
					groupMentions={item.groupMentions}
					showAvatar={showAvatar}
					displayMode={displayMode}
					draftMessage={item.draftMessage}
					showDot={showDot}
					channelDotColor={channelDotColor}
					discussionDotColor={discussionDotColor}
					teamDotColor={teamDotColor}
					borderRadius={borderRadius}
					allSearch={item.allSearch}
					perName={item.perName}
					searchKey={item.searchKey}
				/>
			</>
		);
	},
	(props, nextProps) => attrs.every(key => props[key] === nextProps[key])
);

export default RoomItemContainer;
