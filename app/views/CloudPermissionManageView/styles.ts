import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	bottomBar: {
		height: 73,
		width: '100%',
		alignItems: 'center',
		flexDirection: 'column'
	},
	bottomBarContainer: {
		height: 73,
		width: '100%',
		alignItems: 'center',
		flexDirection: 'row',
		paddingHorizontal: 16
	},
	changePermisson: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: '#1B5BFF',
		borderRadius: 4,
		marginLeft: 12
	},
	image: {
		width: 46,
		height: 46,
		margin: 12,
		borderRadius: 4
	},
	renderListItemContainer: {
		alignItems: 'center',
		width: '100%',
		height: '100%',
		flexDirection: 'row',
		flex: 1,
		borderBottomWidth: 1,
		borderBottomColor: '#E7E7E7'
	},
	renderListItem: {
		alignItems: 'center',
		width: '100%',
		flexDirection: 'row',
		paddingHorizontal: 16
	}
});
