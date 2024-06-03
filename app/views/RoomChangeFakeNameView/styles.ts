import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		paddingHorizontal: 40,
		alignItems: 'center',
		paddingTop: '20%',
		paddingBottom: '10%',
		flex: 1,
		backgroundColor: '#fff'
	},
	wrap: {
		flex: 1
	},
	title: {
		textAlign: 'center',
		fontSize: 20,
		fontWeight: '600',
		color: '#000'
	},
	tips: {
		textAlign: 'center',
		fontSize: 16,
		color: 'rgba(0,0,0,0.8)',
		marginTop: 10
	},
	contentWrap: {
		marginTop: '10%'
	},
	contentContainer: {
		flexDirection: 'row',
		marginVertical: 8,
		alignItems: 'center'
	},
	textInput: {
		flex: 1,
		marginStart: 8
	},
	buttonContainer: {
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	button: {
		width: '50%',
		borderRadius: 8
	}
});
