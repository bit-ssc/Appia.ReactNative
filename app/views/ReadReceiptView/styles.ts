import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 32
	},
	emptyText: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	tabBox: {
		// flexWrap: 'nowrap',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		borderBottomWidth: 1,
		borderColor: '#DCDCDC'
	},
	tabItem: {
		flexDirection: 'row',
		borderColor: '#FFFFFF',
		borderBottomWidth: 1,
		padding: 12,
		paddingTop: 18
	},
	tabName: {
		color: '#000000',
		fontSize: 16
	},
	selectedTabName: {
		color: '#2878FF',
		fontWeight: '600'
	},
	tabSelected: {
		marginBottom: -1,
		color: '#2878FF',
		borderBottomWidth: 2,
		borderColor: '#2878FF'
	},
	listRadius: {
		alignItems: 'center',
		marginLeft: 8,
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: '#EEEEEE'
	},
	selectedRadius: {
		backgroundColor: '#2878FF'
	},
	listCount: {
		alignItems: 'center',
		height: 20,
		lineHeight: 20,
		fontSize: 14,
		paddingHorizontal: 4,
		color: 'rgba(0, 0, 0, 0.6)'
	},
	selectedCount: {
		color: '#FFFFFF'
	},
	item: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	separator: {
		height: StyleSheet.hairlineWidth
	},
	name: {
		...sharedStyles.textRegular,
		fontSize: 17
	},
	username: {
		...sharedStyles.textMedium,
		fontSize: 14
	},
	time: {
		...sharedStyles.textRegular,
		fontSize: 12
	},
	infoContainer: {
		flex: 1,
		marginLeft: 10
	},
	itemContainer: {
		flex: 1,
		flexDirection: 'row',
		padding: 10,
		paddingLeft: 20
	},
	list: {
		...sharedStyles.separatorVertical
	}
});
