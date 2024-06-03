import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { IMessageInner } from '../interfaces';
import styles from './styles';
import FileSync from '../../Icon/FileSync';
import { IAttachment } from '../../../definitions';
import { openCloudFile } from '../../../lib/methods/openFile';
import { IFileInfo } from '../../../definitions/ICloudDisk';
import { showToast } from '../../../lib/methods/helpers/showToast';

interface IMsgData {
	title: string;
	icon: string;
	defaultCoverUrl: string;
	taskId: string;
	fileData: IAttachment;
}

const CloudDocMsg: React.FC<IMessageInner> = props => {
	const { msgData } = props;
	const msgDataDetail: IMsgData = JSON.parse(typeof msgData === 'string' ? msgData : '');

	if (!msgData) {
		return <Text>message error</Text>;
	}

	const preview = () => {
		if (!msgDataDetail.fileData) {
			showToast('该文件已失效');
			return;
		}
		openCloudFile(msgDataDetail.fileData as unknown as IFileInfo);
	};

	return (
		<TouchableOpacity style={styles.cloudDocContainer} onPress={preview}>
			<View style={styles.cloudDocTitle}>
				<FileSync width={20} height={20} />
				<Text style={styles.titleText} numberOfLines={1}>
					{msgDataDetail.title}
				</Text>
			</View>
			<View style={styles.cloudDocContent}>
				<Image source={{ uri: msgDataDetail.defaultCoverUrl }} style={[{ width: 247, height: 120 }]} />
			</View>
		</TouchableOpacity>
	);
};

export default CloudDocMsg;
