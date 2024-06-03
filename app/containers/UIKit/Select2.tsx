import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { CustomIcon } from '../CustomIcon';
import { textParser } from './utils';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import ActivityIndicator from '../ActivityIndicator';
import { useTheme } from '../../theme';
import { IText } from './interfaces';

const styles = StyleSheet.create({
	iosPadding: {
		height: 48,
		justifyContent: 'center'
	},
	viewContainer: {
		marginBottom: 16,
		paddingHorizontal: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 2,
		justifyContent: 'center'
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	icon: {
		right: 16
	},
	loading: {
		padding: 0
	}
});

interface Option {
	label: string;
	value: string;
}

export interface ISelect {
	options?: Option[];
	placeholder?: IText;
	onChange: Function;
	loading?: boolean;
	disabled?: boolean;
	value: unknown;
}

export const Select = ({ options = [], placeholder, onChange, loading, disabled, value: initialValue }: ISelect) => {
	const { theme } = useTheme();
	const [selected, setSelected] = useState(initialValue);
	const pickerStyle = {
		...styles.viewContainer,
		...(isIOS ? styles.iosPadding : {}),
		borderColor: themes[theme].separatorColor,
		backgroundColor: themes[theme].backgroundColor,
		borderWidth: 0,
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingLeft: 0
	};

	const Icon = () =>
		loading ? (
			<ActivityIndicator style={styles.loading} />
		) : (
			<CustomIcon size={22} name='chevron-down' style={isAndroid && styles.icon} color={themes[theme].auxiliaryText} />
		);

	return (
		<RNPickerSelect
			items={options}
			placeholder={placeholder ? { label: textParser([placeholder]), value: null } : {}}
			useNativeAndroidPickerStyle={false}
			value={selected}
			disabled={disabled}
			onValueChange={value => {
				setSelected(value);
				onChange(value);
			}}
			style={{
				viewContainer: pickerStyle,
				inputAndroidContainer: pickerStyle
			}}
			Icon={Icon}
			textInputProps={{
				// style property was Omitted in lib, but can be used normally
				// @ts-ignore
				style: { ...styles.pickerText, color: selected ? themes[theme].titleText : themes[theme].auxiliaryText }
			}}
		/>
	);
};
