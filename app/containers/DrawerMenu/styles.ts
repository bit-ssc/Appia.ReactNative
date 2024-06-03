import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	iosBottom: {
		paddingBottom: Platform.OS === 'ios' ? 90 : 0
	},
	iosTop: {
		paddingTop: Platform.OS === 'ios' ? 50 : 0
	},
	container: {
		height: '100%',
		width: '100%',
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 1000
	},
	headTitle: {
		marginVertical: 24,
		marginLeft: 20,
		height: 26,
		width: '100%',
		padding: 10,
		justifyContent: 'center'
	},
	title: {
		color: 'rgba(0, 0, 0, 0.9)',
		height: 26,
		fontWeight: '500',
		fontSize: 18
	}
});
