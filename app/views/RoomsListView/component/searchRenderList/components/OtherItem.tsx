import React from 'react';
import { View, Text } from 'react-native';

import { DisplayMode } from '../../../../../lib/constants';
import styles from '../styles';

const OtherItem = React.memo(({ displayMode, type }: { displayMode: any; type: string }) => (
	<>
		<View>
			<View
				style={[
					styles.typeTitleContainer,
					{
						borderTopWidth: 10
					},
					displayMode === DisplayMode.Condensed && styles.containerCondensed
				]}
			>
				<Text style={[styles.typeTitle]}>{type}</Text>
			</View>
		</View>
	</>
));

export default OtherItem;
