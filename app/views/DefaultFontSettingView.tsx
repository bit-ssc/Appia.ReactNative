import React, { useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import I18n from '../i18n';
import { useTheme } from '../theme';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import { DEFAULT_FONT_SETTING } from '../lib/constants';
import SafeAreaView from '../containers/SafeAreaView';
import UserPreferences from '../lib/methods/userPreferences';
import * as HeaderButton from '../containers/HeaderButton';

const DefaultFontSettingView = () => {
	const navigation = useNavigation();
	const { colors } = useTheme();
	const [defaultHomepage, setDefaultHomepage] = useState(
		UserPreferences.getString(DEFAULT_FONT_SETTING) ?? 'Default_Font_Standard'
	);

	const tabs = [
		{
			label: 'Default_Font_Standard',
			value: 'Default_Font_Standard',
			isSelected: false
		},
		{
			label: 'Follow_System_Setting',
			value: 'Follow_System_Setting',
			isSelected: false
		}
	];

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Default_Font_Setting'),
			headerLeft: () => (
				<HeaderButton.BackButton
					navigation={navigation}
					onPress={() => {
						navigation.goBack();
					}}
				></HeaderButton.BackButton>
			)
		});
	}, [navigation]);

	const onPress = (item: { value: string; label: string }) => {
		setDefaultHomepage(item.value);
		UserPreferences.setString(DEFAULT_FONT_SETTING, item.value);
		navigation.goBack();
	};

	const renderItem = ({ item }: { item: { value: string; label: string } }) => (
		<List.Item
			title={item.label}
			right={() => (defaultHomepage === item.value ? <List.Icon name='check' color={colors.tintColor} /> : null)}
			onPress={() => onPress(item)}
		></List.Item>
	);

	return (
		<SafeAreaView testID='default-browser-view'>
			<StatusBar />
			<FlatList
				data={tabs}
				keyExtractor={item => item.value}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				renderItem={renderItem}
				ListHeaderComponent={
					<>
						<List.Header title='Choose_default_font' headerStyle={{ fontSize: 14 }} />
						<List.Separator />
					</>
				}
				ListFooterComponent={
					<>
						<List.Header title='Choose_default_font_tip' headerStyle={{ fontSize: 11 }} />
					</>
				}
				ItemSeparatorComponent={List.Separator}
			/>
		</SafeAreaView>
	);
};

export default DefaultFontSettingView;
