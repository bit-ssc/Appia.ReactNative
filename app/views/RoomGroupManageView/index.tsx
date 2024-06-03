import React, { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Touchable from 'react-native-platform-touchable';
// import { useSelector } from 'react-redux';

import { CustomIcon } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { ChatsStackParamList } from '../../stacks/types';
import styles from './styles';
import I18n from '../../i18n';
// import { IApplicationState } from '../../definitions';
// import { ISwitch } from '../CreateChannelView';
// import { SWITCH_TRACK_COLOR, SWITCH_TRACK_COLOR_DISABLED } from '../../lib/constants';
// import { useTheme } from '../../theme';
// import { Services } from '../../lib/services';
// import { showToast } from '../../lib/methods/helpers/showToast';
// import { hasPermission } from '../../lib/methods';
// import database from '../../lib/database';
// import { SUBSCRIPTIONS_TABLE } from '../../lib/database/model';

export const SET_OWNER_MODE = 2;
export const SET_MODERATOR_MODE = 3;
export const SET_PDT_MODE = 4;

interface IOnPressTouch {
	<T extends keyof ChatsStackParamList>(item: { route?: T; params?: ChatsStackParamList[T]; event?: Function }): void;
}

const RoomGroupManageView: React.FC = (props: any) => {
	// const { colors } = useTheme();
	const { route } = props;
	const { room, rid } = route.params;
	// const [readonly, setReadonly] = useState(false);
	// const setReadonlyPermission = useSelector((state: IApplicationState) => state.permissions['set-readonly']);
	// const [canSetReadonly, setCanSetReadonly] = useState(false);
	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'RoomGroupManageView'>>();
	// const userName = useSelector((state: IApplicationState) => state.login.user.username) as unknown as string;
	// const accessMembersP = useSelector((state: IApplicationState) => state.settings.Appia_Create_External_Discussion_Members) || '';
	// const accessMembersC = useSelector((state: IApplicationState) => state.settings.Appia_Create_External_Channel_Members) || '';
	// const accessedCreateFederation =
	// 	(accessMembersP as unknown as string)?.includes(userName) || (accessMembersC as unknown as string).includes(userName);

	const onPressTouchable: IOnPressTouch = (item: {
		route?: keyof ChatsStackParamList;
		params?: ChatsStackParamList[keyof ChatsStackParamList];
		event?: Function;
	}) => {
		const { route, event, params } = item;

		if (route) {
			/**
			 * TODO: params can vary too much and ts is going to be happy
			 * Instead of playing with this, we should think on a better `logEvent` function
			 */
			// @ts-ignore
			const { navigation } = props;
			navigation.navigate(route, params);
		}
		if (event) {
			return event();
		}
	};

	useEffect(() => {
		navigation.setOptions({
			title: `${I18n.t(room.t === 'c' ? 'Channel' : 'Team')}管理`,
			headerLeft: () => (
				<Touchable onPress={() => navigation.goBack()} style={{ marginLeft: 12 }}>
					<CustomIcon name='chevron-left-big' size={24} color={'#6C727A'} />
				</Touchable>
			)
		});
	}, []);

	// useEffect(() => {
	// 	(async () => {
	// 		const permissions = await hasPermission([setReadonlyPermission], rid);
	// 		setCanSetReadonly(permissions[0]);
	// 	})();
	// }, []);

	// useEffect(() => {
	// 	(async () => {
	// 		const db = database.active;
	// 		const subCollections = db.get(SUBSCRIPTIONS_TABLE);
	// 		await subCollections.find(rid).then(item => {
	// 			setReadonly(item.ro);
	// 		});
	// 	})();
	// }, []);

	// const renderSwitch = ({ id, value, label, onValueChange, disabled = false, tip }: ISwitch) => (
	// 	<View style={[styles.switchContainer, { backgroundColor: colors.backgroundColor, marginHorizontal: 16, borderRadius: 8 }]}>
	// 		<View>
	// 			<Text style={[styles.label, { color: colors.titleText }]}>{I18n.t(label)}</Text>
	// 			{tip ? <Text style={[styles.tips, { color: colors.auxiliaryText }]}>{I18n.t(tip)}</Text> : null}
	// 		</View>
	// 		<Switch
	// 			value={value}
	// 			onValueChange={onValueChange}
	// 			testID={`channel-type-${id}`}
	// 			trackColor={disabled ? SWITCH_TRACK_COLOR_DISABLED : SWITCH_TRACK_COLOR}
	// 			thumbColor={disabled ? '#eee' : '#fff'}
	// 			disabled={disabled}
	// 		/>
	// 	</View>
	// );

	// const changeBroadcast = async (readonly: boolean) => {
	// 	try {
	// 		await Services.saveRoomSettings(room.rid, { readOnly: readonly });
	// 		setReadonly(readonly);
	// 	} catch (e) {
	// 		showToast('更改频道类型失败');
	// 		console.info(e);
	// 	}
	// };

	// const renderBroadcast = () => {
	// 	const tip = room.t === 'c' ? 'This_room_is_read_only_c' : 'This_room_is_read_only_p';
	// 	return renderSwitch({
	// 		id: 'broadcast',
	// 		value: readonly,
	// 		label: 'Broadcast_Channel',
	// 		tip,
	// 		onValueChange: value => {
	// 			changeBroadcast(value);
	// 		}
	// 	});
	// };

	return (
		<SafeAreaView style={{ backgroundColor: '#F2F2F2' }}>
			<StatusBar />
			<List.Section style={[styles.roomInfoContainer, { marginTop: 20 }]}>
				<TouchableOpacity
					style={styles.groupSettingContainer}
					onPress={() => {
						onPressTouchable({ route: 'RoomMembersEditView', params: { rid, room, canAddUser: true, editMode: SET_OWNER_MODE } });
					}}
				>
					<Text style={styles.itemTitle}>{I18n.t(room.t === 'c' ? 'Owner_Channel' : 'Owner')}</Text>
					<Text
						style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
						numberOfLines={1}
						ellipsizeMode={'tail'}
					></Text>
					<List.Icon name='chevron-right' style={{ marginRight: 15 }} />
				</TouchableOpacity>
				<List.Separator style={{ marginHorizontal: 15 }} />
				<TouchableOpacity
					style={styles.groupSettingContainer}
					onPress={() => {
						onPressTouchable({
							route: 'RoomMembersEditView',
							params: { rid, room, canAddUser: true, editMode: SET_MODERATOR_MODE }
						});
					}}
				>
					<Text style={styles.itemTitle}>{I18n.t(room.t === 'c' ? 'Moderator_Channel' : 'Moderator')}</Text>
					<Text
						style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
						numberOfLines={1}
						ellipsizeMode={'tail'}
					></Text>
					<List.Icon name='chevron-right' style={{ marginRight: 15 }} />
				</TouchableOpacity>

				{room.t === 'p' ? (
					<>
						<List.Separator style={{ marginHorizontal: 15 }} />
						<TouchableOpacity
							style={styles.groupSettingContainer}
							onPress={() => {
								onPressTouchable({
									route: 'RoomMembersEditView',
									params: { rid, room, canAddUser: true, editMode: SET_PDT_MODE }
								});
							}}
						>
							<Text style={styles.itemTitle}>{I18n.t('PDT_Manager')}</Text>
							<Text
								style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14 }]}
								numberOfLines={1}
								ellipsizeMode={'tail'}
							></Text>
							<List.Icon name='chevron-right' style={{ marginRight: 15 }} />
						</TouchableOpacity>
					</>
				) : null}
			</List.Section>
			{/* {canSetReadonly ? renderBroadcast() : null}*/}
		</SafeAreaView>
	);
};

export default RoomGroupManageView;
