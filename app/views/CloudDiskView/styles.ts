import { I18nManager, StyleSheet } from 'react-native';
import { rgba } from 'color2k';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	loadingContainer: {
		flex: 1,
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center'
	},
	itemContainer: {
		width: '100%',
		flexDirection: 'row',
		paddingHorizontal: 32,
		paddingVertical: 16
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	},
	contentContainer: {
		marginHorizontal: 16,
		flex: 1
	},
	title: {
		fontSize: 16,
		fontWeight: '400',
		color: '#333'
	},
	info: {
		fontSize: 13,
		fontWeight: '400',
		color: '#999'
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
	},
	contentTop: {
		paddingHorizontal: 20,
		paddingVertical: 20
	},
	contentTitle: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 5
	},
	contentBottom: {
		flexDirection: 'row'
	},
	button: {
		flex: 1,
		marginBottom: 0,
		borderRadius: 16
	},
	failContent: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	failText: {
		fontSize: 16
	},
	buttonContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12
	}
});
