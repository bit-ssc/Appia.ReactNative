import { I18nManager, StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';

export default StyleSheet.create({
	roomInfoContainer: {
		marginLeft: 16,
		marginRight: 16,
		marginTop: 6,
		marginBottom: 6,
		borderRadius: 8,
		backgroundColor: 'white'
	},
	itemTitle: {
		fontSize: 16,
		flex: 1,
		color: 'black',
		includeFontPadding: false,
		marginLeft: PADDING_HORIZONTAL,
		textAlignVertical: 'center',
		lineHeight: 40
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	},
	tipText: {
		fontSize: 16,
		color: 'rgba(0,0,0,0.5)',
		lineHeight: 22,
		textAlign: 'justify'
	},
	QD_code: {
		flex: 1,
		width: 240,
		height: 240,
		alignItems: 'center',
		justifyContent: 'center'
	},
	qrcodeContainer: {
		flex: 1,
		alignItems: 'center',
		marginBottom: 20
	}
});
