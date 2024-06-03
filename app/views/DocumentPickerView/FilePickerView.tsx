import React from 'react';
import { View, Text } from 'react-native';

import FileIcon from '../../containers/FileIcon';
import styles from './styles';

interface IFilePickerViewProps {
	sender: string;
	date: string;
	fileName: string;
	fileSize: number;
}

export default class FilePickerView extends React.Component<IFilePickerViewProps, any> {
	render() {
		const { fileSize, fileName, sender, date } = this.props;
		let size = fileSize / 1024;
		let sizeShow = `${size.toFixed(1)}KB`;
		// @ts-ignore
		if (size > 1024) {
			// @ts-ignore
			size = (size / 1024).toFixed(1);
			sizeShow = `${size}M`;
		}
		return (
			<View style={[styles.fileItem]}>
				<FileIcon fileName={fileName} />
				<View style={[styles.fileText]}>
					<Text numberOfLines={1} ellipsizeMode={'middle'} style={[styles.fileName]}>
						{fileName}
					</Text>
					<Text style={[styles.fileSize]}>{sizeShow}</Text>
					<Text style={[styles.sender]}>{`${sender} | ${date.split('T')[0]}`}</Text>
				</View>
			</View>
		);
	}
}
