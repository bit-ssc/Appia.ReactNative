import React from 'react';
import { View, Text } from 'react-native';

import styles from '../styles';

const FindNoItem = React.memo(() => (
	<>
		<View style={styles.NoItemMsg}>
			<Text style={styles.NoItemMsgText}>没有找到相关结果</Text>
		</View>
	</>
));

export default FindNoItem;
