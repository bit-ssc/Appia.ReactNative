import React, { useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const ContainerView: React.FC<{ isOpen: boolean }> = ({ isOpen, children }) => {
	const screen = Dimensions.get('window');
	const translateY = useSharedValue(-screen.height);
	const [pIsOpen, setPIsOpen] = useState(false);

	if (isOpen !== pIsOpen) {
		if (isOpen) {
			translateY.value = withTiming(0, {
				duration: 200,
				easing: Easing.linear
			});
		} else {
			translateY.value = withTiming(-screen.height, {
				duration: 200,
				easing: Easing.linear
			});
		}
		setPIsOpen(isOpen);
	}

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }]
	}));

	return (
		<Animated.View style={[styles.box, animatedStyles]} pointerEvents='box-none'>
			{children}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	box: {
		width: '100%',
		height: '100%',
		backgroundColor: 'clear',
		zIndex: 1,
		position: 'absolute',
		borderRadius: 50
	}
});

export default ContainerView;
