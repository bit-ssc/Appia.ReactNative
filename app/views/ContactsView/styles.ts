import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	loadError: {
		flex: 1,
		alignContent: 'center',
		justifyContent: 'center'
	},
	loadText: {
		textAlign: 'center',
		fontSize: 16
	},
	noData: {
		resizeMode: 'contain',
		width: '100%'
	},
	headerTextInput: {},
	itemViewBox: {
		flex: 1
	},
	itemView: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 5
	},
	borderBottom: {
		marginLeft: 60,
		borderBottomWidth: 1
	},
	departmentName: {
		flex: 1,
		fontSize: 17,
		paddingRight: 12,
		paddingVertical: 12,
		lineHeight: 24
	},
	departmentIcon: {
		overflow: 'hidden',
		width: 40,
		height: 40,
		marginLeft: 16,
		marginRight: 12,
		marginVertical: 8,
		borderRadius: 8
	},
	departmentCountWrapper: {
		display: 'flex',
		flexDirection: 'row',
		borderRadius: 4,
		backgroundColor: '#F5F6F9',
		height: 22,
		paddingHorizontal: 5,
		marginRight: 6,
		alignItems: 'center'
	},
	departmentArrow: {
		marginRight: 16
	},
	userAvatar: {
		overflow: 'hidden',
		marginLeft: 16,
		marginRight: 12,
		marginVertical: 8,
		borderRadius: 8
	},
	userName: {
		flex: 1,
		fontSize: 17,
		paddingVertical: 12,
		lineHeight: 24
	},
	countView: {
		paddingVertical: 17,
		paddingLeft: 0,
		paddingRight: 20,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		flexWrap: 'wrap'
	},
	count: {
		height: 22,
		lineHeight: 22,
		paddingHorizontal: 4,
		color: 'rgba(0, 0, 0, 0.26)',
		textAlign: 'center'
	}
});
