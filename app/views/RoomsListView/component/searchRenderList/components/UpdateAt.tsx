import React from 'react';
import { Text } from 'react-native';

import styles from '../styles';
import { useTheme } from '../../../../../theme';

const capitalize = (s: string): string => {
	if (typeof s !== 'string') {
		return '';
	}
	return s.charAt(0).toUpperCase() + s.slice(1);
};

const UpdatedAt = React.memo(({ date, hideUnreadStatus, alert }: any) => {
	const { colors } = useTheme();

	if (!date) {
		return null;
	}
	return (
		<Text
			style={[
				styles.date,
				{
					color: colors.auxiliaryText
				},
				alert &&
					!hideUnreadStatus && [
						styles.updateAlert,
						{
							color: colors.tintColor
						}
					]
			]}
			ellipsizeMode='tail'
			numberOfLines={1}
		>
			{capitalize(date)}
		</Text>
	);
});

export default UpdatedAt;
