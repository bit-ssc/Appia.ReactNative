import React, { useContext, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import { dequal } from 'dequal';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';

import Touchable from './Touchable';
import Markdown from '../markdown';
import styles from './styles';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment } from '../../definitions';
import { TSupportedThemes, useTheme } from '../../theme';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import { OpenFile } from '../../lib/methods/openFile';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
	theme: TSupportedThemes;
}

interface IMessageImage {
	file: IAttachment;
	imageUrl?: string;
	showAttachment?: (file: IAttachment) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
}

const ImageProgress = createImageProgress(FastImage);

const Button = React.memo(({ children, onPress, disabled, theme }: IMessageButton) => (
	<Touchable
		disabled={disabled}
		onPress={onPress}
		style={styles.imageContainer}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
	>
		{children}
	</Touchable>
));

export const MessageImage = React.memo(({ imgUri, theme, size }: { imgUri: string; theme: TSupportedThemes; size?: any }) => {
	const imgSize = { width: 200, height: 200 };
	if (size && size.height && size.width) {
		const a = size.width / size.height;
		const b = 200 / 150;
		if (a > b) {
			imgSize.width = 200;
			imgSize.height = 200 / a;
		} else {
			imgSize.height = 150;
			imgSize.width = 150 * a;
		}
	}
	return (
		<ImageProgress
			style={[styles.image, { borderColor: themes[theme].borderColor }, imgSize]}
			source={{ uri: encodeURI(imgUri) }}
			resizeMode={FastImage.resizeMode.cover}
			indicator={Progress.Pie}
			indicatorProps={{
				color: themes[theme].actionTintColor
			}}
		/>
	);
});

const ImageContainer = React.memo(
	({ file, imageUrl, showAttachment, getCustomEmoji, style, isReply }: IMessageImage) => {
		const { theme } = useTheme();
		const { baseUrl, user } = useContext(MessageContext);
		const [img, setImg] = useState<string | undefined>(
			imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl)
		);

		if (file.localPath) {
			RNFS.exists(file.localPath).then(exist => {
				if (exist) {
					setImg(`file://${file.localPath}`);
				}
			});
		}
		if (!img) {
			return null;
		}

		const onPress = () => {
			if (file.isUpload) {
				return;
			}
			if (showAttachment) {
				return showAttachment(file);
			}

			OpenFile(file);
		};

		if (file.description) {
			return (
				<View>
					<Markdown
						msg={file.description}
						style={[isReply && style]}
						username={user.username}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
					<Button theme={theme} onPress={onPress}>
						<MessageImage imgUri={img} theme={theme} size={file.image_dimensions} />
					</Button>
				</View>
			);
		}

		return (
			<Button disabled={isReply} theme={theme} onPress={onPress}>
				<MessageImage imgUri={img} theme={theme} size={file.image_dimensions} />
			</Button>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
