import { StyleSheet } from 'react-native';

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
