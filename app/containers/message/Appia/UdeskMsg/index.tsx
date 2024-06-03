import React, { useCallback, useMemo } from 'react';
import RenderHtml from 'react-native-render-html';
import { Keyboard, NativeModules, TouchableOpacity, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSelector } from 'react-redux';

// import { attachmentToPhoto, IAttachment } from '../../../../definitions';
import { IMessageInner } from '../../interfaces';
import { MessageInner } from '../../MessageInner';
import Survey from './Survey';
import styles from '../../styles';
import { MessageImage } from '../../Image';
import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants';
import Faq from './Faq';
import TopAsk from './TopAsk';
import { getMaxMessageWidth } from '../helper';
import { attachmentToPhoto, IAttachment, IApplicationState } from '../../../../definitions';
import I18n from '../../../../i18n';
import { sendMessage } from '../../../../lib/methods/sendMessage';
import { getUserSelector } from '../../../../selectors/login';
import { showToast } from '../../../../lib/methods/helpers/showToast';
import { postStaffServiceAgent } from '../../../../lib/services/restApi';
import { isIOS } from '../../../../lib/methods';

const UdeskMsg: React.FC<IMessageInner> = props => {
	const { msgData, surveyStatus, msg, rid } = props;
	const { theme } = useTheme();
	const user = useSelector((state: IApplicationState) => getUserSelector(state));

	const {
		messages,
		assign_type: assignType,
		assign_info: assignInfo
	} = useMemo(() => {
		try {
			return JSON.parse(msgData as string);
		} catch (e) {
			return {};
		}
	}, [msgData]);

	const openImage = useCallback(() => {
		// Navigation.navigate('AttachmentView', {
		// 	attachment: {
		// 		image_url: msg,
		// 		title: ' '
		// 	}
		// });
		if (isIOS) {
			Keyboard.dismiss();
		}
		const attachment: IAttachment = {
			image_url: msg
		};
		const photo = attachmentToPhoto(attachment);
		const JSToNativeManager = NativeModules?.JSToNativeManager;
		JSToNativeManager.showPhoto(photo);
	}, [msg]);

	const onLongPress = () => {
		if (msg) {
			console.info(msg);
			if (message?.type === 'message') {
				Clipboard.setString(msg);
			} else if (messages?.ansType === 1) {
				const res = msg.replace(/<\/p>/gi, '\r\n').replace('&nbsp;', '');
				Clipboard.setString(res.replace(/<.*?>/gi, ''));
			}
			showToast(I18n.t('Copied_to_clipboard'));
		}
	};

	if (props.isInfo) {
		return <MessageInner {...props} />;
	}

	if (assignType === 'urobot') {
		if (assignInfo?.topAsk?.length) {
			return <TopAsk {...props} assignInfo={assignInfo} />;
		}

		if (messages?.ansType === 3) {
			return <Faq {...props} messageData={messages} />;
		}
	}

	const message = messages && messages[0];

	if (message?.type === 'survey') {
		if (surveyStatus) {
			return null;
		}

		return <Survey {...props} messageData={message} />;
	}

	if (message?.type === 'image' && msg) {
		return (
			<TouchableOpacity onPress={openImage}>
				<View style={{ minWidth: 300 }}>
					<MessageImage theme={theme} imgUri={msg as string} />
				</View>
			</TouchableOpacity>
		);
	}

	function SpanRenderer({ TDefaultRenderer, ...props }) {
		const onPress = async () => {
			const content = props.tnode?.init?.domNode?.attribs['data-content'];
			const messageType = props.tnode?.init?.domNode?.attribs['data-message-type'];
			const invalide = props.tnode?.init?.domNode?.attribs['data-invalid-transfer'];
			if (content) {
				sendMessage(rid, content, undefined, user);
			} else if (messageType === '2' && !(invalide === 'true')) {
				await postStaffServiceAgent(rid);
			}
		};
		return <TDefaultRenderer {...props} onPress={onPress} />;
	}

	const renderers = {
		span: SpanRenderer
	};

	const tagsStyles = {
		img: {
			overflow: 'hidden',
			width: getMaxMessageWidth() - 25,
			height: 300
		}
	};

	return (
		<TouchableOpacity style={[styles.msgText, { flex: 1 }]} onLongPress={onLongPress}>
			<RenderHtml
				contentWidth={getMaxMessageWidth() - 25}
				baseStyle={{
					fontSize: 16,
					lineHeight: 28,
					color: themes[theme].bodyText
				}}
				source={{ html: props.msg as string }}
				renderers={renderers}
				tagsStyles={tagsStyles}
			/>
		</TouchableOpacity>
	);
};

export default UdeskMsg;
