import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChatsStackParamList } from '../../stacks/types';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import styles from './styles';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import { Services } from '../../lib/services';
import Avatar from '../../containers/Avatar';
import { IBot } from '../RoomsListView';
import { useTheme } from '../../theme';

interface IFastModelBotInfoViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'FastModelBotInfoView'>;
	route: RouteProp<ChatsStackParamList, 'FastModelBotInfoView'>;
}

const FastModelBotInfoView = ({ navigation, route }: IFastModelBotInfoViewProps): React.ReactElement => {
	const { botName, welcomeMsg, botId, rid } = route.params;
	const [botInfo, setBotInfo] = useState<IBot>();
	const { colors } = useTheme();

	useEffect(() => {
		(async () => {
			try {
				const res = await Services.getBotInfo(botId);
				setBotInfo(res?.data);
			} catch (e) {
				console.info('获取机器人消息失败', e);
			}
		})();
	}, [botId]);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Bot_Info'),
			headerTitleAlign: 'center',
			headerLeft: () => <HeaderButton.BackButton navigation={navigation}></HeaderButton.BackButton>
		});
	});

	const renderTitle = () => (
		<View style={styles.titleContainer}>
			<Avatar borderRadius={56} text={botInfo?.robotId} type={'d'} size={56} rid={rid} />
			<View style={styles.headerRight}>
				<Text style={[styles.title, { color: colors.titleText }]}>{botName}</Text>
				<Text style={styles.content}>{`Bot Id: ${botInfo?.fastModelBotId}`}</Text>
			</View>
		</View>
	);

	const renderDescription = () => (
		<View style={[styles.titleContainer, { marginHorizontal: 12, marginTop: 12, flexDirection: 'column' }]}>
			<Text style={[styles.title, { color: colors.titleText }]}>{I18n.t('Introduction')}</Text>
			<Text style={[styles.content, { fontSize: 14 }]}>{welcomeMsg}</Text>
		</View>
	);

	const renderManager = () => (
		<View style={[styles.titleContainer, { marginHorizontal: 12, marginTop: 12, flexDirection: 'column' }]}>
			<Text style={[styles.title, { color: colors.titleText }]}>{I18n.t('Manager')}</Text>
			<Text style={[styles.content, { fontSize: 14 }]}>zander.sun@sophgo.com</Text>
			<Text style={styles.hint}>{I18n.t('Bot_Info_Tip')}</Text>
		</View>
	);

	return (
		<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: '#F5F6F9' }}>
			<StatusBar />
			{renderTitle()}
			{renderDescription()}
			{renderManager()}
		</SafeAreaView>
	);
};

export default FastModelBotInfoView;
