import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';

import { ChatsStackParamList } from '../../stacks/types';
import I18n from '../../i18n';
import styles from './styles';
import Avatar from '../../containers/Avatar';
import { CustomIcon } from '../../containers/CustomIcon';
import log from '../../utils/log';
import { Services } from '../../lib/services';
import Button from '../../containers/Button';
import { useTheme } from '../../theme';
import * as List from '../../containers/List';
import { useAppSelector } from '../../lib/hooks';
import { isAndroid, isIOS } from '../../lib/methods';

interface IProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'RoomChangeFakeNameView'>;
	route: RouteProp<ChatsStackParamList, 'RoomChangeFakeNameView'>;
}
const RoomChangeFakeNameView = ({ navigation, route }: IProps): React.ReactElement => {
	const { room } = route.params;
	const { colors } = useTheme();
	const { user } = useAppSelector(state => state.login);
	const initFakeName = route.params.fakeName;
	const [fakeName, setFakeName] = useState(initFakeName);
	const [disabled, setDisabled] = useState(true);
	const { setOptions } = useNavigation();
	const ref = useRef<TextInput>();

	useLayoutEffect(() => {
		setOptions({
			title: I18n.t('Modify_Name'),
			headerTitleAlign: 'center'
		});
	});

	useEffect(() => {
		setDisabled(!fakeName || fakeName === initFakeName);
	}, [fakeName, initFakeName]);

	const t = room.t === 'c' ? I18n.t('Channel') : I18n.t('Team');

	const handleChangeFakeName = async () => {
		try {
			if (fakeName != null) {
				await Services.postChangeFakeName(room.rid, fakeName);
				navigation.pop();
			}
		} catch (e) {
			log(e);
		}
	};

	const renderTitle = () => <Text style={styles.title}>{I18n.t('Fake_Name_Title', { t })}</Text>;

	const renderTips = () => <Text style={styles.tips}>{I18n.t('Fake_Name_Tips', { t })}</Text>;

	const renderButton = () => (
		<View style={[styles.buttonContainer, { flex: isIOS ? 1 : 0 }]}>
			<Button
				title={I18n.t('Done')}
				style={[styles.button, { backgroundColor: !disabled ? colors.actionTintColor : colors.passcodeDotFull }]}
				onPress={() => handleChangeFakeName()}
				disabled={disabled}
			/>
		</View>
	);

	const deleteName = () => {
		setFakeName('');
		ref.current?.focus();
	};

	const renderContent = () => (
		<View style={styles.contentWrap}>
			<List.Separator />
			<View style={styles.contentContainer}>
				<Avatar size={30} text={user.username} federated={room.federated ? '1' : ''} />
				<TextInput
					ref={ref}
					style={styles.textInput}
					onChangeText={(text: string) => setFakeName(text)}
					selectionColor={colors.tintColor}
				>
					{fakeName}
				</TextInput>
				<CustomIcon name={'input-clear'} color={colors.bodyText} size={20} onPress={() => deleteName()} />
			</View>
			<List.Separator />
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.wrap}>
				{renderTitle()}
				{renderTips()}
				{renderContent()}
			</View>
			{isAndroid ? (
				renderButton()
			) : (
				<KeyboardAccessoryView style={styles.buttonContainer} renderContent={() => renderButton()}></KeyboardAccessoryView>
			)}
		</View>
	);
};

export default RoomChangeFakeNameView;
