import React, { useEffect, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import Touchable from 'react-native-platform-touchable';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { Services } from '../../lib/services';
import styles from './styles';
import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import Check from '../../containers/Check';
import { IDepartment } from '../../reducers/selectedDepartments';
import { addDepartment, removeDepartment } from '../../actions/selectedDepartment';
import { ChatsStackParamList } from '../../stacks/types';
import { useAppSelector } from '../../lib/hooks';
import PDTAdd from '../../containers/Icon/PDTAdd';

interface IProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'FederationChooseOrgView'>;
	route: RouteProp<ChatsStackParamList, 'FederationChooseOrgView'>;
}

const root = 'root';

const FederationChooseOrgView = ({ navigation, route }: IProps): React.ReactElement => {
	const [departments, setDepartments] = useState<IDepartment[]>([]);
	const { setOptions } = useNavigation();
	const [refresh, setRefresh] = useState(false);
	const { mri } = route.params;
	const selectedDepartments = useAppSelector(state => state.selectedDepartments.departments);
	const map = new Map();
	const dispatch = useDispatch();

	useLayoutEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Select_Organization')
		});
	}, [setOptions]);

	useEffect(() => {
		getData();
	}, []);

	useEffect(() => {
		departments.forEach(item => {
			map.set(item.id, item);
		});
	}, [departments, map]);

	const getData = async () => {
		try {
			const res = await Services.getFederatedDepartments(mri);
			// @ts-ignore
			setDepartments(res.data);
		} catch (e) {
			console.info('请求权限范围的组织失败', e);
		}
	};

	const onRefresh = () => {
		setRefresh(true);
		getData();
		setRefresh(false);
	};

	const isCheck = (item: IDepartment) => selectedDepartments.findIndex(cur => item.id === cur.id) !== -1;

	const renderCheck = (item: IDepartment) => (isCheck(item) ? <Check /> : null);

	const addAllChildren = (item: IDepartment) => {
		if (!item) return;
		dispatch(addDepartment(item));
		item.children.map(cur => addAllChildren(map.get(cur)));
	};

	const removeAllParent = (item: IDepartment) => {
		if (!item) return;
		dispatch(removeDepartment(item));
		removeAllParent(map.get(item.parent));
	};

	const removeAllChildren = (item: IDepartment) => {
		if (!item) return;
		dispatch(removeDepartment(item));
		item.children.map(cur => removeAllChildren(map.get(cur)));
	};

	const remove = (item: IDepartment) => {
		removeAllParent(item);
		removeAllChildren(item);
	};

	const dealRoot = (item: IDepartment) => {
		const isSelected = isCheck(item);
		departments.forEach(department => {
			if (item.id === root) return;
			if (isSelected) {
				if (!department.isSelected) {
					dispatch(removeDepartment(department));
				}
			} else if (!department.isSelected) dispatch(addDepartment(department));
		});
		isSelected ? dispatch(removeDepartment(item)) : dispatch(addDepartment(item));
	};

	const onPress = (item: IDepartment) => {
		if (item.id === root) {
			dealRoot(item);
			return;
		}
		selectedDepartments.find(department => department.id === item.id) ? remove(item) : addAllChildren(item);
	};

	const renderItem = (item: IDepartment) => (
		<Touchable style={styles.itemContainer} onPress={() => onPress(item)} disabled={item.isSelected}>
			<>
				<View style={{ flex: 1 }}>
					<View style={{ flexDirection: 'row' }}>
						<Text style={styles.title}>{item.name}</Text>
						<Text style={styles.tag}>{`${item?.usersCountIncludeChildren}人`}</Text>
					</View>
					<Text style={styles.type}> {item.treeType}</Text>
				</View>
				<View>{item.isSelected ? <Text> {I18n.t('Already_in_the_channel')} </Text> : renderCheck(item)}</View>
			</>
		</Touchable>
	);

	const renderTip = () => (
		<View style={styles.tipContainer}>
			<Text>{I18n.t('Choose_Departments_Tips')}</Text>
		</View>
	);

	const renderEmpty = () => <></>;

	const goToCreateView = () => navigation.navigate('FederationCreateOrgView', {});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const renderAddPDT = () => (
		<Touchable onPress={goToCreateView}>
			<View style={styles.add}>
				<Text>{I18n.t('Create_PDT')}</Text>
				<PDTAdd />
			</View>
		</Touchable>
	);

	const renderContent = () => (departments.length > 0 ? departments.map(item => renderItem(item)) : renderEmpty());

	return (
		<SafeAreaView style={{ backgroundColor: '#FAFAFA' }}>
			<StatusBar />
			{renderTip()}
			<ScrollView
				refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />}
				testID='workspace-view'
				style={{ backgroundColor: '#F3F3F3' }}
			>
				<>
					{renderContent()}
					{/* {renderAddPDT()}*/}
				</>
			</ScrollView>
		</SafeAreaView>
	);
};

export default FederationChooseOrgView;
