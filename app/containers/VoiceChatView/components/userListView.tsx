import { Dimensions, FlatList, View, Text } from 'react-native';
import React from 'react';

import { IVCUser } from '../../../definitions/IVChat';
import UserItem from './userItem';

const UserListView: React.FC<{ usersData: IVCUser[] }> = ({ usersData }) => {
	if (usersData.length === 0) return null;

	const screen = Dimensions.get('window');
	let numColumns = 2;

	if (usersData && usersData.length >= 3) {
		numColumns = 3;
	}

	const itemSize = (screen.width - 20 * 2) / numColumns;

	let rowNum = usersData.length / 3;
	if (usersData.length % 3 !== 0) {
		rowNum += 1;
	}

	const height = (rowNum > 3 ? 3.5 : rowNum) * itemSize;

	const oneUserView = () => {
		if (usersData.length === 0) return null;
		const item = usersData[0];
		return (
			<>
				<UserItem item={item} size={itemSize} isShowName={false} />

				<Text style={{ fontSize: 16, color: 'white', marginTop: 10 }}>{item.name}</Text>
			</>
		);
	};

	return (
		<View
			style={{
				width: '100%',
				height: '100%',
				alignItems: 'center',
				justifyContent: 'center'
			}}
		>
			{usersData.length > 1 ? (
				<FlatList
					key={numColumns}
					data={usersData}
					renderItem={({ item }) => <UserItem item={item} size={itemSize} isShowName={true} />}
					style={{ maxWidth: screen.width - 20, maxHeight: height, marginBottom: rowNum > 3 ? 100 : 0 }}
					horizontal={false}
					numColumns={numColumns}
					showsHorizontalScrollIndicator={false}
					showsVerticalScrollIndicator={false}
				></FlatList>
			) : (
				oneUserView()
			)}
		</View>
	);
};
export default UserListView;
