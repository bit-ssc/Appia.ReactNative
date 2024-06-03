import React from 'react';
import { View, Text } from 'react-native';

import FileIcon from '../../containers/FileIcon';
import styles from './styles';
import useMoment from '../../lib/hooks/useMoment';

interface IFileItemViewProps {
	sender: string;
	date: string;
	fileName: string;
	fileSize: number;
}

const FileItemView: React.FC<IFileItemViewProps> = ({ fileSize, fileName, sender, date }) => {
	const timeDate = useMoment(date, 'search');
	let size = fileSize / 1024;
	let sizeShow = `${size.toFixed(1)}KB`;
	// @ts-ignore
	if (size > 1024) {
		// @ts-ignore
		size = (size / 1024).toFixed(1);
		sizeShow = `${size}M`;
	}
	// IFileItemViewProps

	return (
		<View style={{ flexDirection: 'column' }}>
			<View style={[styles.fileItem]}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<FileIcon fileName={fileName} />

					<View style={[styles.fileText]}>
						<Text numberOfLines={1} ellipsizeMode={'middle'} style={[styles.fileName]}>
							{fileName}
						</Text>
						{/* <Text style={[styles.sender]}>{`${sender} | ${date.split('T')[0]}`}</Text> */}

						<Text style={[styles.sender]}>{`${sender} | ${timeDate}`}</Text>
					</View>
				</View>

				<Text style={[styles.fileSize]}>{sizeShow}</Text>
			</View>
		</View>
	);
};

export default FileItemView;
