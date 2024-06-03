import { Dimensions, FlatList, View, Text } from 'react-native';
import React from 'react';

import { IVCUser, IVChatCallMsg } from '../../../definitions/IVChat';
import Avatar from '../../Avatar';
import UserItem from './userItem';

const UnAcceptCenterView: React.FC<{ callMsg: IVChatCallMsg; usersData: IVCUser[] }> = ({ callMsg, usersData }) => {
	if (!callMsg || usersData.length === 0) return null;

	const screen = Dimensions.get('window');
	const p_userData = usersData.filter(user => user.username !== callMsg.recordData?.initiator);

	let headerSize = 146;
	if (p_userData.length === 0) {
		headerSize = (screen.width - 20 * 2) / 2;
	}

	let numColumns = p_userData.length;
	if (numColumns > 8) {
		numColumns = 8;
	}
	const itemSize = (screen.width - 20 * 2) / 8;
	let rowNum = p_userData.length / 8 + 1;
	if (rowNum > 4) {
		rowNum = 4;
	}
	const flatHeight = 4 * (itemSize + 10);

	const p_userData2 = usersData.filter(user => user.username === callMsg.recordData?.initiator);
	if (p_userData2.length === 0) return null;

	const user = p_userData2[0];

	const renderItem = (item: IVCUser) => <Avatar text={item.username} borderRadius={5} size={itemSize} style={{ margin: 5 }} />;

	const otherUserList = () => (
		<>
			<Text style={{ fontSize: 12, color: 'white', marginTop: 20 }}>参与通话的还有：</Text>

			<FlatList
				key={numColumns}
				data={p_userData}
				renderItem={item => renderItem(item.item)}
				style={{ maxWidth: screen.width - 20, maxHeight: flatHeight, marginTop: 10 }}
				horizontal={false}
				numColumns={numColumns}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
			></FlatList>
		</>
	);

	return (
		<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
			<UserItem item={user} size={headerSize} isShowName={false} />

			<Text style={{ fontSize: 16, color: 'white', marginTop: 10 }}>{user.name}</Text>

			{p_userData.length > 0 && otherUserList()}
		</View>
	);
};

export default UnAcceptCenterView;
