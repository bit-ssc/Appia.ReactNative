import React from 'react';
import { I18nManager, StyleProp, StyleSheet, TextInput as RNTextInput, TextStyle, Dimensions } from 'react-native';

import { IRCTextInputProps } from './FormTextInput';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';

const { width: DimensionsWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
	input: {
		...(I18nManager.isRTL ? { textAlign: 'right' } : { textAlign: 'auto' })
	}
});

export interface IThemedTextInput extends IRCTextInputProps {
	style: StyleProp<TextStyle>;
}

export const TextInput = React.forwardRef<RNTextInput, IThemedTextInput>(({ style, ...props }, ref) => {
	const { theme } = useTheme();
	return (
		<RNTextInput
			ref={ref}
			style={[{ color: themes[theme].titleText }, style, styles.input, { minWidth: (DimensionsWidth * 2) / 3 }]}
			placeholderTextColor={themes[theme].auxiliaryText}
			keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
			{...props}
		/>
	);
});
