import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Avatar from '../../Avatar';
import styles from './styles';
import { IApplicationState } from '../../../definitions';
import { getUserSelector } from '../../../selectors/login';
import { COMPANY_NAME } from '../../../lib/constants/contacts';
import Status from '../../Status/Status';
import { CustomIcon } from '../../CustomIcon';
import I18n from '../../../i18n';
import Item from './Item';
import Navigation from '../../../lib/navigation/appNavigation';
import { toggleCompanies } from '../../../actions/company';
import UserIcon from '../../Icon/User';
import SettingIcon from '../../Icon/Setting';
import EditIcon from '../../Icon/Edit';
import QRCodeIcon from '../../Icon/QRCode';

const selector = (state: IApplicationState) => ({
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	user: getUserSelector(state),
	enterpriseName: state.settings.Enterprise_Name || COMPANY_NAME
});

const My: React.FC = () => {
	const { useRealName, user, enterpriseName } = useSelector(selector);
	const dispatch = useDispatch();
	const sidebarNavigate = useCallback(
		route => {
			dispatch(toggleCompanies(false));
			Navigation.navigate(route);
		},
		[dispatch]
	);

	return (
		<View>
			<View style={styles.headerContainer}>
				<View style={styles.avatarWrapper}>
					<TouchableOpacity
						onPress={() => {
							dispatch(toggleCompanies(false));

							Navigation.navigate('MyView');
						}}
						style={{ flexGrow: 0, flexShrink: 0 }}
					>
						<Avatar text={user.username} style={styles.avatar} size={52} />
					</TouchableOpacity>

					<Item
						text={user.statusText || I18n.t('Edit_Status')}
						left={<Status size={10} status={user?.status} />}
						right={<EditIcon />}
						onPress={() => sidebarNavigate('StatusView')}
						testID='sidebar-custom-status'
						underlayColor='#ffffff'
						style={{
							paddingHorizontal: 0,
							marginHorizontal: 16,
							flex: 1
						}}
						centerStyle={{
							flex: 0,
							marginHorizontal: 5
						}}
						textStyle={{
							color: 'rgba(0, 0, 0, 0.6)'
						}}
					/>
				</View>

				<View style={styles.usernameWrapper}>
					<TouchableOpacity
						onPress={() => {
							dispatch(toggleCompanies(false));

							Navigation.navigate('MyCardView', {
								rid: user.username
							});
						}}
						style={{ flexDirection: 'row', alignItems: 'center' }}
					>
						<Text numberOfLines={1} style={[styles.username]}>
							{useRealName ? user.name : user.username}
						</Text>
						<QRCodeIcon />
						<CustomIcon name='chevron-right' size={24} color={'rgba(0, 0, 0, 0.4)'} />
					</TouchableOpacity>
					<Text numberOfLines={1} style={[styles.companyName]}>
						{enterpriseName}
					</Text>
				</View>
			</View>

			<Item
				text={I18n.t('Profile')}
				left={
					<View style={{ marginRight: 8 }}>
						<UserIcon width={20} height={20} />
					</View>
				}
				right={<CustomIcon name='chevron-right' size={24} color={'rgba(0, 0, 0, 0.4)'} />}
				onPress={() => sidebarNavigate('ProfileStackNavigator')}
				testID='sidebar-profile'
			/>
			<Item
				text={I18n.t('Settings')}
				left={
					<View style={{ marginRight: 8 }}>
						<SettingIcon width={20} height={20} />
					</View>
				}
				right={<CustomIcon name='chevron-right' size={24} color={'rgba(0, 0, 0, 0.4)'} />}
				onPress={() => sidebarNavigate('SettingsStackNavigator')}
				testID='sidebar-settings'
			/>
		</View>
	);
};

export default My;
