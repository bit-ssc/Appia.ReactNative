import React, { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import styles from './styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';
// @ts-ignore
import { PhotograghIcon, PhotoIcon, VideoIcon, FileIcon, CloudDisk, VoiceChat } from './MessageBoxSvg';
import { APPIA_TAG, hasShowTagPermission } from '../../utils/Federation';

interface IMessageBoxAttachmentKeyboard {
	theme: TSupportedThemes;
	onItemSelected: Function;
	federated?: boolean;
	roomType?: string;
	showAppiaTag?: number;
	isShow: boolean;
}

interface IAttchmentType {
	name: string;
	icon: JSX.Element;
	type: string;
}

const AttachmentKeyboard: React.FC<IMessageBoxAttachmentKeyboard> = ({ theme, onItemSelected, showAppiaTag, isShow }) => {
	const height = useSharedValue(0);
	const [pIsShow, setPIshow] = useState(false);

	const contentList: IAttchmentType[] = [
		{ name: '照片', icon: <PhotoIcon fontSize={50} />, type: 'photo' },
		{ name: '拍照', icon: <PhotograghIcon fontSize={50} />, type: 'photogragh' },
		{ name: '录像', icon: <VideoIcon fontSize={50} />, type: 'video' },
		{ name: '文件', icon: <FileIcon fontSize={50} />, type: 'file' }
	];

	if (!hasShowTagPermission(showAppiaTag ?? 0, APPIA_TAG.external)) {
		contentList.push({ name: '云盘文件', icon: <CloudDisk fontSize={50} />, type: 'cloud_disk' });
	}

	contentList.push({ name: '语音通话', icon: <VoiceChat fontSize={50} />, type: 'voice_chat' });

	const renderItem = (item: IAttchmentType) => (
		<TouchableOpacity style={styles.attachmentTouch} onPress={() => onItemSelected(item.type)}>
			{item.icon}
			<Text style={{ color: '#666666', marginTop: 10 }}>{item.name}</Text>
		</TouchableOpacity>
	);

	if (isShow !== pIsShow) {
		if (isShow) {
			setTimeout(() => {
				height.value = withTiming(200, {
					// 在iOS上先关掉
					// duration: isIOS ? 200 : 0,
					duration: 0,
					easing: Easing.linear
				});
			}, 0);
		} else {
			setTimeout(() => {
				height.value = withTiming(0, {
					// 在iOS上先关掉
					// duration: isIOS ? 200 : 0,
					duration: 0,
					easing: Easing.linear
				});
			}, 0);
		}
		setPIshow(isShow);
	}

	const animatedStyles = useAnimatedStyle(() => ({
		height: height.value
	}));

	return (
		<Animated.View
			style={[
				styles.attachmentKeyboard,
				{
					borderTopColor: themes[theme].borderColor,
					backgroundColor: themes[theme].messageboxBackground,
					overflow: 'hidden'
				},
				animatedStyles
			]}
			testID='messagebox-keyboard-emoji'
		>
			<View style={{ height: 1, backgroundColor: '#dddddd' }} />
			<View style={styles.attachmentContainer}>{contentList.map(item => renderItem(item))}</View>
		</Animated.View>
	);
};

export default AttachmentKeyboard;
