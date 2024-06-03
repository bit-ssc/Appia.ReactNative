import { I18nManager, StyleSheet } from 'react-native';
import { rgba } from 'color2k';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	roomInfoContainer: {
		marginLeft: 16,
		marginRight: 16,
		marginTop: 6,
		marginBottom: 6,
		borderRadius: 8,
		backgroundColor: 'white'
	},
	roomTitle: {
		fontSize: 18,
		lineHeight: 26,
		marginStart: 20,
		marginBottom: 4,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textMedium
	},
	roomInfoView: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginLeft: 16
	},
	itemTitle: {
		fontSize: 16,
		color: 'black',
		includeFontPadding: false,
		textAlignVertical: 'center',
		lineHeight: 40
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	},
	sendContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		marginBottom: 20
	},
	send: {
		marginHorizontal: 16,
		borderRadius: 4
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
	contentBottom: {
		flexDirection: 'row'
	},
	button: {
		flex: 1,
		marginBottom: 0,
		borderRadius: 16
	}
});
