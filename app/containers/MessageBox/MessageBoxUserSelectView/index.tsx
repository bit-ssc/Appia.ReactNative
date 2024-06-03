import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, Pressable, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import Touchable from 'react-native-platform-touchable';

import { themes } from '../../../lib/constants';
import * as List from '../../List';
import SafeAreaView from '../../SafeAreaView';
import { IApplicationState } from '../../../definitions';
import UserItem, { styles } from '../../Organization/UserItem';
import { getUserSelector } from '../../../selectors/login';
import log from '../../../utils/log';
import { isIOS } from '../../../utils/deviceInfo';
import sharedStyles from '../../../views/Styles';
import { Services } from '../../../lib/services';
import Avatar from '../../Avatar';
import { CloseMentions } from '../MessageBoxSvg';
import I18n from '../../../i18n';
import AllIcon from '../../Avatar/all';

interface IMember {
	_id: string;
	name: string;
	username: string;
	roles: string[];
	status: string; // offline/online
	_updatedAt: string;
}

interface SelectedUser extends IMember {
	isSelected: boolean;
}

const MessageBoxUserSelectView = props => {
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const [search, setSearch] = useState<SelectedUser[]>([]);
	const [chats, setChats] = useState<SelectedUser[]>([]);
	const [searchText, setSearchText] = useState('');
	const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
	const [isSingleChoose, setIsSingleChoose] = useState(true);
	const theme = 'light';
	const { rid, onCancel, onSubmit } = props;

	const textInputRef = useRef<TextInput>(null);
	const flatlist = useRef<FlatList>(null);

	useEffect(() => {
		init();
	}, []);

	// eslint-disable-next-line react/sort-comp
	const init = async () => {
		try {
			const result = await Services.getFederatedRoomMembers(rid);
			const users = [] as unknown as SelectedUser[];
			if (result.success) {
				result.data.forEach(item => {
					// @ts-ignore
					users.push(...item.members);
				});
			}
			const newUsers = users.filter(item => item.username !== '' && item.username !== user.username);
			setChats(newUsers);
		} catch (e) {
			log(e);
		}
	};

	const onSearchChangeText = (text: string) => {
		setSearchText(text);
		handleSearch(text);
	};

	const handleSearch = (text: string) => {
		const pattern = new RegExp(text, 'i');
		const result = [] as SelectedUser[];
		chats?.forEach(member => {
			if (pattern.test(member.username) || pattern.test(member.name ?? '')) {
				result.push(member);
			}
		});
		setSearch(result);
	};

	const toggleUser = (user: SelectedUser) => {
		user.isSelected = !user.isSelected;
		const seletedUsers = chats.filter(item => item.isSelected);
		setSelectedUsers(seletedUsers);
	};

	const _onPressItem = (id: string, item = {} as SelectedUser) => {
		const user = chats.find(user => user.username === item.username);
		if (user) {
			if (isSingleChoose) {
				if (onSubmit) {
					onSubmit([user]);
				}
			} else {
				if (selectedUsers?.find(user => user.username === item.username)) {
					user.isSelected = false;
				} else {
					user.isSelected = true;
				}
				const selecteUsers = chats.filter(item => item.isSelected);
				setSelectedUsers(selecteUsers);

				if (searchText) {
					textInputRef.current?.clear();
					onSearchChangeText('');
				}
			}
		}
	};

	const _onPressSelectedItem = (item: SelectedUser) => toggleUser(item);

	const renderHeader = () => (
		<View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 15, height: 50 }}>
			<Touchable
				style={{ height: 30, width: 30, alignContent: 'center', justifyContent: 'center' }}
				onPress={() => {
					if (isSingleChoose && onCancel) {
						onCancel();
					} else {
						setIsSingleChoose(true);
					}
				}}
			>
				{isSingleChoose ? <CloseMentions /> : <Text>{I18n.t('Cloud_Doc_Bottom_Cancel')}</Text>}
			</Touchable>
			<View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
				<Text style={{ fontSize: 17 }}>{I18n.t('Choose_People')}</Text>
			</View>
			<Touchable
				style={{ height: 30, width: 30, alignContent: 'center', justifyContent: 'center' }}
				onPress={() => {
					if (isSingleChoose) {
						setIsSingleChoose(false);
					} else if (selectedUsers.length > 0 && onSubmit) {
						onSubmit(selectedUsers);
					}
				}}
			>
				{isSingleChoose ? <Text>{I18n.t('Multi_Select')}</Text> : <Text>{I18n.t('Done')}</Text>}
			</Touchable>
		</View>
	);

	const renderSearchHeader = () => (
		<View style={{ backgroundColor: themes[theme].backgroundColor, flexDirection: 'row', borderRadius: 8, minHeight: 40 }}>
			{renderSelected()}
			<TextInput
				onChangeText={(text: string) => {
					onSearchChangeText(text);
				}}
				keyboardType='default'
				style={{ minWidth: 100, flex: 1, marginStart: selectedUsers.length === 0 ? 16 : 5 }}
				placeholder={'搜索'}
				ref={textInputRef}
			/>
		</View>
	);

	const onContentSizeChange = () => flatlist.current?.scrollToEnd({ animated: true });

	const renderSelected = () => {
		if (selectedUsers.length === 0) {
			return null;
		}
		return (
			<View style={sharedStyles.footerBox}>
				<FlatList
					data={selectedUsers}
					ref={flatlist}
					onContentSizeChange={onContentSizeChange}
					style={{ borderColor: themes[theme].separatorColor, flex: 0 }}
					contentContainerStyle={{ marginTop: 5, marginBottom: 10, height: 55, marginLeft: 20, paddingRight: 10, flex: 0 }}
					renderItem={renderSelectedItem}
					keyboardShouldPersistTaps='always'
					horizontal
					bounces={false}
				/>
			</View>
		);
	};

	const renderSelectedItem = ({ item }: { item: SelectedUser; index: number }) => (
		<Pressable
			onPress={() => _onPressSelectedItem(item)}
			testID={`selected-user-${item.name}`}
			android_ripple={{
				color: themes[theme].bannerBackground
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
			})}
		>
			<View style={{ paddingRight: 15 }}>
				<Avatar text={item.username} rid={rid} type={'d'} size={36} style={{ marginVertical: 12 }} />
			</View>
		</Pressable>
	);

	const renderItem = ({ item, index }: { item: SelectedUser; index: number }) => {
		let style = { borderColor: themes[theme].separatorColor };
		if (index === 0) {
			// style = { ...style, ...sharedStyles.separatorTop };
			style = { ...style };
		}
		if (search.length > 0 && index === search.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (search.length === 0 && index === chats.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}

		return (
			<UserItem
				id={item._id}
				name={item.name}
				username={item.username}
				rid={rid}
				type={'d'}
				avatar={item.username}
				avatarSize={40}
				onPress={() => _onPressItem(item._id, item)}
				testID={`select-users-view-item-${item.name}`}
				checked={selectedUsers?.find(user => user.username === item.username) !== undefined}
				hasCheckbox={!isSingleChoose}
				disabled={false}
				style={style}
				theme={theme}
			/>
		);
	};

	const renderChooseAll = (value: string) => (
		<Pressable
			onPress={() => {
				if (onSubmit) onSubmit([{ name: 'all' }]);
			}}
			android_ripple={{
				color: themes[theme].bannerBackground
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : '#fff'
			})}
		>
			<View style={[styles.container, { borderColor: themes[theme].separatorColor, borderBottomWidth: 1 }]}>
				<View
					style={[
						styles.textContainer,
						{
							marginHorizontal: 15,
							marginVertical: 15,
							display: 'flex',
							flexDirection: 'row',
							justifyContent: 'flex-start',
							alignContent: 'center'
						}
					]}
				>
					<View style={[{ backgroundColor: 'rgb(96, 125, 139) ', width: 40, height: 40, borderRadius: 20 }]}>
						<AllIcon />
					</View>

					<View style={[{ justifyContent: 'center', alignContent: 'flex-start' }]}>
						<Text
							style={[styles.name, { color: themes[theme].titleText, textAlign: 'center', marginLeft: 14 }]}
							numberOfLines={1}
						>
							{value}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);

	const renderListView = () => {
		const searchOrChats = (searchText ? search : chats) as SelectedUser[];

		// console.log(searchText, searchOrChats, search, chats, "searchsearchsearchsearch");
		return (
			<>
				{searchText ? null : renderChooseAll('all')}
				<FlatList
					data={searchOrChats}
					keyExtractor={item => item._id}
					renderItem={renderItem}
					ItemSeparatorComponent={List.Separator}
					contentContainerStyle={{ backgroundColor: 'white' }}
					keyboardShouldPersistTaps='always'
					bounces={false}
				/>
			</>
		);
	};

	return (
		<SafeAreaView testID='select-users-view' style={{ borderTopRightRadius: 10, borderTopLeftRadius: 10, marginTop: 200 }}>
			{renderHeader()}
			<View style={{ padding: 5, backgroundColor: '#f3f4f5' }}>{renderSearchHeader()}</View>
			{renderListView()}
		</SafeAreaView>
	);
};

export default MessageBoxUserSelectView;
