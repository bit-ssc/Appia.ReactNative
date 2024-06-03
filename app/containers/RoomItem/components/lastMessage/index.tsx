import React from 'react';

import LastMessage from '../../LastMessage';
import DetailMsg from './detailMsg';
import { ILastMessageProps } from '../../interfaces';

interface SearchMessage extends ILastMessageProps {
	perName: string;
	searchKey: string;
	allSearch: boolean;
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const Index = ({
	lastMessage,
	showLastMessage,
	type,
	username,
	alert,
	useRealName,
	userMentions,
	groupMentions,
	draftMessage,
	allSearch,
	perName,
	searchKey,
	hideUnreadStatus
}: SearchMessage) => (
	<>
		{allSearch ? (
			<DetailMsg perName={perName} searchKey={searchKey} />
		) : (
			<LastMessage
				lastMessage={lastMessage}
				type={type}
				showLastMessage={showLastMessage}
				username={username || ''}
				alert={alert}
				useRealName={useRealName}
				userMentions={userMentions}
				groupMentions={groupMentions}
				draftMessage={draftMessage}
				hideUnreadStatus={hideUnreadStatus}
			/>
		)}
	</>
);

export default Index;
