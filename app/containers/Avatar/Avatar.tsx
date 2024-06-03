import React from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import { SubscriptionType } from '../../definitions';
import Emoji from '../markdown/Emoji';
import { IAvatar } from './interfaces';

const Avatar = React.memo(
	({
		server,
		style,
		avatar,
		children,
		userId,
		token,
		onPress,
		emoji,
		getCustomEmoji,
		avatarETag,
		isStatic,
		rid,
		blockUnauthenticatedAccess,
		serverVersion,
		text,
		size = 25,
		borderRadius = 4,
		type = SubscriptionType.DIRECT,
		externalProviderUrl,
		federated = ''
	}: IAvatar) => {
		const showErrorImage = (type: string) =>
			type === SubscriptionType.DIRECT ? require('./avatar_error_d.png') : require('./avatar_error_group.png');

		// const [loadError, setLoadError] = useState(false);
		if ((!text && !avatar && !emoji && !rid) || !server) {
			return null;
		}

		const avatarStyle = {
			width: size,
			height: size,
			borderRadius
		};

		let image;
		if (emoji) {
			image = <Emoji getCustomEmoji={getCustomEmoji} isMessageContainsOnlyEmoji literal={emoji} style={avatarStyle} />;
		} else {
			let uri = avatar;
			if (!isStatic) {
				uri = getAvatarURL({
					type,
					text,
					size,
					userId,
					token,
					avatar,
					server,
					avatarETag,
					serverVersion,
					rid,
					blockUnauthenticatedAccess,
					externalProviderUrl,
					federated
				});
			}

			image = (
				<FastImage
					style={avatarStyle}
					defaultSource={showErrorImage(type)}
					source={{
						uri,
						headers: RocketChatSettings.customHeaders,
						priority: FastImage.priority.high
					}}
				/>
			);
		}

		if (onPress) {
			image = <Touchable onPress={onPress}>{image}</Touchable>;
		}

		return (
			<View style={[avatarStyle, style]} testID='avatar'>
				{image}
				{children}
			</View>
		);
	}
);

export default Avatar;
