import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	titleContainer: {
		paddingHorizontal: 12,
		paddingVertical: 20,
		flexDirection: 'row',
		backgroundColor: '#fff',
		borderRadius: 8
	},
	title: {
		fontSize: 18,
		lineHeight: 26,
		marginBottom: 4,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textMedium
	},
	content: {
		alignItems: 'center',
		fontSize: 12,
		lineHeight: 24,
		color: 'rgba(0, 0, 0, 0.6)'
	},
	hint: {
		fontSize: 14,
		fontStyle: 'normal',
		fontWeight: '400',
		lineHeight: 22,
		color: '#86909C'
	},
	headerWrapper: {
		paddingVertical: 16,
		marginBottom: 12
	},
	headerInner: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	headerRight: {
		flex: 1,
		marginLeft: 16,
		marginRight: 12
	}
});
