import React, { useCallback, useState } from 'react';
import { Dimensions, FlatList, LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';

import { MarkdownPreview } from '../../containers/markdown';
import { themes } from '../../lib/constants';
import styles from './styles';
import { useTheme } from '../../theme';
import FileIcon from '../../containers/FileIcon';
import { OpenFile } from '../../lib/methods/openFile';
import { getAllFiles, getAllImages, getOtherFiles, IFile, previewImage } from '../AnnouncementView';
import { isAndroid } from '../../utils/deviceInfo';

interface IAnnouncementMsgProps {
	text?: string;
	username?: string;
}

const AnnouncementMsg = React.memo(
	({ text }: IAnnouncementMsgProps) => {
		const { theme } = useTheme();

		const separator = '\u0001\u0002';
		const allMessage = (text ?? '').split(separator);
		const announcement = allMessage && allMessage.length > 0 ? allMessage[0] : '';
		const [size, setSize] = useState({
			width: (Dimensions.get('window').width - 90) / 3,
			height: (Dimensions.get('window').width - 90) / 3
		});

		const allFiles = getAllFiles(allMessage);
		const allImages = getAllImages(allFiles);
		const otherFiles = getOtherFiles(allFiles);
		let minWidth = 0;
		if (allImages.length > 0) {
			minWidth = size.width * (allImages.length <= 3 ? allImages.length : 3);
		}
		const onLayout = useCallback((evt: LayoutChangeEvent) => {
			if (isAndroid) {
				const { width } = evt.nativeEvent.layout;
				setSize({
					width,
					height: width
				});
			}
		}, []);
		const openFile = async (item: IFile) => {
			// setIsLoading(true);
			const attachment = {
				title: item.fileName,
				title_link: item.fileUrl.trim(),
				type: item.fileType
			};
			await OpenFile(attachment);
			// setIsLoading(false);
		};

		const itemWidth = (Dimensions.get('window').width - 90) / 3 - 5;

		const renderImage = (item: { item: IFile; index: number }) => (
			<View style={{ width: itemWidth }} onLayout={onLayout}>
				<Touchable
					onPress={() => {
						previewImage(item?.item);
					}}
				>
					<FastImage
						style={{ height: size.height, marginRight: 5, marginBottom: 5 }}
						source={{
							uri: item?.item?.fileUrl,
							priority: FastImage.priority.high
						}}
						resizeMode={FastImage.resizeMode.cover}
					/>
				</Touchable>
			</View>
		);

		if (text) {
			return (
				<View style={[styles.announcementMsgBg, { minWidth }]}>
					<Text style={{ fontSize: 18, fontWeight: '600' }}>{'公告'}</Text>
					<View
						style={{
							height: 0.5,
							width: '80%',
							backgroundColor: themes[theme].auxiliaryBackground,
							marginTop: 8,
							marginBottom: 8
						}}
					></View>
					<MarkdownPreview msg={announcement} style={[styles.bannerText]} numberOfLines={0} canLinefeed={true} />

					{allImages ? (
						<FlatList
							style={{ marginTop: 8, flexGrow: 0, width: '100%' }}
							data={allImages}
							renderItem={({ item, index }) => renderImage({ item, index })}
							numColumns={3}
						/>
					) : null}
					{otherFiles &&
						otherFiles.map(item => (
							<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
								<TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => openFile(item)}>
									<FileIcon fontSize={20} fileName={item.fileType} />
									<Text style={{ color: '#5297FF', marginLeft: 5 }}>{item.fileName}</Text>
								</TouchableOpacity>
							</View>
						))}
				</View>
			);
		}

		return null;
	},
	(prevProps, nextProps) => prevProps.text === nextProps.text
);

export default AnnouncementMsg;
