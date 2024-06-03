import React from 'react';

import { IMessageInner } from './interfaces';
import Discussion from './Discussion';
import Content from './Content';
import CallButton from './CallButton';
import Blocks from './Blocks';
import Thread from './Thread';
import Reactions from './Reactions';
import Attachments from './Attachments';
import Urls from './Urls';
import Broadcast from './Broadcast';

export const MessageInner = React.memo((props: IMessageInner) => {
	// const { attachments } = props;
	// const isCollapsible = attachments ? attachments[0] && attachments[0].collapsed : false;
	if (props.type === 'discussion-created') {
		return (
			<>
				<Discussion {...props} />
			</>
		);
	}

	if (props.type === 'jitsi_call_started') {
		return (
			<>
				<Content {...props} isInfo />
				<CallButton {...props} />
			</>
		);
	}

	if (props.blocks && props.blocks.length) {
		return (
			<>
				<Blocks {...props} />
				<Thread {...props} />
				<Reactions {...props} />
			</>
		);
	}

	return (
		<>
			{/* {isCollapsible ? (*/}
			{/*	<>*/}
			{/*		<Content {...props} />*/}
			{/*		<Attachments {...props} />*/}
			{/*	</>*/}
			{/* ) : (*/}
			<>
				<Content {...props} />
				<Attachments {...props} />
			</>
			{/* )}*/}

			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</>
	);
});
MessageInner.displayName = 'MessageInner';
