import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import FileIcon from '../../../containers/FileIcon';
import { Attachment } from '../types';
import useFile from './hooks/useFile';

interface FileTypeProps {
	attachments: Attachment;
}

// 负责文件类的待办
const FileType: React.FC<FileTypeProps> = ({ attachments }) => {
	const { attachment, openFile } = useFile(attachments);
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
			<TouchableOpacity
				style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0)' }}
				onPress={() => openFile()}
			>
				<FileIcon fontSize={30} fileName={attachment.type} />
				<Text
					numberOfLines={2}
					ellipsizeMode='tail'
					style={{ color: '#5297FF', marginLeft: 5, fontSize: 17, maxWidth: '90%', fontWeight: '700' }}
				>
					{attachments.title}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

export default FileType;
