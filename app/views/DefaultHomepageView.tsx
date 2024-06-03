import React, { useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import I18n from '../i18n';
import { useTheme } from '../theme';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import { DEFAULT_HOMEPAGE } from '../lib/constants';
import SafeAreaView from '../containers/SafeAreaView';
import UserPreferences from '../lib/methods/userPreferences';
import * as HeaderButton from '../containers/HeaderButton';

const DefaultHomepageView = () => {
	const navigation = useNavigation();
	const { colors } = useTheme();
	const [defaultHomepage, setDefaultHomepage] = useState(
		UserPreferences.getString(DEFAULT_HOMEPAGE) ?? 'RoomsListStackStackNavigator'
	);

	const tabs = [
		{
			label: 'Messenger',
			value: 'RoomsListStackStackNavigator',
			isSelected: false
		},
		{
			label: 'Workspace',
			value: 'WorkspaceStackNavigator',
			isSelected: false
		}
		/* 		{
			label: 'Bots',
			value: 'BotsStackNavigator',
			isSelected: false
		} */
	];

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Default_Homepage'),
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
		UserPreferences.setString(DEFAULT_HOMEPAGE, item.value);
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
						<List.Header title='Choose_default_homepage' />
						<List.Separator />
					</>
				}
				ListFooterComponent={List.Separator}
				ItemSeparatorComponent={List.Separator}
			/>
		</SafeAreaView>
	);
};

export default DefaultHomepageView;
