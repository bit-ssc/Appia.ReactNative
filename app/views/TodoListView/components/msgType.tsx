import React from 'react';
import { View, TouchableOpacity, NativeModules } from 'react-native';
import { createImageProgress } from 'react-native-image-progress';
import { useSelector } from 'react-redux';
import * as Progress from 'react-native-progress';
import FastImage from 'react-native-fast-image';

import { attachmentToPhoto } from '../../../definitions';
import { Attachment } from '../types';
import { formatAttachmentUrl } from '../../../lib/methods';
import { getUserSelector } from '../../../selectors/login';

const ImageProgress = createImageProgress(FastImage);
// 负责图片类的待办
const MessageType = ({ attachment }: { attachment: Attachment }) => {
	const baseUrl = useSelector((state: any) => state.server.server);
	const user = useSelector((state: any) => getUserSelector(state));

	const press = () => {
		const photo = attachmentToPhoto(attachment as any);
		const JSToNativeManager = NativeModules?.JSToNativeManager;
		JSToNativeManager?.showPhoto(photo);
	};

	const img = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
	return (
		<View>
			<TouchableOpacity onPress={press}>
				<ImageProgress
					style={{
						left: 0,
						width: '100%',
						height: 200
					}}
					source={{ uri: img }}
					indicator={Progress.Pie}
					indicatorProps={{
						size: 80,
						borderWidth: 0,
						color: 'rgba(150, 150, 150, 1)',
						unfilledColor: 'rgba(200, 200, 200, 0.2)'
					}}
					resizeMode={FastImage.resizeMode.contain}
				/>
			</TouchableOpacity>
		</View>
	);
};

export default MessageType;
