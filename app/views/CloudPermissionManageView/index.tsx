import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';

import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { debounce } from '../../lib/methods';
import { Services } from '../../lib/services';
import { AllSelectedIcon, EditeIcon, SeletedIcon, UnSeletedIcon } from './SvgIcon';
import styles from './styles';
import { DrawerMenu } from '../../containers/DrawerMenu';
import * as List from '../../containers/List';
import { showToast } from '../../lib/methods/helpers/showToast';
import { FormTextInput } from '../../containers/TextInput';
import * as HeaderButton from '../../containers/HeaderButton';
import Navigation from '../../lib/navigation/appNavigation';
import { ISelectedUser } from '../../reducers/selectedUsers';

export interface CloudPermissionEditItemData {
	code: number;
	desc: string;
	description: string;
	name: string;
}
export interface CloudUserPermissionEditData {
	userId: string;
	fileId: string;
	permissionType: number;
	createTime: string;
	updateTime: string;
	creatorId: string;
	creatorName: string;
}
export interface CloudPermissionItemData {
	isSelected: boolean;
	name: string;
	owner: boolean;
	creatorName: string;
	avatarUrl: string;
	userId: string;
	distinguishedNames: string;
	permissionTypeData: CloudPermissionEditItemData;
	userEditPermission: CloudUserPermissionEditData;
}

