import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Avatar from './Avatar';
import { CustomIcon, TIconsName } from './CustomIcon';
import sharedStyles from '../views/Styles';
import { isIOS } from '../lib/methods/helpers';
import { useTheme } from '../theme';
import I18n from '../i18n';
import Federation from './Icon/Federation';
import Navigation from '../lib/navigation/appNavigation';

const styles = StyleSheet.create({
	button: {
		height: 54
	},
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 15,
		marginVertical: 12
	},
	textContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginRight: 15
	},
	name: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center'
	},
	checkbox: {
		marginLeft: 15,
		alignSelf: 'center'
	}
});

interface IUserItem {
	name: string;
	username: string;
	onPress(): void;
	testID: string;
	onLongPress?: () => void;
	style?: StyleProp<ViewStyle>;
	icon?: TIconsName | null;
	iconColor?: string;
	roles?: string[];
	t?: string;
	_id?: string;
	isFederated?: boolean;
	hasCheckbox?: boolean;
	checked?: boolean;
	disabled?: boolean;
}

export const getRole = (roles: string[], t: any) => {
	if (roles && roles.length) {
		if (roles.includes('owner')) {
			return t === 'c' ? 'Owner_Channel' : 'Owner';
		}
		if (roles.includes('moderator')) {
			return t === 'c' ? 'Moderator_Channel' : 'Moderator';
		}
		if (roles.includes('admin')) {
			return 'admin';
		}
		return null;
	}
	return null;
};

export const getPDT = (roles: string[]) => {
	console.info('roles', roles);
	if (roles?.includes('pdt')) {
		return 'PDT_Manager';
	}
	return null;
};

const UserItem = ({
	name,
	username,
	onPress,
	testID,
	onLongPress,
	style,
	icon,
	iconColor,
	roles,
	t,
	isFederated,
	hasCheckbox,
	checked,
	disabled,
	_id
}: IUserItem) => {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={() => !disabled && onPress()}
			onLongPress={onLongPress}
			testID={testID}
			android_ripple={{
				color: colors.bannerBackground
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? colors.bannerBackground : 'transparent'
			})}
		>
			<View style={[styles.container, styles.button, style]}>
				{hasCheckbox && (
					<CustomIcon
						name={checked ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={24}
						style={[styles.checkbox, disabled && { opacity: 0.4 }]}
						color={checked ? colors.actionTintColor : colors.auxiliaryText}
					/>
				)}

				<Avatar
					text={username}
					size={30}
					style={styles.avatar}
					onPress={() => {
						!isFederated &&
							Navigation.navigate('RoomInfoView', {
								rid: _id,
								t: 'd'
							});
					}}
				/>
				<View style={styles.textContainer}>
					<View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
						<Text style={[styles.name, { color: colors.bodyText, marginEnd: 4 }]} numberOfLines={1}>
							{name}
						</Text>
						{isFederated ? <Federation /> : null}
					</View>
					{roles && (
						<View style={{ alignItems: 'flex-end', flexDirection: 'row' }}>
							{getRole(roles as string[], t) && (
								<Text
									style={[{ color: colors.auxiliaryText, backgroundColor: '#F5F6F9', paddingHorizontal: 2, borderRadius: 4 }]}
									numberOfLines={1}
								>
									{I18n.t(getRole(roles as string[], t) as string)}
								</Text>
							)}
							{getPDT(roles as string[]) && (
								<Text
									style={[
										{
											color: colors.auxiliaryText,
											backgroundColor: '#F5F6F9',
											paddingHorizontal: 2,
											borderRadius: 4,
											marginLeft: 4
										}
									]}
									numberOfLines={1}
								>
									{I18n.t('PDT_Manager') as string}
								</Text>
							)}
						</View>
					)}
				</View>
				{icon ? <CustomIcon name={icon} size={22} color={iconColor || colors.actionTintColor} style={styles.icon} /> : null}
			</View>
		</Pressable>
	);
};

export default UserItem;
