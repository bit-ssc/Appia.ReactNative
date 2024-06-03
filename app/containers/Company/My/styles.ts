import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

export default StyleSheet.create({
	headerContainer: {
		paddingBottom: 20,
		marginTop: 24,
		marginHorizontal: 24,
		marginBottom: 8,
		borderBottomColor: '#DCDCDC',
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	avatarWrapper: {
		height: 52,
		marginBottom: 16,
		flexDirection: 'row'
	},
	avatar: {
		flex: 1
	},
	usernameWrapper: {},
	username: {
		flex: 1,
		fontSize: 20,
		lineHeight: 28,
		fontWeight: '600',
		marginBottom: 4,
		color: 'rgba(0, 0, 0, 0.9)'
	},
	companyName: {
		fontSize: 14,
		lineHeight: 22,
		color: 'rgba(0, 0, 0, 0.4)'
	},

	item: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingVertical: 12,
		paddingHorizontal: 24
	},
	itemCurrent: {
		backgroundColor: '#E1E5E8'
	},
	itemHorizontal: {
		alignItems: 'center'
	},
	itemCenter: {
		flex: 1
	},
	leftImage: {
		overflow: 'hidden',
		width: 40,
		height: 40,
		borderRadius: 8,
		marginRight: 12
	},
	itemText: {
		lineHeight: 24,
		fontSize: 16,
		...sharedStyles.textRegular
	}
});
