import { Image, View, StyleSheet, Text } from 'react-native';
import React from 'react';
import Touchable from 'react-native-platform-touchable';

import sharedStyles from '../Styles';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	itemContainer: {
		flexDirection: 'row',
		padding: 12,
		paddingBottom: 0,
		alignItems: 'center'
	},
	name: {
		fontSize: 18,
		...sharedStyles.textMedium,
		fontWeight: '400',
		flexShrink: 1
	},
	image: {
		width: 48,
		height: 48,
		marginEnd: 12
	},
	text: {
		flex: 1,
		fontSize: 14,
		...sharedStyles.textRegular
	},
	textContainer: {
		flex: 1,
		paddingVertical: 10,
		paddingRight: 16,
		borderBottomWidth: StyleSheet.hairlineWidth
	}
});

interface IGptItemView {
	onPress: () => void;
	name: string;
}

const GptItemView = React.memo(({ onPress, name }: IGptItemView) => {
	const { colors } = useTheme();

	return (
		<Touchable onPress={onPress}>
			<View style={styles.itemContainer}>
				<Image source={require('../../static/images/gpt.png')} style={styles.image} />
				<View style={[styles.textContainer, { borderColor: colors.separatorColor }]}>
					<Text style={[styles.name, { color: colors.titleText }]}>{name}</Text>
					<Text style={[styles.text, { color: colors.auxiliaryText }]}>{I18n.t('Gpt_Msg')}</Text>
				</View>
			</View>
		</Touchable>
	);
});

export default GptItemView;
