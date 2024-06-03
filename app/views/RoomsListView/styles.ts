import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
	},
	dropdownContainerHeader: {
		height: 41,
		borderBottomWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		flexDirection: 'row'
	},
	dropdownContainer: {
		width: '100%',
		position: 'absolute',
		top: 0,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	backdrop: {
		...StyleSheet.absoluteFillObject
	},
	groupTitleContainer: {
		paddingHorizontal: 12,
		paddingTop: 17,
		paddingBottom: 10
	},
	groupTitle: {
		fontSize: 16,
		letterSpacing: 0.27,
		flex: 1,
		lineHeight: 24,
		...sharedStyles.textBold
	},
	serverHeader: {
		justifyContent: 'space-between'
	},
	serverHeaderText: {
		fontSize: 16,
		marginLeft: 12,
		...sharedStyles.textRegular
	},
	serverHeaderAdd: {
		fontSize: 16,
		marginRight: 12,
		paddingVertical: 10,
		...sharedStyles.textRegular
	},
	buttonCreateWorkspace: {
		height: 46,
		justifyContent: 'center',
		marginBottom: 0
	},
	connectedWrapper: {
		backgroundColor: '#FDECEE',
		flexDirection: 'row',
		alignItems: 'center',
		height: 46
	},
	errorNetworkIcon: {
		width: 24,
		height: 24,
		marginLeft: 16,
		marginRight: 12
	},
	errorNetworkText: {
		fontSize: 14
	},
	fasModeTipsContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		paddingVertical: 12,
		paddingHorizontal: 8
	},
	fasModeTipsText: {
		textAlign: 'center',
		color: 'rgba(0, 0, 0, 0.26)'
	},
	emptyContainer: {
		flex: 1,
		height: '100%',
		alignItems: 'center'
	},
	emptyText: {
		textAlign: 'center'
	}
});
