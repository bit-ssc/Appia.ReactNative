import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlatList, Text, View } from 'react-native';

import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import StatusBar from '../../containers/StatusBar';
import { getAreaCode, IAreaCode } from '../../lib/services/common';
import { BackButton } from '../../containers/HeaderButton';
import I18n from '../../i18n';

let cache: IAreaCode[] = [];
const useAreaCodes = (server: string) => {
	const [areaCodes, setAreaCodes] = useState<IAreaCode[]>(
		cache.length
			? cache
			: [
					{
						label: I18n.t('China'),
						areaCode: '+86',
						code: 'CN'
					}
			  ]
	);

	useEffect(() => {
		if (!cache.length) {
			getAreaCode(server).then(res => {
				if (res.length) {
					setAreaCodes(res);
					cache = res;
				}
			});
		}
		// eslint-disable-next-line
	}, []);

	return areaCodes;
};

const CountryView: React.FC = () => {
	const { goBack, setOptions: setHeader } = useNavigation();
	const { params } = useRoute();
	const { server, onChange } = params as { server: string; onChange: (option: IAreaCode) => {} };
	const { theme } = useTheme();
	const options = useAreaCodes(server);

	useEffect(() => {
		setHeader({
			headerTitleAlign: 'center',
			headerLeft: () => <BackButton onPress={goBack} />,
			title: I18n.t('Select_Country_And_Region')
		});
		// eslint-disable-next-line
	}, []);

	const renderItem = useCallback(
		({ item }: { item: IAreaCode }) => (
			<View key={`${item.areaCode}.${item.code}`}>
				<List.Item
					title={item.label}
					onPress={onClose(item)}
					right={() => <Text style={{ fontSize: 16, color: themes[theme].auxiliaryText }}>{item.areaCode}</Text>}
					translateTitle={false}
				/>
				<List.Separator />
			</View>
			// eslint-disable-next-line
		),
		[theme]
	);

	const keyExtractor = useCallback((option: IAreaCode) => `${option.areaCode}.${option.code}`, []);

	const onClose = (option: IAreaCode) => () => {
		onChange && onChange(option);
		goBack();
	};

	return (
		<SafeAreaView testID='country-view'>
			<StatusBar />
			<List.Container>
				<FlatList
					data={options}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					keyboardShouldPersistTaps='always'
					initialNumToRender={12}
					windowSize={9}
					onEndReachedThreshold={0.5}
				/>
			</List.Container>
		</SafeAreaView>
	);
};

export default CountryView;
