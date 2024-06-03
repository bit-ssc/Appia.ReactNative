import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAFAFA'
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingVertical: 16,
		paddingHorizontal: 16
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
		fontSize: 17,
		...sharedStyles.textRegular
	},
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		marginVertical: 4
	},
	shadow: {
		shadowColor: 'rgba(0, 0, 0, 0.05)',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 0.5,
		borderRadius: 4
	},
	headerWrapper: {
		marginVertical: 20,
		marginHorizontal: 16
	},
	header: {
		paddingVertical: 32,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	line: {
		height: 2,
		backgroundColor: '#FAFAFA'
	},
	userCard: {
		paddingVertical: 9,
		paddingHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	userCardIcon: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerTextContainer: {
		flex: 1
	},
	headerUsername: {
		flex: 1,
		justifyContent: 'space-between'
	},
	username: {
		fontSize: 20,
		lineHeight: 28,
		...sharedStyles.textRegular
	},
	companyName: {
		fontSize: 15,
		lineHeight: 20,
		color: 'rgba(0, 0, 0, 0.4)',
		...sharedStyles.textRegular
	},
	userCardText: {
		fontSize: 17,
		lineHeight: 22,
		color: 'rgba(0, 0, 0, 0.4)',
		...sharedStyles.textRegular
	},
	avatar: {
		marginRight: 20
	},
	currentServerText: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	version: {
		marginHorizontal: 10,
		marginBottom: 10,
		fontSize: 13,
		...sharedStyles.textSemibold
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	}
});