const CloudPermissionManageView = props => {
	const navigation = useNavigation();

	const { fileId } = props.route.params;

	const [dataList, setDataList] = useState<CloudPermissionItemData[]>([]);
	const [selectedNum, setSelectedNum] = useState(0);
	const [isEditViewShow, setIsEditViewShow] = useState(false);
	const [editListData, setEditListData] = useState<CloudPermissionEditItemData[]>([]);
	const [userIds, setUserIds] = useState<string[]>([]);
	const [originalData, setOriginalData] = useState<CloudPermissionItemData[]>([]);
	const [searchText, setSearchText] = useState('');

	useLayoutEffect(() => {
		// eslint-disable-next-line no-undef
		navigation.setOptions({
			title: I18n.t('Cloud_Doc_Permission_Manage_Title'),
			headerTitleAlign: 'center',
			headerRight: () => (
				<Touchable
					onPress={() => {
						const existUsers: ISelectedUser[] = [];
						console.info(dataList);
						dataList?.forEach(item => {
							existUsers.push({
								_id: item.userId,
								name: item.name,
								userId: item.userId
							});
						});
						Navigation.navigate('CloudUsersSelectedView', {
							groupUsers: existUsers,
							title: I18n.t('Forward_to'),
							buttonText: I18n.t('Confirm'),
							hasRoom: true,
							nextAction: async (navigation: any, userIds: string[], permissionType: number) => {
								navigation?.pop();
								console.info(userIds);
								const res = await Services.permissionChange(fileId, permissionType, userIds);
								if (res) {
									showToast('添加成功');
									loadData();
								}
							}
						});
					}}
					style={{ paddingRight: 15 }}
				>
					<Text>添加</Text>
				</Touchable>
			),
			headerLeft: () => (
				<HeaderButton.BackButton
					onPress={() => {
						navigation.pop();
					}}
				/>
			)
		});
	}, [navigation, dataList]);

	useEffect(() => {
		setSelectedNum(0);
		loadData();
		loadPermissionData();
	}, []);

	const loadPermissionData = async () => {
		const res = await Services.getPermissionTypeList();
		console.info(res, 'res');
		const { data } = res;
		setEditListData(data);
	};

	const loadData = async () => {
		const res = await Services.getCollaborator(fileId);
		console.info('data === ', res);
		const { data } = res;
		if (data.length > 0) {
			setDataList(data);
			setOriginalData(data);
		}
	};

	const uploadPermissionChange = async (permissionType: number) => {
		const res = await Services.permissionChange(fileId, permissionType, userIds);
		console.info(res);
		if (res) {
			showToast('修改成功');
			loadData();
		}
	};

	const renderSearchBar = () => (
		<FormTextInput
			autoCapitalize='none'
			autoCorrect={false}
			blurOnSubmit
			placeholder={I18n.t('Cloud_Doc_Permission_Search_PlaceHolder')}
			returnKeyType='search'
			underlineColorAndroid='transparent'
			containerStyle={{ margin: 16, marginBottom: 16 }}
			onChangeText={text => internalOnChangeText(text)}
			value={searchText}
			onClearInput={() => internalOnChangeText('')}
			iconRight={'search'}
		/>
	);

	const internalOnChangeText = useCallback(
		value => {
			setSearchText(value);
			onSearchChangeText?.(value);
		},
		[originalData]
	);

	// eslint-disable-next-line require-await
	const onSearchChangeText = debounce(async (text: string) => {
		const title = text.trim();
		const pattern = new RegExp(title, 'i');
		const result = [] as CloudPermissionItemData[];
		originalData.forEach(member => {
			if (pattern.test(member.name) || pattern.test(member.distinguishedNames)) {
				result.push(member);
			}
		});
		setDataList([...result]);
	}, 1000);

	const selectAll = () => {
		const p_list = dataList;
		for (let i = 0; i < p_list.length; i++) {
			if (!p_list[i].owner) {
				p_list[i].isSelected = true;
			}
		}
		console.info('data = ', p_list);
		setDataList([...p_list]);
		setSelectedNum(p_list.length - 1);
	};

	const bottomBar = () => (
		<View style={styles.bottomBar}>
			<View style={styles.bottomBarContainer}>
				<TouchableOpacity style={{ alignItems: 'center', flexDirection: 'row', height: 73 }} onPress={() => selectAll()}>
					{selectedNum === dataList.length - 1 ? <SeletedIcon /> : <UnSeletedIcon />}
					<Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '400', color: '#333' }}>全选</Text>
				</TouchableOpacity>
				<View style={{ flex: 1 }} />
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<Text style={{ color: '#4580FF', fontSize: 15, fontWeight: '400' }}>已选{selectedNum}人</Text>
					<AllSelectedIcon />
					<TouchableOpacity
						style={styles.changePermisson}
						onPress={() => {
							if (selectedNum > 0) {
								const ids: string[] = [];
								for (let i = 0; i < dataList.length; i++) {
									if (dataList[i].isSelected && !dataList[i].owner) {
										ids.push(dataList[i].userId);
									}
								}
								setUserIds([...ids]);
								setIsEditViewShow(true);
							}
						}}
					>
						<Text style={{ fontSize: 16, fontWeight: '400', color: '#FFF' }}>{I18n.t('Cloud_Doc_Change_Permission')}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);

	const editListItem = (item: CloudPermissionEditItemData) => (
		<TouchableOpacity
			onPress={() => {
				setIsEditViewShow(false);
				uploadPermissionChange(item.code);
			}}
		>
			<View style={{ paddingHorizontal: 12, paddingVertical: 16, flexDirection: 'column', width: '100%' }}>
				<Text style={{ fontSize: 18, fontWeight: '400', color: '#333' }}>{item.name}</Text>
				<Text style={{ fontSize: 14, fontWeight: '400', color: '#999' }}>{item.description}</Text>
			</View>
		</TouchableOpacity>
	);

	const editListFooterView = () => (
		<View style={{ flexDirection: 'column', width: '100%' }}>
			<View style={{ height: 8, width: '100%', backgroundColor: '#F5F5F5' }} />
			<TouchableOpacity
				onPress={() => {
					setIsEditViewShow(false);
				}}
			>
				<View style={{ width: '100%', height: 57, alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ fontSize: 18, fontWeight: '400', color: '#333' }}>取消</Text>
				</View>
			</TouchableOpacity>
		</View>
	);

	const editView = () => (
		<DrawerMenu
			visible={isEditViewShow}
			hideModal={() => {
				setIsEditViewShow(false);
			}}
			menuPosition='bottom'
			Height={editListData.length * 79 + 65}
			children={
				<FlatList
					data={editListData}
					renderItem={({ item }) => editListItem(item)}
					ListFooterComponent={editListFooterView}
					ItemSeparatorComponent={List.Separator}
				/>
			}
		/>
	);

	const renderListItemLeftClick = (item: CloudPermissionItemData) => {
		if (!item.owner) {
			item.isSelected = !item.isSelected;
			let num = 0;
			for (const dataListElement of dataList) {
				if (dataListElement.isSelected && !dataListElement.owner) num++;
			}
			setDataList([...dataList]);
			setSelectedNum(num);
		}
	};
	const renderListItemRightClick = (item: CloudPermissionItemData) => {
		console.info('右侧点击', item);
		if (!item.owner) {
			setUserIds([item.userId]);
			setIsEditViewShow(true);
		}
	};

	const renderItem = (item: CloudPermissionItemData) => (
		<View style={styles.renderListItem}>
			<TouchableOpacity onPress={() => renderListItemLeftClick(item)}>
				{item.isSelected || item.owner ? <SeletedIcon color={item.owner ? 'white' : '#1B5BFF'} /> : <UnSeletedIcon />}
			</TouchableOpacity>

			<FastImage style={styles.image} source={{ uri: item.avatarUrl ? item.avatarUrl : '' }} />
			<View style={styles.renderListItemContainer}>
				<View style={{ flexDirection: 'column', flex: 1 }}>
					<Text style={{ fontSize: 16, fontWeight: '400', color: '#333' }}>{item.name}</Text>
					<Text style={{ fontSize: 12, fontWeight: '400', color: '#000', opacity: 0.4 }}>
						由 {item.userEditPermission.creatorName} 添加
					</Text>
				</View>
				<TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => renderListItemRightClick(item)}>
					<Text style={{ fontSize: 16, fontWeight: '400', color: item.owner ? '#999' : '#333' }}>
						{item.owner ? '所有者' : item.permissionTypeData.name}
					</Text>
					<EditeIcon isEmpty={item.owner} />
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<SafeAreaView
			testID='cloud-doc-view'
			style={{ backgroundColor: '#FFF', flexDirection: 'column', justifyContent: 'space-between' }}
		>
			<StatusBar />
			{renderSearchBar()}
			<FlatList
				data={dataList}
				renderItem={({ item }) => renderItem(item)}
				style={{
					flex: 1
				}}
			/>
			{bottomBar()}
			{editView()}
		</SafeAreaView>
	);
};

export default CloudPermissionManageView;
