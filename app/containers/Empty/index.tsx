import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, Image } from 'react-native';

import EmptyIcon, { ErrorIcon } from './Empty';

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingBottom: 80
	},
	description: {
		marginTop: 20,
		fontSize: 16,
		color: 'rgba(0, 0, 0, 0.3)',
		textAlign: 'center'
	}
});

interface Props {
	description?: string;
	onPress?: () => void;
	style?: ViewStyle[] | ViewStyle;
	noPermission?: boolean;
	icon?: {
		width: number;
		height: number;
	};
}

const EmptyView: React.FC<Props> = ({
	description,
	onPress,
	style,
	noPermission,
	icon = {
		width: 375,
		height: 300
	}
}) => (
	<>
		{onPress ? (
			<TouchableOpacity style={[styles.container, style]} onPress={onPress}>
				{noPermission ? (
					<Image source={require('./OKRNoPermission.png')} style={{ width: 238, height: 155 }} />
				) : (
					<EmptyIcon width={icon.width} height={icon.height} />
				)}
				{description ? <Text style={styles.description}>{description}</Text> : null}
			</TouchableOpacity>
		) : (
			<View style={[styles.container, style]}>
				{noPermission ? (
					<Image source={require('./OKRNoPermission.png')} style={{ width: 238, height: 155 }} />
				) : (
					<EmptyIcon width={icon.width} height={icon.height} />
				)}
				{description ? <Text style={styles.description}>{description}</Text> : null}
			</View>
		)}
	</>
);

export const ErrorView: React.FC<Props> = ({ description, onPress }) => (
	<>
		{onPress ? (
			<TouchableOpacity style={styles.container} onPress={onPress}>
				<ErrorIcon />
				<Text style={styles.description}>{description}</Text>
			</TouchableOpacity>
		) : (
			<View style={styles.container}>
				<ErrorIcon />
				<Text style={styles.description}>{description}</Text>
			</View>
		)}
	</>
);

export default EmptyView;
