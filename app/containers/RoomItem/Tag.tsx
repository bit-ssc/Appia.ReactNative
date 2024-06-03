import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import styles from './styles';

interface ITag {
	name: string;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}

const Tag = React.memo(({ name, testID, style }: ITag) => {
	const { theme } = useTheme();

	return (
		<View style={[styles.tagContainer, { backgroundColor: themes[theme].borderColor }, style]}>
			<Text style={[styles.tagText, { color: themes[theme].infoText }]} numberOfLines={1} testID={testID}>
				{name}
			</Text>
		</View>
	);
});

export default Tag;
