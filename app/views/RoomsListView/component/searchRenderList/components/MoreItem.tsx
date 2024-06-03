import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';

import { DisplayMode } from '../../../../../lib/constants';
import { useTheme } from '../../../../../theme';
import { CustomIcon } from '../../../../../containers/CustomIcon';
import styles from '../styles';

const MoreItem = React.memo(({ displayMode, toOnePage }: { displayMode: any; toOnePage: any }) => {
	const { colors } = useTheme();

	return (
		<>
			<TouchableHighlight
				style={styles.MoreContainer}
				activeOpacity={0.6}
				underlayColor='#DDDDDD'
				onPress={() => {
					// 查看更多跳转到 联系人频道
					toOnePage(1);
				}}
			>
				<>
					<View style={[styles.MoreItem, displayMode === DisplayMode.Condensed && styles.containerCondensed]}>
						<Text style={styles.MoreItemText}>查看全部</Text>
					</View>
					<CustomIcon
						style={{
							justifyContent: 'center',
							flexDirection: 'row'
						}}
						name={'chevron-right'}
						size={24}
						color={colors.auxiliaryText}
					/>
				</>
			</TouchableHighlight>
		</>
	);
});

export default MoreItem;
