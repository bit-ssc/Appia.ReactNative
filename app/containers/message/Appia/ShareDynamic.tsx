import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { IMessageInner } from '../interfaces';
import { openWebview } from '../../../utils/openLink';
import Navigation from '../../../lib/navigation/appNavigation';
import { maxMessageWidth } from './helper';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 4,
		padding: 10
	},
	cover: {
		width: 50,
		height: 50
	},
	content: {
		paddingLeft: 10
	},
	title: {
		fontSize: 14,
		color: '#000',
		lineHeight: 18,
		marginBottom: 3,
		width: maxMessageWidth - 110
	},
	description: {
		lineHeight: 17,
		color: '#7C7D7F',
		fontSize: 12
	}
});

interface IMediaCard {
	cover: string;
	title: string;
	description: string;
	type: number;
	value: unknown;
}

const ShareDynamic = React.memo(({ msgData }: IMessageInner) => {
	const media = useMemo(() => {
		try {
			return JSON.parse((msgData as string) || '') || ({} as IMediaCard);
		} catch (e) {
			return {} as IMediaCard;
		}
	}, [msgData]);

	const onPress = useCallback(() => {
		if (media.type === 0) {
			openWebview(media.value);
		} else if (media.type === 1) {
			Navigation.navigate('DynamicDetailView', {
				dynamicId: media.value
			});
		}
	}, [media]);

	return (
		<TouchableOpacity style={styles.container} onPress={onPress}>
			<FastImage style={styles.cover} source={{ uri: media.cover }} />
			<View style={styles.content}>
				<Text style={styles.title} numberOfLines={2}>
					{media.title}
				</Text>
				<Text style={styles.description}>{media.description}</Text>
			</View>
		</TouchableOpacity>
	);
});
export default ShareDynamic;
