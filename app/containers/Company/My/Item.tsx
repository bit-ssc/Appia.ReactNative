import React from 'react';
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import styles from './styles';

interface SidebarItemProps {
	left: JSX.Element;
	right?: JSX.Element;
	text: string;
	onPress(): void;
	testID: string;
	underlayColor?: string;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	centerStyle?: StyleProp<ViewStyle>;
}

const Item = React.memo(({ left, right, text, onPress, testID, style, centerStyle, textStyle }: SidebarItemProps) => {
	const { theme } = useTheme();

	return (
		<TouchableOpacity key={testID} testID={testID} onPress={onPress} style={[styles.item, style]}>
			<View style={styles.itemHorizontal}>{left}</View>
			<View style={[styles.itemCenter, centerStyle]}>
				<Text
					style={[styles.itemText, { color: themes[theme].titleText }, textStyle]}
					numberOfLines={1}
					accessibilityLabel={text}
				>
					{text}
				</Text>
			</View>
			<View style={styles.itemHorizontal}>{right}</View>
		</TouchableOpacity>
	);
});

export default Item;
