import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';
import { FlatList, View, StyleSheet, Text } from 'react-native';

import { ChatsStackParamList } from '../../stacks/types';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import { getRole } from '../../containers/UserItem';
import { useTheme } from '../../theme';
import * as List from '../../containers/List';

interface IRoomManagersViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'RoomManagersView'>;
	route: RouteProp<ChatsStackParamList, 'RoomManagersView'>;
}

const styles = StyleSheet.create({
	list: {
		marginTop: 20
	},
	itemContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16
	},
	avatarContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	name: {
		fontSize: 16,
		color: 'black',
		includeFontPadding: false,
		marginLeft: 16,
		textAlignVertical: 'center',
		lineHeight: 40
	},
	avatar: {
		marginLeft: 16
	}
});

const RoomManagersView = ({ navigation, route }: IRoomManagersViewProps): React.ReactElement => {
	const { managerInfos, roomType } = route.params;
	const { setOptions } = useNavigation();
	const { colors } = useTheme();

	useLayoutEffect(() => {
		setOptions({
			headerLeft: () => <HeaderButton.BackButton onPress={() => navigation.pop()} />,
			headerTitleAlign: 'center',
			title: roomType === 'c' ? '主播及安全责任人' : '群主及管理员'
		});
	});

	// @ts-ignore
	const renderItem = ({ item }) => {
		const { name, username, roles } = item;
		return (
			<View style={styles.itemContainer}>
				<View style={styles.avatarContainer}>
					<Avatar text={username || name} size={36} style={styles.avatar} />
					<Text style={styles.name}> {name || username}</Text>
				</View>
				{item.roles && getRole(roles as string[], roomType) && (
					<Text
						style={[{ color: colors.auxiliaryText, backgroundColor: '#F5F6F9', paddingHorizontal: 2, borderRadius: 4 }]}
						numberOfLines={1}
					>
						{I18n.t(getRole(roles as string[], roomType) as string)}
					</Text>
				)}
			</View>
		);
	};

	return (
		<SafeAreaView style={{ backgroundColor: '#FAFAFA' }}>
			<StatusBar />
			<FlatList style={styles.list} data={managerInfos || []} ItemSeparatorComponent={List.Separator} renderItem={renderItem} />
		</SafeAreaView>
	);
};

export default RoomManagersView;
