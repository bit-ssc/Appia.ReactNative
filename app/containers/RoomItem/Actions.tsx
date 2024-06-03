import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../CustomIcon';
import { DisplayMode } from '../../lib/constants';
import styles, { ROW_HEIGHT_CONDENSED } from './styles';
import { ILeftActionsProps, IRightActionsProps } from './interfaces';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

const CONDENSED_ICON_SIZE = 20;
const EXPANDED_ICON_SIZE = 24;

export const LeftActions = React.memo(({ transX, isRead, width, onToggleReadPress, displayMode }: ILeftActionsProps) => {
	const { colors } = useTheme();

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View style={[styles.actionsContainer, styles.actionsLeftContainer]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{ width: width * 2, backgroundColor: colors.tintColor, right: '100%' },
					viewHeight,
					animatedStyles
				]}
			>
				<View style={[styles.actionLeftButtonContainer, viewHeight]}>
					<RectButton style={styles.actionButton} onPress={onToggleReadPress}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name={isRead ? 'mail' : 'check'}
							color={colors.buttonText}
						/>
						<Text style={styles.actionText}>{isRead ? I18n.t('Toggle_Unread') : I18n.t('Toggle_Read')}</Text>
					</RectButton>
				</View>
			</Animated.View>
		</View>
	);
});

export const RightActions = React.memo(({ transX, width, onHidePress, displayMode }: IRightActionsProps) => {
	const { colors } = useTheme();

	const animatedFavStyles = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View style={[styles.actionsLeftContainer, viewHeight]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width,
						backgroundColor: colors.hideBackground,
						left: '100%'
					},
					isCondensed && { height: ROW_HEIGHT_CONDENSED },
					animatedFavStyles
				]}
			>
				<RectButton style={[styles.actionButton, { backgroundColor: colors.hideBackground }]} onPress={onHidePress}>
					<CustomIcon
						size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
						name='unread-on-top-disabled'
						color={colors.buttonText}
					/>
					<Text style={styles.actionText}>{I18n.t('Hide')}</Text>
				</RectButton>
			</Animated.View>
		</View>
	);
});
