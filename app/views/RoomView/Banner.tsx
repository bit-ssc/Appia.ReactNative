import React, { useCallback, useState } from 'react';
import { Dimensions, FlatList, LayoutChangeEvent, ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';

import I18n from '../../i18n';
import { MarkdownPreview } from '../../containers/markdown';
import Button from '../../containers/Button';
import { themes } from '../../lib/constants';
import styles from './styles';
import { useTheme } from '../../theme';
import FileIcon from '../../containers/FileIcon';
import { OpenFile } from '../../lib/methods/openFile';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { getAllFiles, getAllImages, getOtherFiles, IFile, isImage, previewImage } from '../AnnouncementView';
import { isAndroid } from '../../utils/deviceInfo';

interface IBannerProps {
	text?: string;
	title?: string;
	username?: string;
	bannerClosed?: boolean;
	closeBanner: () => void;
}

const Banner = React.memo(
	({ text, title, username, bannerClosed }: IBannerProps) => {
		const [showModal, openModal] = useState(false);
		const [isLoading, setIsLoading] = useState(false);
		const { theme } = useTheme();

		const toggleModal = () => openModal(prevState => !prevState);
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
			setIsLoading(true);
			const attachment = {
				title: item.fileName,
				title_link: item.fileUrl.trim(),
				type: item.fileType
			};
			await OpenFile(attachment);
			setIsLoading(false);
			read();
		};

		const read = () => {
			openModal(false);
			// closeBanner();
		};

		const getAllFileName = () => {
			if (allFiles && allFiles.length) {
				return allFiles
					.map(item => {
						if (isImage(item.fileType)) {
							return '[图片]';
						}
						return `[${item.fileName}]`;
					})
					.join(` `);
			}
			return '';
		};

		const renderImage = (item: { item: IFile; index: number }) => (
			<View style={{ width: '33%' }} onLayout={onLayout}>
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

		if (text && !bannerClosed) {
			return (
				<>
					<BorderlessButton
						style={[styles.bannerContainer, { backgroundColor: '#fff' }]}
						testID='room-view-banner'
						onPress={toggleModal}
					>
						<Image source={require('./image/announce.png')} />
						<View style={styles.announcementBox}>
							<View style={[{ flexDirection: 'row', justifyContent: 'space-between' }]}>
								<Text style={styles.announcementUserBy}>{I18n.t('Room_announcement_title', { username })}</Text>

								{/* 								<BorderlessButton onPress={closeBanner}>
									<CustomIcon color={themes[theme].auxiliaryText} name='close' size={20} />
								</BorderlessButton> */}
							</View>

							<View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 2 }}>
								<MarkdownPreview msg={`${announcement}${getAllFileName()}`} style={[{ fontSize: 14 }]} />
							</View>
						</View>
					</BorderlessButton>
					<Modal
						onBackdropPress={toggleModal}
						onBackButtonPress={toggleModal}
						useNativeDriver
						isVisible={showModal}
						animationIn='fadeIn'
						animationOut='fadeOut'
					>
						<View style={[styles.modalView, { backgroundColor: themes[theme].bannerBackground }]}>
							<Text style={[styles.bannerModalTitle, { color: themes[theme].auxiliaryText }]}>{title}</Text>
							<ScrollView style={styles.modalScrollView}>
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
							</ScrollView>
							<View style={styles.buttonBox}>
								<Button
									title={I18n.t('Close')}
									type='primary'
									color='#2f343d'
									backgroundColor='#e5e5e5'
									fontSize={14}
									style={styles.button}
									testID='read-submit'
									onPress={read}
								/>
							</View>
						</View>
						{isLoading ? <ActivityIndicator absolute size='large' /> : null}
					</Modal>
				</>
			);
		}

		return null;
	},
	(prevProps, nextProps) => prevProps.text === nextProps.text && prevProps.bannerClosed === nextProps.bannerClosed
);

export default Banner;
