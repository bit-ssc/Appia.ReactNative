import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import EventEmitter from '../../../lib/methods/helpers/events';
import sharedStyles from '../../../views/Styles';

const styles = StyleSheet.create({
	toast: {
		maxWidth: 300,
		padding: 10,
		backgroundColor: '#0C0D0F'
	},
	text: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		color: '#ffffff'
	}
});

const LISTENER = 'BottomToast';

export const showBottomToast = (message: string, time?: number): void => EventEmitter.emit(LISTENER, { message, time });

let listener: Function;
let toast: EasyToast | null | undefined;

const BottomToast = (): React.ReactElement => {
	useEffect(() => {
		listener = EventEmitter.addEventListener(LISTENER, showToast);
		return () => {
			EventEmitter.removeListener(LISTENER, listener);
		};
	}, []);

	const getToastRef = (newToast: EasyToast | null) => (toast = newToast);

	const showToast = ({ message, time }: { message: string; time: number }) => {
		if (toast && toast.show) {
			toast.close();
			toast.show(message, time || 1000);
		}
	};

	return (
		<EasyToast
			ref={getToastRef}
			position='bottom'
			positionValue={250}
			// @ts-ignore
			style={styles.toast}
			textStyle={styles.text}
			fadeOutDuration={0}
			opacity={0.9}
		/>
	);
};

export default BottomToast;
