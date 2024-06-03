import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import EventEmitter from '../lib/methods/helpers/events';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	toast: {
		maxWidth: 300,
		padding: 10
	},
	text: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

export const LISTENER = 'Toast';

let listener: Function;
let toast: EasyToast | null | undefined;

const Toast = (): React.ReactElement => {
	const { colors } = useTheme();

	const [position, setPosition] = React.useState('top');

	const [positionValue, setPositionValue] = React.useState(150);

	useEffect(() => {
		listener = EventEmitter.addEventListener(LISTENER, showToast);
		return () => {
			EventEmitter.removeListener(LISTENER, listener);
		};
	}, []);

	const getToastRef = (newToast: EasyToast | null) => (toast = newToast);

	const showToast = ({
		message,
		time,
		position,
		positionValue
	}: {
		message: string;
		time: number;
		position: string;
		positionValue: number;
	}) => {
		if (toast && toast.show) {
			toast.show(message, time || 1000);
		}
		if (position) {
			setPosition(position);
		} else {
			setPosition('top');
		}

		if (positionValue) {
			setPositionValue(positionValue);
		} else {
			setPositionValue(120);
		}
	};

	return (
		<EasyToast
			ref={getToastRef}
			// @ts-ignore
			position={position}
			positionValue={positionValue}
			style={[styles.toast, { backgroundColor: colors.toastBackground }]}
			textStyle={[styles.text, { color: colors.buttonText }]}
			opacity={0.9}
		/>
	);
};

export default Toast;
