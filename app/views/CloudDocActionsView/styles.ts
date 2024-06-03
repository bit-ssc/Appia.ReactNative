import { I18nManager, StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	fileInfoContainer: {
		marginHorizontal: 16,
		marginVertical: 6,
		borderRadius: 8,
		backgroundColor: 'white'
	},
	fileInfoView: {
		paddingHorizontal: PADDING_HORIZONTAL,
		flexDirection: 'row',
		alignItems: 'center'
	},
	fileNameContainer: {
		flex: 1
	},
	fileDescription: {
		fontSize: 13,
		...sharedStyles.textRegular
	},
	fileName: {
		fontSize: 18,
		color: 'black',
		fontWeight: '600',
		...sharedStyles.textMedium
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	},
	membersTitle: {
		flexDirection: 'row',
		paddingVertical: 12,
		paddingHorizontal: 16
	},
	membersCount: {
		marginHorizontal: 8,
		fontSize: 14,
		color: 'rgba(0,0,0,0.6)'
	},
	avatarContainer: {
		flexDirection: 'row',
		marginHorizontal: PADDING_HORIZONTAL,
		flexWrap: 'wrap',
		maxHeight: 120,
		overflow: 'hidden',
		paddingVertical: 16
	},
	avatar: {
		marginRight: PADDING_HORIZONTAL,
		marginBottom: 10
	},
	text: {
		flex: 1,
		fontSize: 16,
		color: '#000'
	},
	touch: {
		flexDirection: 'row',
		paddingHorizontal: 12,
		height: 58,
		alignItems: 'center'
	}
});
