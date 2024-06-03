import React, { useMemo } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';

import { IMessageInner } from '../interfaces';
import styles from './styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import { openWebview } from '../../../utils/openLink';
import { getMaxMessageWidth } from './helper';

interface ILeXiang {
	url: string;
	title: string;
	content: string;
	imageUrl: string;
}

const LeXiangMsg: React.FC<IMessageInner> = props => {
	const { msgData } = props;
	const { theme } = useTheme();
	if (!msgData) {
		return <Text>message error</Text>;
	}
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { url, title, content, imageUrl } = useMemo(() => JSON.parse(msgData as string) as ILeXiang, [msgData]);
	const directUrl = () => {
		const params = {
			needAuth: true,
			source: 'LEXIANG'
		};
		openWebview(encodeURIComponent(url), params);
	};

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor, width: getMaxMessageWidth() }]}>
			<TouchableOpacity style={[styles.lexiangBody]} onPress={directUrl}>
				{imageUrl && <FastImage source={{ uri: imageUrl }} style={styles.lexiangImage} resizeMode='stretch' />}
				{title || content ? (
					<View style={[styles.headerWrapper]}>
						<Text style={styles.lexiangTitle}>{title}</Text>
						<Text style={styles.lexiangContent}>{content}</Text>
					</View>
				) : null}
			</TouchableOpacity>
		</View>
	);
};

export default LeXiangMsg;
