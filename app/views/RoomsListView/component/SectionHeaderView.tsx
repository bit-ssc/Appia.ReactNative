import { Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { SectionHeaderType, TSubscriptionModel } from '../../../definitions';

const SectionHeaderView: React.FC<{
	item: TSubscriptionModel;
	onPress: (item: TSubscriptionModel) => void;
}> = ({ item, onPress }) => {
	const title = item.headTitle;

	const OpenIcon = () => (
		<Svg width='12' height='8' viewBox='0 0 12 8' fill='none'>
			<Path
				d='M11.1315 0.6875H0.868974C0.561161 0.6875 0.389286 1.0125 0.579911 1.23438L5.71116 7.18437C5.85804 7.35469 6.14085 7.35469 6.28929 7.18437L11.4205 1.23438C11.6112 1.0125 11.4393 0.6875 11.1315 0.6875Z'
				fill='#86909C'
			/>
		</Svg>
	);

	const CloseIcon = () => (
		<Svg width='12' height='8' viewBox='0 0 12 8' fill='none'>
			<Path
				d='M11.1315 0.6875H0.868974C0.561161 0.6875 0.389286 1.0125 0.579911 1.23438L5.71116 7.18437C5.85804 7.35469 6.14085 7.35469 6.28929 7.18437L11.4205 1.23438C11.6112 1.0125 11.4393 0.6875 11.1315 0.6875Z'
				fill='#86909C'
				transform='rotate(270 6 4)'
			/>
		</Svg>
	);

	const showRowNum = () => {
		if (item.headerType === SectionHeaderType.TODO) {
			return (
				<View
					style={{
						backgroundColor: '#E34D59',
						height: 16,
						borderRadius: 4,
						paddingHorizontal: 6,
						justifyContent: 'center',
						alignItems: 'center',
						marginLeft: 7
					}}
				>
					<Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
						{item.rowNum && item.rowNum > 99 ? '99+' : item.rowNum}
					</Text>
				</View>
			);
		}
		return <Text style={{ marginLeft: 5, fontSize: 15, color: '#86909C' }}>({item.rowNum})</Text>;
	};

	return (
		<View style={{ width: '100%', marginTop: 10 }}>
			{item.isUnderline && <View style={{ width: '100%', height: 1, backgroundColor: '#E5E5E5' }}></View>}
			<TouchableOpacity
				style={{
					height: 38,
					width: '100%',
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					paddingHorizontal: 15,
					marginLeft: item.isSubHeader ? 10 : 0
				}}
				onPress={() => {
					item.isCanClose && onPress && onPress(item);
				}}
			>
				{item.isCanClose && (item.isHeadClose ? <CloseIcon /> : <OpenIcon />)}
				<Text style={{ marginLeft: 5, fontSize: 15, color: '#86909C' }}>{title}</Text>
				{item.showRowNum && showRowNum()}
			</TouchableOpacity>
		</View>
	);
};

export default SectionHeaderView;
