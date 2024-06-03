import React, { useLayoutEffect, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { ChatsStackParamList } from '../../stacks/types';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import { DrawerMenu } from '../../containers/DrawerMenu';
import Button from '../../containers/Button';
import { useTheme } from '../../theme';
import { CustomIcon } from '../../containers/CustomIcon';
import FederationQR from "./component/FederationQR";
import TimeDrawer from "./component/TimeDrawer";

interface IShareChannelView {
	navigation: StackNavigationProp<ChatsStackParamList, 'ShareChannelView'>;
	route: RouteProp<ChatsStackParamList, 'ShareChannelView'>;
}



export const separator = '#';

export const ShareChannelView = ({ route }: IShareChannelView): React.ReactElement => {
	const { room } = route.params;

	const { setOptions } = useNavigation();
	const [isShowBottom, setShowBottom] = useState(false);
	const [expire, setExpire] = useState(-1);
	const [timeStr, setTimeStr] = useState(I18n.t('Forever_Valid'));

	useLayoutEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Add_External_Members')
		});
	}, []);

	const changeDrawer = (state: boolean) => {
		setShowBottom(state)
	}

	const handleExpire = (value: number) => {
		setExpire(value)
	}

	const handleTimeString = (label: string) => {
		setTimeStr(label)
	}


	return (
		<SafeAreaView testID='room-type-view' style={{ backgroundColor: '#F2F2F2', paddingTop: 16, paddingHorizontal: 16 }}>
			<StatusBar />
			<FederationQR room={room}  expire={expire} timeStr={timeStr} setDrawerShow={changeDrawer}/>
			<TimeDrawer
				isShowBottom={isShowBottom}
				closeDrawer={changeDrawer}
				handleExpire={handleExpire}
				handleTimeString={handleTimeString}
				expire={expire}
			/>
		</SafeAreaView>
	);
};
