import React, { useContext, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { dequal } from 'dequal';
import FastImage from 'react-native-fast-image';
import str from 'underscore.string';

import Touchable from './Touchable';
import Markdown from '../markdown';
import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { IAttachment, TGetCustomEmoji } from '../../definitions';
import RCActivityIndicator from '../ActivityIndicator';
import Attachments from './Attachments';
import FileIcon from '../FileIcon';
import { TSupportedThemes, useTheme } from '../../theme';
import messageStyles from './styles';
import { getForwardMsgTitle } from './Appia/ForwardMsg';
import { OpenFile } from '../../lib/methods/openFile';
import { isIOS } from '../../lib/methods';
import useMoment from '../../lib/hooks/useMoment';

const styles = StyleSheet.create({
	replayContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderRadius: 8,
		paddingTop: 8,
		paddingBottom: 8,
		paddingLeft: 12,
		paddingRight: 12,
		backgroundColor: '#EEEEEE'
	},
	fileIconContainer: {
		marginLeft: 20
	},
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 4,
		alignSelf: 'flex-start'
	},
	attachmentContainer: {
		flex: 1,
		flexDirection: 'column',
		paddingVertical: 4,
		paddingLeft: 8,
		borderLeftWidth: 1,
		borderColor: '#DCDCDC'
	},
	backdrop: {
		...StyleSheet.absoluteFillObject
	},
	authorContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
		// marginBottom: 8
	},
	author: {
		fontSize: 13,
		...sharedStyles.textMedium,
		flexShrink: 1
	},
	fieldsContainer: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	},
	fieldContainer: {
		flexDirection: 'column',
		padding: 10
	},
	fieldTitle: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	fieldValue: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	marginTop: {
		marginTop: 4
	},
	marginBottom: {
		marginBottom: 4
	},
	image: {
		height: 200,
		flex: 1,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4,
		marginBottom: 1
	},
	title: {
		flex: 1,
		fontSize: 16,
		marginBottom: 3,
		...sharedStyles.textMedium
	}
});

interface IMessageReply {
	attachment: IAttachment;
	timeFormat?: string;
	index: number;
	getCustomEmoji: TGetCustomEmoji;
	messageId: string;
}

const Title = React.memo(
	({ attachment, timeFormat, theme }: { attachment: IAttachment; timeFormat?: string; theme: TSupportedThemes }) => {
		const time = useMoment(attachment.ts, timeFormat);
		const dataTime = attachment.message_link && attachment.ts ? time : null;
		return (
			<View style={styles.authorContainer}>
				{attachment.author_name ? (
					<Text numberOfLines={1} style={[styles.author, { color: themes[theme].auxiliaryTintColor }]}>
						{attachment.author_name}
					</Text>
				) : null}
				{dataTime ? <Text style={[messageStyles.time, { color: themes[theme].auxiliaryText }]}>{dataTime}</Text> : null}
				{attachment.title ? <Text style={[styles.title, { color: themes[theme].bodyText }]}>{attachment.title}</Text> : null}
			</View>
		);
	}
);

export const formatMemorySize = (memorySize: number): string | null => {
	if (typeof memorySize !== 'number') {
		return null;
	}

	if (memorySize === 0) {
		return '0KB';
	}

	const units = ['bytes', 'kB', 'MB', 'GB'];

	let order;
	for (order = 0; order < units.length - 1; ++order) {
		const upperLimit = Math.pow(1024, order + 1);

		if (memorySize < upperLimit) {
			break;
		}
	}

	const divider = Math.pow(1024, order);
	const decimalDigits = order === 0 ? 0 : 2;
	return `${str.numberFormat(memorySize / divider, decimalDigits)} ${units[order]}`;
};

const Description = React.memo(
	({
		attachment,
		fileSize,
		getCustomEmoji,
		theme
	}: {
		attachment: IAttachment;
		fileSize: number;
		getCustomEmoji: TGetCustomEmoji;
		theme: TSupportedThemes;
	}) => {
		const { user } = useContext(MessageContext);
		let text = attachment.text || attachment.title;
		if (attachment.msgType === 'forwardMergeMessage') {
			text = getForwardMsgTitle(attachment.msgData);
		}
		if (!text) {
			return null;
		}

		return (
			<Markdown
				msg={fileSize ? formatMemorySize(fileSize) : text}
				style={[{ color: themes[theme].auxiliaryTintColor, fontSize: 14 }]}
				username={user.username}
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.attachment.text !== nextProps.attachment.text) {
			return false;
		}
		if (prevProps.attachment.title !== nextProps.attachment.title) {
			return false;
		}
		if (prevProps.theme !== nextProps.theme) {
			return false;
		}
		return true;
	}
);

const UrlImage = React.memo(
	({ image }: { image?: string }) => {
		const { baseUrl, user } = useContext(MessageContext);

		if (!image) {
			return null;
		}

		image = image.includes('http') ? image : `${baseUrl}/${image}?rc_uid=${user.id}&rc_token=${user.token}`;
		return <FastImage source={{ uri: image }} style={styles.image} resizeMode={FastImage.resizeMode.cover} />;
	},
	(prevProps, nextProps) => prevProps.image === nextProps.image
);

