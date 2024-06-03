import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';

const styles = StyleSheet.create({
	radioGroup: {
		flexDirection: 'row'
	},
	radioItem: {
		flex: 1,
		flexDirection: 'row',
		alignContent: 'center',
		alignItems: 'center',
		justifyContent: 'center'
	},
	radio: {
		width: 18,
		height: 18,
		marginRight: 5,
		borderRadius: 9
	}
});

export interface IOption<T> {
	label: string;
	value: T;
}

export interface IProps<T> {
	options: IOption<T>[];
	initValue: T;
	onChange: (value: T) => void;
}

const RadioGroup = <T extends number | string>({ options, initValue, onChange }: IProps<T>): React.ReactElement => {
	const [state, setState] = useState(initValue);
	const { theme } = useTheme();

	return (
		<View style={styles.radioGroup}>
			{options.map(({ value, label }) => (
				<Touchable
					onPress={() => {
						setState(value);
						onChange && onChange(value);
					}}
					key={value}
					style={styles.radioItem}
				>
					<>
						<View
							style={[
								styles.radio,
								state === value
									? {
											borderColor: themes[theme].actionTintColor,
											borderWidth: 5
									  }
									: {
											borderColor: themes[theme].auxiliaryTintColor,
											borderWidth: 1
									  }
							]}
						/>

						<Text
							style={[
								state === value
									? {
											borderColor: themes[theme].actionTintColor
									  }
									: {
											color: themes[theme].auxiliaryTintColor
									  }
							]}
						>
							{label}
						</Text>
					</>
				</Touchable>
			))}
		</View>
	);
};

export default RadioGroup;
