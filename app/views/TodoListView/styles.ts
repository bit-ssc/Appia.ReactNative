import { StyleSheet } from 'react-native';
import { rgba } from 'color2k';

export default StyleSheet.create({
	itemContainer: {
		padding: 12,
		backgroundColor: '#fff',
		marginHorizontal: 12,
		marginBottom: 2,
		borderTopLeftRadius: 5,
		borderTopRightRadius: 5
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		lineHeight: 24
	},
	content: {
		fontSize: 14,
		fontWeight: '400',
		lineHeight: 22
	},
	touch: {
		padding: 20
	},
	itemButtonContainer: {
		flexDirection: 'row',
		marginHorizontal: 12
	},
	itemButton: {
		flex: 1,
		backgroundColor: '#fff',
		borderBottomLeftRadius: 5,
		borderBottomRightRadius: 5
	},
	buttonContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#2878FF',
		paddingVertical: 8,
		backgroundColor: '#fff'
	},
	container: {
		flexDirection: 'row'
	},
	bottom: {
		position: 'absolute',
		borderWidth: 1,
		borderColor: '#2878FF',
		flexDirection: 'row'
	},
	buttonText: {
		fontSize: 16,
		color: '#2878FF'
	},

	bottomButton: {
		borderWidth: 0
	},
	contentTop: {
		paddingHorizontal: 20,
		paddingVertical: 20,
		alignItems: 'center',
		justifyContent: 'center'
	},
	contentBottom: {
		flexDirection: 'row'
	},
	button: {
		flex: 1,
		marginBottom: 0,
		borderRadius: 16
	},
	modalView: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: rgba(0, 0, 0, 0.2)
	},
	modalContent: {
		borderRadius: 16,
		backgroundColor: '#fff',
		width: '70%'
	}
});