const Fields = React.memo(
	({
		attachment,
		theme,
		getCustomEmoji
	}: {
		attachment: IAttachment;
		theme: TSupportedThemes;
		getCustomEmoji: TGetCustomEmoji;
	}) => {
		const { user } = useContext(MessageContext);

		if (!attachment.fields) {
			return null;
		}

		return (
			<View style={styles.fieldsContainer}>
				{attachment.fields.map(field => (
					<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
						<Text style={[styles.fieldTitle, { color: themes[theme].bodyText }]}>{field.title}</Text>
						<Markdown msg={field?.value || ''} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
					</View>
				))}
			</View>
		);
	},
	(prevProps, nextProps) =>
		dequal(prevProps.attachment.fields, nextProps.attachment.fields) && prevProps.theme === nextProps.theme
);

const Reply = React.memo(
	({ attachment, timeFormat, index, getCustomEmoji, messageId }: IMessageReply) => {
		const [loading, setLoading] = useState(false);
		const { theme } = useTheme();
		const { user, jumpToMessage } = useContext(MessageContext);

		if (!attachment) {
			return null;
		}

		const onPress = async () => {
			console.info('attachment', attachment);
			if (attachment.isUpload) {
				return;
			}
			console.info('onPress1');
			if (attachment.type === 'file' && attachment.title_link) {
				setLoading(true);
				await OpenFile(attachment, undefined, messageId);
				setLoading(false);
				return;
			}
			console.info('onPress2');
			if (attachment.attachments && attachment.attachments.length) {
				if (isIOS) {
					Keyboard.dismiss();
				}
				const quoteAttachment = attachment.attachments[0];
				const media = {
					image_url: quoteAttachment.title_link,
					video_url: quoteAttachment.video_url,
					...quoteAttachment
				} as IAttachment;
				// const photo = attachmentToPhoto(media);
				// const JSToNativeManager = NativeModules?.JSToNativeManager;
				// JSToNativeManager.showPhoto(photo);
				setLoading(true);
				await OpenFile(media, undefined, messageId);
				setLoading(false);
				return;
			}
			console.info('onPress3');
			if (attachment.message_link) {
				return jumpToMessage(attachment.message_link);
			}

			console.info('onPress4');
			const url = attachment.title_link || attachment.author_link;
			if (!url || attachment.isUpload) {
				return;
			}
			console.info('onPress5');
			openLink(url, theme);
		};

		let { borderColor } = themes[theme];
		if (attachment.color) {
			borderColor = attachment.color;
		}

		const isFile = !!attachment.title_link;
		const fileNotEmpty = !!attachment.file_size && attachment.file_size !== 0;
		const showDescription = !isFile || fileNotEmpty;

		return (
			<>
				{/* The testID is to test properly quoted messages using it as ancestor  */}
				<Touchable
					testID={`reply-${attachment?.author_name}-${attachment?.text}`}
					onPress={isFile ? onPress : undefined}
					style={[
						styles.button,
						index > 0 && styles.marginTop,
						attachment.description && styles.marginBottom,
						{
							borderColor
						}
					]}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
					disabled={loading}
				>
					<View style={[styles.replayContainer, isFile && { backgroundColor: '#FFFFFF' }]}>
						<View style={[styles.attachmentContainer, isFile && { borderLeftWidth: 0, paddingLeft: 0 }]}>
							<Title attachment={attachment} timeFormat={timeFormat} theme={theme} />
							<Attachments
								id={messageId}
								attachments={attachment.attachments}
								getCustomEmoji={getCustomEmoji}
								timeFormat={timeFormat}
								style={[{ color: themes[theme].auxiliaryTintColor, fontSize: 14, marginBottom: 8 }]}
								isReply
							/>
							<UrlImage image={attachment.thumb_url} />
							{showDescription && (
								<Description
									fileSize={attachment.file_size || 0}
									attachment={attachment}
									getCustomEmoji={getCustomEmoji}
									theme={theme}
								/>
							)}
							<Fields attachment={attachment} getCustomEmoji={getCustomEmoji} theme={theme} />
							{loading ? (
								<View style={[styles.backdrop]}>
									<View
										style={[
											styles.backdrop,
											{ backgroundColor: themes[theme].bannerBackground, opacity: themes[theme].attachmentLoadingOpacity }
										]}
									></View>
									<RCActivityIndicator />
								</View>
							) : null}
						</View>
						{isFile && (
							<View style={styles.fileIconContainer}>
								<FileIcon fileName={attachment.title} />
							</View>
						)}
					</View>
				</Touchable>
				<Markdown msg={attachment.description} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.attachment, nextProps.attachment)
);

Reply.displayName = 'MessageReply';
Title.displayName = 'MessageReplyTitle';
Description.displayName = 'MessageReplyDescription';
Fields.displayName = 'MessageReplyFields';

export default Reply;
