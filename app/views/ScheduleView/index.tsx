import { RouteProp } from '@react-navigation/core';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import SafeAreaView from '../../containers/SafeAreaView';
import { ChatsStackParamList } from '../../stacks/types';
import StatusBar from '../../containers/StatusBar';
import BackgroundContainer from '../../containers/BackgroundContainer';
import I18n from '../../i18n';
import { CustomIcon } from '../../containers/CustomIcon';
import * as HeaderButton from '../../containers/HeaderButton';
import { showToast } from '../../lib/methods/helpers/showToast';
import { Services } from '../../lib/services';
import store from '../../lib/store';
import { updateSchedule } from '../../actions/schedule';
import { SubscriptionType } from '../../definitions';
import { hasPermission } from '../../lib/methods';

interface IAnnouncementProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'ScheduleView'>;
	route: RouteProp<ChatsStackParamList, 'ScheduleView'>;
}

const ScheduleView = ({ navigation, route }: IAnnouncementProps): React.ReactElement => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { room, roomValueProposition, canEdit } = route?.params;
	const { setOptions } = useNavigation();
	const [isEditing, setIsEditing] = useState(false);
	const [schedule, setSchedule] = useState(roomValueProposition);
	const [haveEditPermission, setHaveEditPermission] = useState(false);

	const submit = async () => {
		setIsEditing(false);

		try {
			const result = await Services.saveRoomSettings(room?.rid, {
				roomValueProposition: schedule
			});
			// @ts-ignore
			if (result.result) {
				store.dispatch(updateSchedule(schedule as string));
				showToast(I18n.t('Submit_Schedule_Success'));
				navigation.pop();
			} else {
				showToast(I18n.t('Submit_Schedule_Fail'));
			}
		} catch (e) {
			showToast(I18n.t('Submit_Schedule_Fail'));
			console.info(e);
		}
	};

	useEffect(() => {
		checkPermission();
	}, []);

	const checkPermission = async () => {
		const isLivechat = room.t === SubscriptionType.OMNICHANNEL;

		const { permissions } = store.getState();
		const editLivechatRoomCustomfields = permissions['edit-livechat-room-customfields'];
		const editOmnichannelContact = permissions['edit-omnichannel-contact'];
		const editRoomPermission = permissions['edit-room'];

		const permissionToEdit = isLivechat ? [editOmnichannelContact, editLivechatRoomCustomfields] : [editRoomPermission];
		const hasPerm = await hasPermission(permissionToEdit, room.rid);
		if (hasPerm.some(Boolean)) {
			setHaveEditPermission(true);
		}
	};

	useLayoutEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Schedule')
		});
	}, [setOptions]);

	const postOrEdit = () => {
		if (!isEditing) {
			setIsEditing(true);
			return;
		}
		schedule ? submit() : showToast(I18n.t('Toast_Submit_Schedule'));
	};

	useLayoutEffect(() => {
		const titleStr = isEditing ? I18n.t('Publish') : I18n.t('Edit');
		const rightTitle = !schedule && !isEditing ? '' : titleStr;
		const options = {
			headerLeft: () => <HeaderButton.BackButton onPress={() => navigation.pop()} />,
			headerRight: () =>
				haveEditPermission && canEdit ? (
					<HeaderButton.Container>
						<HeaderButton.Item title={rightTitle} onPress={postOrEdit}></HeaderButton.Item>
					</HeaderButton.Container>
				) : null
		};
		navigation.setOptions(options);
	}, [isEditing, navigation, schedule, haveEditPermission]);

	const addAnnouncement = () => {
		setIsEditing(true);
	};

	const changeSchedule = (text: string) => {
		setSchedule(text);
	};

	const renderScheduleView = () =>
		!isEditing ? (
			<View style={{ backgroundColor: 'white', margin: 10, padding: 10, flex: 1 }}>
				<Text style={[{ fontSize: 16, color: '#000' }]}>{schedule}</Text>
			</View>
		) : (
			<View style={{ backgroundColor: 'white', margin: 10, padding: 10, flex: 1 }}>
				<TextInput
					style={[{ fontSize: 16, color: '#000' }]}
					autoFocus={true}
					placeholder={I18n.t('Schedule')}
					multiline={true}
					numberOfLines={0}
					editable={isEditing}
					value={schedule}
					onChangeText={text => changeSchedule(text)}
				></TextInput>
			</View>
		);

	const renderEmptyView = () => (
		<>
			<BackgroundContainer loading={false} text={I18n.t('No_Schedule')} />
			{haveEditPermission && canEdit ? (
				<TouchableOpacity
					onPress={addAnnouncement}
					style={{
						height: 40,
						backgroundColor: '#2878FF',
						marginBottom: 40,
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'row',
						marginHorizontal: 15,
						borderRadius: 5
					}}
				>
					<CustomIcon name='add' size={16} color='white' />
					<Text style={{ color: 'white', marginLeft: 5 }}>{I18n.t('Add_Schedule')}</Text>
				</TouchableOpacity>
			) : null}
		</>
	);

	return (
		<SafeAreaView
			style={{ backgroundColor: '#FAFAFA' }}
			onTouchStart={() => {
				Keyboard.dismiss();
			}}
		>
			<StatusBar />
			{!schedule && !isEditing ? renderEmptyView() : renderScheduleView()}
		</SafeAreaView>
	);
};

export default ScheduleView;
