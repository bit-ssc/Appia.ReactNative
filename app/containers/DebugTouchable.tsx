import React, { useCallback, useRef } from 'react';
import { GestureResponderEvent, TouchableWithoutFeedback, TouchableWithoutFeedbackProps, View } from 'react-native';

interface IDebugTouchableProps extends TouchableWithoutFeedbackProps {
	time?: number;
	delay?: number;
}

const DebugTouchable: React.FC<IDebugTouchableProps> = ({ onPress, time = 10, delay = 500, children, ...props }) => {
	const pressTime = useRef<number>(0);
	const counter = useRef<number>(0);
	const count = useCallback(
		(e: GestureResponderEvent) => {
			const now = Date.now();

			if (now - pressTime.current > delay) {
				counter.current = 1;
			} else {
				counter.current++;
			}

			pressTime.current = now;

			if (counter.current > time) {
				counter.current = 0;
				onPress && onPress(e);
			}
			// eslint-disable-next-line
		},
		[time, delay]
	);

	return (
		<TouchableWithoutFeedback onPress={count} {...props}>
			<View>{children}</View>
		</TouchableWithoutFeedback>
	);
};

export default DebugTouchable;
