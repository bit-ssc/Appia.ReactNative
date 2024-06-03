import { I18nManager, StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	roomInfoContainer: {
		marginHorizontal: 16,
		marginVertical: 6,
		borderRadius: 8,
		backgroundColor: 'white'
	},
	groupSettingContainer: {
		marginVertical: 6,
		backgroundColor: 'white',
		flexDirection: 'row'
	},
	roomInfoView: {
		paddingHorizontal: PADDING_HORIZONTAL,
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginRight: PADDING_HORIZONTAL,
		marginBottom: 10
	},
	roomTitleContainer: {
		flex: 1
	},
	roomTitle: {
		fontSize: 18,
		color: 'black',
		...sharedStyles.textMedium
	},
	roomDescription: {
		fontSize: 13,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		paddingRight: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	},
	groupMemberCount: {
		fontSize: 16,
		marginLeft: PADDING_HORIZONTAL,
		flex: 1
	},
	avatarContainer: {
		flexDirection: 'row',
		marginHorizontal: PADDING_HORIZONTAL,
		flexWrap: 'wrap',
		maxHeight: 120,
		overflow: 'hidden',
		paddingVertical: 16
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
	itemInner: {
		flexDirection: 'row',
		marginLeft: PADDING_HORIZONTAL,
		marginRight: PADDING_HORIZONTAL,
		height: 40,
		alignItems: 'center'
	}
});
