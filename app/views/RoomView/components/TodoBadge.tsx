import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: -6,
		right: -2,
		zIndex: 9,
		borderRadius: 50,
		backgroundColor: '#D91F1B',
		height: 10,
		width: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	text: {
		fontSize: 8,
		color: '#fff'
	}
});

export interface ITodoBadge {
	todo?: number;
	style?: StyleProp<ViewStyle>;
}

const TodoBadge = React.memo(({ todo, style }: ITodoBadge) => {
	let text: any = todo;
	if (text >= 100) {
		text = '+99';
	}
	text = text.toString();

	return (
		<View style={[styles.container, style]}>
			<Text style={[styles.text]} numberOfLines={1}>
				{text}
			</Text>
		</View>
	);
});

export default TodoBadge;
