import React, { RefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import I18n from 'i18n-js';

import Button, { IButtonProps } from '../Button';
import { themes } from '../../lib/constants';
import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';

export interface ActionType {
	reset: () => void;
	restart: () => void;
}

export interface IProps extends Omit<IButtonProps, 'title'> {
	disabled?: boolean;
	countdown?: number;
	text?: string;
	fetchingText?: string;
	autoExecuted?: boolean;
	testID?: string;
	pressTime?: number | null;
	ref?: RefObject<ActionType>;
}

export const Countdown = React.forwardRef(
	(
		{
			disabled,
			text = I18n.t('Get_Verification_Code'),
			fetchingText = '${count}s',
			countdown: propsCountdown = 60,
			onPress: propsPress,
			autoExecuted = true,
			pressTime,
			...props
		}: IProps,
		ref
	) => {
		const [countdown, setCountdown] = useState<number>(0);
		const [loading, setLoading] = useState(false);
		const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
		const { theme } = useTheme();

		useImperativeHandle(
			ref,
			(): ActionType => ({
				reset: () => {
					timer.current && clearTimeout(timer.current);
					setCountdown(0);
				},
				restart: () => {
					timer.current && clearTimeout(timer.current);
					countdownHandler(Date.now());
				}
			})
		);

		const countdownHandler = useCallback(
			(start: number) => {
				const num = propsCountdown - Math.floor((Date.now() - start) / 1000);

				if (num >= 0) {
					setCountdown(num);

					timer.current = setTimeout(() => {
						countdownHandler(start);
					}, 1000);
				} else {
					timer.current = null;
					setCountdown(0);
				}
			},
			[propsCountdown]
		);

		const onPress = useCallback(async () => {
			if (loading || disabled || countdown > 0) return;

			setLoading(true);
			try {
				propsPress && (await propsPress());
				if (autoExecuted) {
					countdownHandler(Date.now());
				}
			} catch (e) {
				console.error(e);
			}
			setLoading(false);

			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [loading, disabled, countdown, fetch, autoExecuted]);

		useEffect(() => {
			if (pressTime) {
				countdownHandler(pressTime);
			}

			return () => {
				timer.current && clearTimeout(timer.current);
				setCountdown(0);
			};
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		return (
			<Button
				{...props}
				styleText={{
					color: countdown > 0 || disabled ? themes[theme].controlText : themes[theme].headerTitleColor,
					...sharedStyles.textRegular
				}}
				style={{
					opacity: 1,
					minWidth: 100,
					height: 38,
					borderRadius: 8,
					marginLeft: 10,
					padding: 0,
					marginBottom: 0,
					backgroundColor: themes[theme].backgroundColor,
					borderColor: themes[theme].hideBackground,
					borderWidth: StyleSheet.hairlineWidth
				}}
				disabled={disabled || countdown > 0}
				disabledStyle={{
					opacity: 0.9
				}}
				title={countdown > 0 ? fetchingText.replace(/\${count}/gi, `${countdown}`) : text}
				onPress={onPress}
			/>
		);
	}
);
