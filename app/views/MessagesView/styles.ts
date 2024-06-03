import { StyleSheet } from 'react-native';
import { rgba } from 'color2k';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	noDataFound: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	searchTextContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8
	},
	fileItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingStart: 16,
		paddingVertical: 14
	},
	fileName: {
		flex: 0,
		fontSize: 16,
		maxWidth: 200,
		paddingVertical: 4,
		color: rgba(0, 0, 0, 0.9)
	},
	sender: {
		fontSize: 14,
		paddingVertical: 4,
		color: rgba(0, 0, 0, 0.4)
	},
	fileText: {
		flex: 0,
		marginStart: 16
	},
	fileIcon: {
		height: 50,
		width: 40,
		marginLeft: 21,
		marginRight: 14,
		marginBottom: 14,
		marginTop: 14
	},
	fileSize: {
		fontSize: 14,
		color: rgba(0, 0, 0, 0.4),
		marginTop: 18,
		marginEnd: 16,
		marginStart: 30
	},
	spinnerTextStyle: {
		color: '#FFF'
	}
});
