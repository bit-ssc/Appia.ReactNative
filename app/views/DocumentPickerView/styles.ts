import { Dimensions, StyleSheet } from 'react-native';
import { rgba } from 'color2k';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	leftContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	leftButton: {
		flexDirection: 'row',
		height: 32,
		borderRadius: 50,
		backgroundColor: rgba(0, 0, 0, 0.1),
		marginBottom: 5,
		alignItems: 'center'
	},
	holderText: {
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter,
		marginStart: 11,
		fontSize: 16,
		alignSelf: 'center'
	},
	dropItemView: {
		flexDirection: 'row',
		height: 60,
		width: Dimensions.get('window').width,
		backgroundColor: '#fff',
		alignItems: 'center'
	},
	dropItemIcon: {
		marginStart: 16
	},
	dropItemText: {
		flex: 1,
		fontSize: 16,
		marginLeft: 15,
		...sharedStyles.textMedium,
		color: '#000'
	},
	dropIcon: {
		marginEnd: 11
	},
	dropdownView: {
		marginTop: 5,
		width: Dimensions.get('window').width,
		height: Dimensions.get('window').height,
		backgroundColor: 'rgba(0,0,0,0.2)',
		textAlign: 'center'
	},
	unSend: {
		backgroundColor: rgba(0, 0, 0, 0.1),
		color: rgba(0, 0, 0, 0.2),
		height: 32,
		marginEnd: 16,
		borderRadius: 8,
		marginBottom: 5
	},
	send: {
		height: 32,
		marginEnd: 16,
		borderRadius: 8,
		marginBottom: 5
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingEnd: 16
	},
	list: {
		flex: 1
	},
	fileItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingStart: 16,
		paddingVertical: 14,
		alignItems: 'center'
	},
	fileText: {
		flex: 0,
		marginStart: 16
	},
	sender: {
		fontSize: 14,
		paddingVertical: 4,
		color: rgba(0, 0, 0, 0.4)
	},
	fileName: {
		flex: 0,
		fontSize: 16,
		maxWidth: 200,
		paddingVertical: 4,
		color: rgba(0, 0, 0, 0.9)
	},
	fileSize: {
		fontSize: 15,
		color: rgba(0, 0, 0, 0.4),
		marginEnd: 16
	},
	checkbox: {
		borderRadius: 50,
		borderColor: rgba(0, 0, 0, 0.2)
	}
});
