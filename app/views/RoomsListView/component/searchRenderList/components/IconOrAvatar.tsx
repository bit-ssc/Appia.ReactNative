import React from 'react';

import Avatar from '../../../../../containers/Avatar';
import { DisplayMode } from '../../../../../lib/constants';
import styles from '../styles';

const IconOrAvatar = ({ avatar, type, rid, showAvatar, displayMode, borderRadius }: any): React.ReactElement | null => {
	if (showAvatar) {
		return (
			<Avatar
				text={avatar}
				size={displayMode === DisplayMode.Condensed ? 36 : 48}
				type={type}
				style={styles.avatar}
				rid={rid}
				borderRadius={borderRadius}
			/>
		);
	}

	// if (displayMode === DisplayMode.Expanded && showLastMessage) {
	// 	return (
	// 		<View style={styles.typeIcon}>
	// 			<TypeIcon
	// 				type={type}
	// 				prid={prid}
	// 				status={status}
	// 				isGroupChat={isGroupChat}
	// 				teamMain={teamMain}
	// 				size={24}
	// 				style={{ marginRight: 12 }}
	// 				sourceType={sourceType}
	// 			/>
	// 		</View>
	// 	);
	// }

	return null;
};

export default IconOrAvatar;
