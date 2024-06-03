import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { IJoinFederation } from '../interface';
import { TSubscriptionModel } from '../../../definitions';
import I18n from '../../../i18n';
import styles from '../styles';
import Button from '../../../containers/Button';
import * as List from '../../../containers/List';
import Avatar from '../../../containers/Avatar';
import Touch from '../../../utils/touch';
import { useTheme } from '../../../theme';
import { ChatsStackParamList } from '../../../stacks/types';
import { Services } from '../../../lib/services';
import { showToast } from '../../../lib/methods/helpers/showToast';
import log from '../../../utils/log';
import { reset } from '../../../actions/selectedUsers';

export const ApplyFederation = ({
	joinInfo,
	inviteId,
	navigation
}: {
	joinInfo: IJoinFederation;
	inviteId: string;
	navigation: StackNavigationProp<ChatsStackParamList, 'ScannerResultView'>;
}): React.ReactElement => {
	const { colors, theme } = useTheme();
	const dispatch = useDispatch();

	const [rid, setRid] = useState('');
	const {
		inviteUsername,
		attribution,
		expire,
		roomType,
		fname,
		mri,
		avatar,
		valueProposition,
		existInRoom,
		managerInfos,
		rt,
		membersCount,
		limitNumber,
		applyEnable
	} = joinInfo;

	const getRoomInfo = async () => {
		try {
			await Services.getRoomRid(mri).then(res => {
				if (res.success) {
					setRid(res.data._id);
				} else {
					showToast('获取房间信息失败');
				}
			});
		} catch (e) {
			showToast('获取房间信息失败');
		}
	};

	useEffect(() => {
		(async () => {
			await getRoomInfo();
		})();
	}, [existInRoom]);

	useEffect(() => {
		if (existInRoom && rid) {
			navigation.replace('RoomView', { rid, t: roomType });
		}
	}, [existInRoom, navigation, rid, roomType]);

	const getButtonTitle = (): string => {
		let buttonTitle = '';
		if (existInRoom) {
			buttonTitle = '您已经在工作群中';
			return buttonTitle;
		}
		buttonTitle = applyEnable ? '选择加入成员' : '您已发送请求，请稍后';
		return buttonTitle;
	};

	const renderRoles = () => (
		<Touch
			theme={theme}
			onPress={() => {
				navigation.navigate('RoomManagersView', { managerInfos, roomType });
			}}
			enabled={false}
		>
			<View style={[{ height: 40, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }]}>
				<Text style={styles.itemTitle}>{I18n.t('Members_Count')}</Text>
				<Text
					style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14, flex: 1 }]}
				>{`${membersCount}人`}</Text>
			</View>
		</Touch>
	);

	const renderRoomInfo = () => (
		<List.Section style={[styles.roomInfoContainer, { marginTop: 16 }]}>
			<View style={[styles.roomInfoView, { paddingTop: 16, paddingBottom: 16 }]}>
				<Avatar text={avatar} style={styles.avatar} size={46} type={roomType} rid={rid} />
				<Text style={[styles.roomTitle, { color: colors.titleText, maxWidth: '70%' }]} numberOfLines={1}>
					{fname}
				</Text>
				<List.Separator />
			</View>
			{renderRoles()}
		</List.Section>
	);

	const renderSchedule = () => (
		<List.Section style={[styles.roomInfoContainer, { flexDirection: 'row', paddingTop: 6, paddingBottom: 6 }]}>
			<Touch
				theme={theme}
				style={[{ flexDirection: 'row', alignSelf: 'baseline' }]}
				onPress={() =>
					navigation.navigate('ScheduleView', {
						room: { rid, t: roomType } as unknown as TSubscriptionModel,
						roomValueProposition: valueProposition
					})
				}
			>
				<View style={[{ height: 40, paddingHorizontal: 16 }]}>
					<Text style={styles.itemTitle} numberOfLines={1}>
						{I18n.t('Schedule')}
					</Text>
				</View>
				<Text
					style={[styles.itemTitle, { textAlign: 'right', color: '#666666', fontSize: 14, flex: 1 }]}
					numberOfLines={1}
					ellipsizeMode={'tail'}
				>
					{valueProposition ?? I18n.t('Empty_Schedule')}
				</Text>
				<List.Icon name='chevron-right' style={[styles.actionIndicator, { marginRight: 15 }]} />
			</Touch>
		</List.Section>
	);

	const renderExpired = () => (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
			<Image source={require('../../../static/images/unauthorized_access.png')} />
			<Text>{I18n.t('Link_Useless')}</Text>
		</View>
	);

	const joinFederation = async (navigation?: any, users?: any[]) => {
		// 加入房间的请求
		try {
			const res = await Services.applyJoinFederation(
				mri,
				managerInfos,
				fname,
				roomType,
				inviteUsername,
				attribution,
				rt,
				inviteId,
				users?.map(user => user.name) || []
			);
			// @ts-ignore
			if (res?.data?.rid) {
				navigation.replace('RoomView', { rid, t: roomType });
			} else {
				showToast('已发送加入申请，请耐心等待审批');
				navigation.pop(2);
			}
		} catch (e) {
			showToast('加入群组申请失败');
			log(e);
		}
	};

	const goToSelectMembersView = () => {
		dispatch(reset());
		navigation.navigate('SelectedUsersView', {
			fromScanQRCode: true,
			nextAction: (navigation?: any, users?: any) => joinFederation(navigation, users),
			includeMe: !existInRoom,
			addExternal: true
		});
	};

	const onPress = () => {
		goToSelectMembersView();
	};

	const renderJoinApply = () => {
		if (!expire || limitNumber === 0) {
			return renderExpired();
		}
		const disabled = !applyEnable;
		return (
			<View style={[{ width: '100%', flex: 1 }]}>
				{renderRoomInfo()}
				{roomType === 'c' ? renderSchedule() : null}
				<View style={styles.sendContainer}>
					<Button
						onPress={() => onPress()}
						title={getButtonTitle()}
						style={[styles.send, { backgroundColor: !disabled ? colors.actionTintColor : colors.passcodeDotFull }]}
						disabled={disabled}
					></Button>
				</View>
			</View>
		);
	};

	return renderJoinApply();
};
