import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import FastImage from 'react-native-fast-image';

import { CustomIcon, TIconsName } from './CustomIcon';
import sharedStyles from '../views/Styles';
import { isIOS } from '../lib/methods/helpers';
import { useTheme } from '../theme';
import I18n from '../i18n';
import Federation from './Icon/Federation';
import Avatar from './Avatar';

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
	}
});

interface IDepartmentItem {
	name: string;
	onPress(): void;
	style?: StyleProp<ViewStyle>;
	avatar: string;
	icon?: TIconsName | null;
	iconColor?: string;
	disabled?: boolean;
	count: number;
}

const DepartmentItem = ({ name, onPress, style, icon, iconColor, avatar, count, disabled }: IDepartmentItem) => {
	const { colors } = useTheme();
	return (
		<Pressable
			onPress={() => !disabled && onPress()}
			android_ripple={{
				color: colors.bannerBackground
			}}
			style={({ pressed }: any) => ({
				backgroundColor: isIOS && pressed ? colors.bannerBackground : 'transparent'
			})}
		>
			<View style={[styles.container, styles.button, style]}>
				{avatar ? (
					<FastImage
						style={[styles.avatar, { width: 30, height: 30 }]}
						source={{
							uri: avatar,
							headers: RocketChatSettings.customHeaders,
							priority: FastImage.priority.high
						}}
					/>
				) : (
					<Avatar text={name} size={30} style={styles.avatar} />
				)}

				<View style={styles.textContainer}>
					<View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
						<Text style={[styles.name, { color: colors.bodyText, marginEnd: 4 }]} numberOfLines={1}>
							{`${name} (${count}${I18n.t('members')})`}
						</Text>
						<Federation />
					</View>
				</View>
				{icon ? <CustomIcon name={icon} size={22} color={iconColor || colors.actionTintColor} style={styles.icon} /> : null}
			</View>
		</Pressable>
	);
};

export default DepartmentItem;
