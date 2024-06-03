import React from 'react';
import { Text } from 'react-native';

import styles from '../styles';
import { useTheme } from '../../../../../theme';

const Title = React.memo(({ name, hideUnreadStatus, alert }: any) => {
	const { colors } = useTheme();
	return (
		<Text
			style={[
				styles.title,
				alert && !hideUnreadStatus && styles.alert,
				{ color: colors.titleText, fontWeight: '400', flexShrink: 1 }
			]}
			ellipsizeMode='tail'
			numberOfLines={1}
		>
			{name}
		</Text>
	);
});

export default Title;
