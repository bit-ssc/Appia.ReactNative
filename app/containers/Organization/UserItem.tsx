import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import Avatar from '../Avatar';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { themes } from '../../lib/constants';
import { isIOS } from '../../utils/deviceInfo';
import { TSupportedThemes } from '../../theme';
import { IApplicationState } from '../../definitions';

export const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 15,
		marginVertical: 12
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		marginRight: 15
	},
	name: {
		fontSize: 17
	},
	checkbox: {
		marginLeft: 15,
		alignSelf: 'center'
	}
});

interface IUserItem {
	id: string;
	name: string;
	username: string;
	rid?: string;
	type?: string;
	avatar?: string;
	avatarSize?: number;
	onPress(): void;
	testID: string;
	style?: StyleProp<ViewStyle>;
	icon?: TIconsName | null;
	hasCheckbox?: boolean;
	checked?: boolean;
	disabled?: boolean;
	theme: TSupportedThemes;
}

const UserItem = ({
	name,
	username,
	rid,
	type,
	avatar,
	onPress,
	testID,
	style,
	hasCheckbox,
	checked,
	disabled,
	theme
}: IUserItem): React.ReactElement => {
	const user = useSelector((state: IApplicationState) => state.contacts.userMap[username]);

	// departmentNames 存在多个，但是只显示一个
	const department = user?.departmentNames ? user.departmentNames[0] : '';
	return (
		<Pressable
			onPress={() => !disabled && onPress()}
			testID={testID}
			android_ripple={{
				color: themes[theme].bannerBackground
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
			})}
		>
			<View style={[styles.container, style]}>
				{hasCheckbox && (
					<CustomIcon
						name={checked ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={24}
						style={[styles.checkbox, disabled && { opacity: 0.4 }]}
						color={checked ? themes[theme].actionTintColor : themes[theme].auxiliaryText}
					/>
				)}
				<Avatar text={avatar || username} rid={rid} type={type} size={40} style={styles.avatar} />
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: themes[theme].titleText }]} numberOfLines={1}>
						{name}
					</Text>
					{department ? <Text>{department}</Text> : null}
				</View>
			</View>
		</Pressable>
	);
};

export default UserItem;
