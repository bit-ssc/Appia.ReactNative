import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import styles from './styles';
import { SWITCH_TRACK_COLOR, SWITCH_TRACK_COLOR_DISABLED } from '../../lib/constants';
import { ISwitch } from '../CreateChannelView';
import { useTheme } from '../../theme';
import { showToast } from '../../lib/methods/helpers/showToast';
import { ChatsStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import database from '../../lib/database';
import { SUBSCRIPTIONS_TABLE } from '../../lib/database/model';
import { IApplicationState } from '../../definitions';

interface IChannelTypeViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'ChannelTypeView'>;
	route: RouteProp<ChatsStackParamList, 'ChannelTypeView'>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ChannelTypeView = ({ navigation, route }: IChannelTypeViewProps): React.ReactElement => {
	const { colors } = useTheme();
	const { setOptions } = useNavigation();
	const { room } = route.params;
	const { federated, t } = room;
	const [isFederated, setFederated] = useState(federated);
	// const [isPrivate, setPrivate] = useState(rt === 'p');
	const [access, setAccess] = useState(true);
	const isChannel = t === 'c';
	const userName = useSelector((state: IApplicationState) => state.login.user.username) as unknown as string;
	const accessMembersP = useSelector((state: IApplicationState) => state.settings.Appia_Create_External_Discussion_Members);
	const accessMembersC = useSelector((state: IApplicationState) => state.settings.Appia_Create_External_Channel_Members);
	const accessedCreateFederation =
		(accessMembersP as unknown as string)?.includes(userName) || (accessMembersC as unknown as string).includes(userName);

	useLayoutEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Operation')
		});
	}, []);

	useEffect(() => {
		(async () => {
			const db = database.active;
			const collections = db.get(SUBSCRIPTIONS_TABLE);
			// eslint-disable-next-line require-await
			await collections.find(room.rid).then(item => {
				// @ts-ignore
				setAccess(item.roles.includes('owner'));
			});
		})();
	}, []);

	const renderSwitch = ({ id, value, label, onValueChange, disabled = false, tip }: ISwitch) => (
		<View style={[styles.switchContainer, { backgroundColor: colors.backgroundColor }]}>
			<View>
				<Text style={[styles.label, { color: colors.titleText }]}>{I18n.t(label)}</Text>
				{tip ? <Text style={[styles.tips, { color: colors.auxiliaryText }]}>{I18n.t(tip)}</Text> : null}
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				testID={`channel-type-${id}`}
				trackColor={disabled ? SWITCH_TRACK_COLOR_DISABLED : SWITCH_TRACK_COLOR}
				thumbColor={disabled ? '#eee' : '#fff'}
				disabled={disabled}
			/>
		</View>
	);

	const changeExternal = async (external?: boolean) => {
		try {
			const res = await Services.isContainExternalMember(room.rid);
			// @ts-ignore
			if (res.data) {
				showToast('存在外部人员， 不能更改为合作频道');
			} else {
				await Services.saveRoomSettings(room.rid, { federated: external });
				setFederated(external);
				// showToast('转换类型成功');
			}
		} catch (e) {
			console.info('转换频道类型', e);
			showToast('转换类型失败');
		}
	};

	// const changePrivate = async (isPrivate: boolean) => {
	// 	const rt = isPrivate ? 'p' : '';
	// 	try {
	// 		const res = await Services.saveRoomSettings(room.rid, { appiaRoomType: rt });
	// 		setPrivate(isPrivate);
	// 		console.info('res', res);
	// 		// showToast('转换类型成功');
	// 	} catch (e) {
	// 		console.info('转换频道类型', e);
	// 		showToast('转换类型失败');
	// 	}
	// };

	const renderExternal = () => {
		const tip = isFederated ? 'External_Channel_Tip_T' : 'External_Channel_Tip_F';
		return renderSwitch({
			id: 'external',
			value: isFederated,
			label: isChannel ? 'External_Channel' : 'External_Discussion',
			disabled: !access,
			tip,
			onValueChange: value => {
				changeExternal(value);
			}
		});
	};

	// const renderPrivate = () => {
	// 	const tip = isPrivate ? 'Private_Channel_Tip_T' : 'Private_Channel_Tip_F';
	// 	return renderSwitch({
	// 		id: 'type',
	// 		value: isPrivate,
	// 		disabled: !access,
	// 		label: 'Private_Channel',
	// 		tip,
	// 		onValueChange: value => {
	// 			changePrivate(value);
	// 		}
	// 	});
	// };

	return (
		<SafeAreaView testID='room-type-view' style={{ backgroundColor: '#F2F2F2', paddingTop: 16 }}>
			<StatusBar />
			<List.Container testID='room-type-scrollview'>
				{accessedCreateFederation ? renderExternal() : null}
				{/* {isChannel ? renderPrivate() : null} */}
			</List.Container>
		</SafeAreaView>
	);
};
