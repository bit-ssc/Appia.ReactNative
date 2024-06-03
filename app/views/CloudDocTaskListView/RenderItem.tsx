import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import { CloudDocFileItem } from '../CloudDocUploadView/CloudDocFileManager';
import { CloseIcon, ImageIcon, PauseIcon, PlayIcon, ReplayIcon } from './SvgIcon';
import I18n from '../../i18n';

interface RenderItemPro {
	item: CloudDocFileItem;
	replayOnpress: (item: CloudDocFileItem) => void;
	closeOnpress: (item: CloudDocFileItem) => void;
	pauseOnPress: (item: CloudDocFileItem) => void;
	taskSuccess: () => void;
	taskFailed: () => void;
}
const RenderItem: React.FC<RenderItemPro> = ({ item, replayOnpress, closeOnpress, pauseOnPress, taskSuccess, taskFailed }) => {
	const [progress, setProgress] = useState(item.isUpload ? item.sent / item.size : item.received / item.size);
	useEffect(() => {
		item.uploadProgressCallBack = (sent, total) => {
			item.sent = sent;
			item.size = total;
			setProgress(sent / total);
		};
		item.downloadProgressCallBack = (received, total) => {
			item.received = received;
			item.size = total;
			setProgress(received / total);
		};
		item.taskFaild = () => {
			taskFailed();
		};
		item.taskSuccess = () => {
			taskSuccess();
		};
	}, []);

	return (
		<View style={styles.renderItem}>
			<ImageIcon />
			<View style={{ flexDirection: 'column', marginLeft: 12, flex: 1 }}>
				<Text style={item.isFailed ? styles.renderItemFailedTitle : styles.renderItemDefualtTitle}>{item.filename}</Text>
				<Text style={item.isFailed ? styles.renderItemFailedContent : styles.renderItemDefaultContent}>
					{
						// eslint-disable-next-line no-nested-ternary
						item.isFailed
							? item.isUpload
								? I18n.t('Cloud_Doc_File_Transmit_Upload_Failed')
								: I18n.t('Cloud_Doc_File_Transmit_Download_Failed')
							: `${item.isUpload ? item.sent : item.received} / ${item.size}`
					}
				</Text>
				<View style={{ width: '100%', flexDirection: 'row', height: 20, alignItems: 'center', marginTop: 4 }}>
					<View style={{ height: 4, backgroundColor: '#F5F5F5', borderRadius: 4, flex: 1 }}>
						<View
							style={{
								height: '100%',
								width: `${progress * 100}%`,
								backgroundColor: item.isFailed ? '#CCC' : '#1B5BFF',
								borderRadius: 4
							}}
						/>
					</View>
					{item.isFailed || item.isPause ? (
						<TouchableOpacity style={{ marginLeft: 12 }} onPress={() => replayOnpress(item)}>
							{item.isFailed ? <ReplayIcon /> : <PlayIcon />}
						</TouchableOpacity>
					) : null}
					<TouchableOpacity style={{ marginLeft: 12 }} onPress={() => (item.isPause ? closeOnpress(item) : pauseOnPress(item))}>
						{item.isPause || item.isFailed ? <CloseIcon /> : <PauseIcon />}
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	renderItem: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		flexDirection: 'row',
		width: '100%',
		backgroundColor: 'white'
	},
	renderItemDefualtTitle: {
		color: '#333',
		fontSize: 15,
		fontWeight: '400'
	},
	renderItemFailedTitle: {
		color: '#FF3141',
		fontSize: 15,
		fontWeight: '400'
	},
	renderItemDefaultContent: {
		color: '#999',
		fontSize: 12,
		fontWeight: '400',
		marginTop: 4
	},
	renderItemFailedContent: {
		color: '#FF3141',
		fontSize: 12,
		fontWeight: '400',
		marginTop: 4
	}
});
export default RenderItem;
