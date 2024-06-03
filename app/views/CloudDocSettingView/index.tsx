import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { RadioButton, RadioGroup } from 'react-native-ui-lib';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import I18n from '../../i18n';
import styles from './styles';
import { useTheme } from '../../theme';
import { ChatsStackParamList } from '../../stacks/types';
import Touch from '../../utils/touch';
import { showToast } from '../../lib/methods/helpers/showToast';

interface ISettingProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'CloudDocSettingView'>;
	route: RouteProp<ChatsStackParamList, 'CloudDocSettingView'>;
}

const safeSetting = [
	{ name: '所有可以访问文件的用户', value: 1 },
	{ name: '仅可以编辑文件的用户', value: 2 }
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CloudDocSettingView = ({ navigation, route }: ISettingProps): React.ReactElement => {
	const { theme } = useTheme();
	const [value, setValue] = useState<number>(0);

	useEffect(() => {
		navigation.setOptions({
			title: '安全设置',
			headerTitleAlign: 'center'
		});
	}, []);

	useEffect(() => {
		(async () => {
			// 	todo 初始化权限
		})();
	}, []);

	const renderDes = () => <Text style={styles.des}>{I18n.t('Cloud_Doc_Setting_Des')}</Text>;

	const renderContent = () => (
		<List.Container style={styles.settingContainer}>
			<RadioGroup>{safeSetting.map(item => renderRadioButtonItem(item))}</RadioGroup>
		</List.Container>
	);

	const radioOnPress = (item: { name: string; value: number }) => {
		if (item.value === value) return;
		setValue(item.value);
		try {
			// 	todo 设置权限
		} catch (e) {
			console.info('权限设置失败', e);
			showToast('权限设置失败');
		}
	};

	const renderRadioButtonItem = (item: { name: string; value: number }) => {
		const selected = item.value === value;
		return (
			<Touch
				theme={theme}
				style={styles.touch}
				onPress={() => {
					radioOnPress(item);
				}}
			>
				<RadioButton
					label={item.name}
					value={item.value}
					labelStyle={styles.text}
					color={selected ? '#1B5BFF' : '#CCC'}
					selected={selected}
				/>
			</Touch>
		);
	};

	return (
		<SafeAreaView style={{ backgroundColor: '#F2F2F2' }}>
			<StatusBar />
			<List.Container style={[{ paddingVertical: 16 }]}>
				{renderDes()}
				{renderContent()}
			</List.Container>
		</SafeAreaView>
	);
};

export default CloudDocSettingView;
