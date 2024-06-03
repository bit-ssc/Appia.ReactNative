import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
	},
	item: {
		flexDirection: 'row',
		paddingVertical: 10,
		paddingHorizontal: 16,
		alignItems: 'center'
	},
	avatar: {
		marginRight: 16
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: 60
	},
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
	itemTitle: {
		fontSize: 16,
		flex: 1,
		color: 'black',
		includeFontPadding: false,
		marginLeft: 16,
		textAlignVertical: 'center',
		lineHeight: 40
	},
	switchContainer: {
		height: 54,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 18
	},
	label: {
		fontSize: 16,
		...sharedStyles.textMedium,
		lineHeight: 24
	},
	tips: {
		fontSize: 12,
		...sharedStyles.textMedium,
		lineHeight: 22
	}
});
