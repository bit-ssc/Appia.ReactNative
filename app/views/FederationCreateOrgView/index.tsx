import React, { useLayoutEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { rgba } from 'color2k';

import styles from './styles';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { useAppSelector } from '../../lib/hooks';
import { reset } from '../../actions/selectedUsers';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import PDTAdd from '../../containers/Icon/PDTAdd';
import Button from '../../containers/Button';
import { showToast } from '../../lib/methods/helpers/showToast';

interface IProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'FederationCreateOrgView'>;
	route: RouteProp<ChatsStackParamList, 'FederationCreateOrgView'>;
}

const FederationCreateOrgView = ({ navigation }: IProps): React.ReactElement => {
	const [director, setDirector] = useState<ISelectedUser[]>([]);
	const user = useAppSelector(state => state.login.user);
	const [members, setMembers] = useState<ISelectedUser[]>([]);
	const selectedUser = useAppSelector(state => state.selectedUsers.users);
	const selectedUserRef = useRef<ISelectedUser[]>();
	// ref 相当于只想 redux 地址，可以避免取到上一次的值， 例如这里的 action 方法取到的是当前 redux 的值，不会是之后调用时机的值
	selectedUserRef.current = selectedUser;
	const dispatch = useDispatch();
	const ref = useRef();
	const { setOptions } = useNavigation();
	const items: (keyof typeof map)[] = ['director', 'manager', 'members'];

	useLayoutEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Create_PDT')
		});
	});

	const goToSelectedView = (title: keyof typeof map) => {
		dispatch(reset());
		navigation.navigate('SelectedUsersView', {
			lastSelected: title !== 'manager' ? map[title].members : [],
			chooseOnlyOne: title === 'director',
			nextAction: () => {
				map[title].action();
			},
			includeMe: false
		});
	};

	const map = {
		director: {
			title: I18n.t('PDT_Director'),
			action: () => {
				setDirector(selectedUserRef.current as unknown as ISelectedUser[]);
				navigation.pop();
			},
			members: director,
			hint: I18n.t('Director_Tip')
		},
		manager: {
			title: I18n.t('PDT_Manager'),
			action: () => {},
			members: [user],
			hint: I18n.t('Manager_Tip')
		},
		members: {
			title: I18n.t('PDT_Member'),
			action: () => {
				setMembers(selectedUserRef.current as unknown as ISelectedUser[]);
				navigation.pop();
			},
			members,
			hint: I18n.t('Member_Tip')
		}
	};

	const isHideIcon = (title: keyof typeof map) => title === 'manager';

	const itemHint = (title: keyof typeof map) =>
		// @ts-ignore
		map[title].members.length > 0 ? map[title].members.map(item => item.fname || item.name).join('、') : map[title].hint;

	const renderItem = (title: keyof typeof map) => (
		<View style={styles.itemContainer}>
			<Text style={styles.text}>{map[title].title}</Text>
			<Text style={[styles.contentText, { color: rgba(0, 0, 0, map[title].members.length > 0 ? 0.9 : 0.4) }]}>
				{itemHint(title)}
			</Text>
			{isHideIcon(title) ? null : (
				<Touchable style={{ marginStart: 16 }} onPress={() => goToSelectedView(title)}>
					<PDTAdd></PDTAdd>
				</Touchable>
			)}
		</View>
	);

	const renderTitle = () => (
		<View style={styles.titleContainer}>
			<Text style={styles.text}>{I18n.t('PDT_Name')}</Text>
			<TextInput ref={ref} placeholder={I18n.t('Enter_Tip')} keyboardType='default' />
		</View>
	);

	const onSave = () => {
		if (!ref.current.text) {
			showToast('');
		}
	};

	return (
		<SafeAreaView style={{ backgroundColor: '#F3F3F3' }}>
			<StatusBar />
			{renderTitle()}
			{items.map(item => renderItem(item))}
			<View style={{ flex: 1, justifyContent: 'center', marginHorizontal: 16 }}>
				<Button title={I18n.t('Save')} onPress={onSave} />
			</View>
		</SafeAreaView>
	);
};

export default FederationCreateOrgView;
