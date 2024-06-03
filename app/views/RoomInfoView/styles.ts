import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	scroll: {
		flex: 1,
		flexDirection: 'column'
	},
	item: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		justifyContent: 'center'
	},
	box: {
		flexDirection: 'column',
		borderRadius: 4
	},
	directAvatar: {
		marginBottom: 12,
		marginHorizontal: 16,
		paddingBottom: 16
	},
	avatarBox: {
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 20,
		marginHorizontal: 16,
		paddingVertical: 32,
		paddingHorizontal: 16
	},
	roleBox: {
		marginBottom: 12,
		marginHorizontal: 16
	},
	headerWrapper: {
		paddingVertical: 16,
		marginBottom: 12
	},
	headerInner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	headerRight: {
		flex: 1,
		marginLeft: 16,
		marginRight: 12
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	position: {
		fontSize: 14,
		lineHeight: 22,
		color: 'rgba(0, 0, 0, 0.9)'
	},
	workerType: {
		marginLeft: 4,
		paddingHorizontal: 4,
		backgroundColor: '#F5F6F9',
		borderRadius: 4
	},
	workerTypeText: {
		alignItems: 'center',
		fontSize: 12,
		lineHeight: 24,
		color: 'rgba(0, 0, 0, 0.6)'
	},
	directRoomStatus: {
		marginTop: 20
	},
	avatar: {
		marginLeft: 12
	},
	roomTitleContainer: {
		paddingTop: 20,
		paddingBottom: 4,
		alignItems: 'center'
	},
	roomTitle: {
		fontSize: 18,
		lineHeight: 26,
		marginBottom: 4,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textMedium
	},
	status: {
		marginHorizontal: 16
	},
	roomUsername: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	itemLabel: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	itemContent: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	itemContent__empty: {
		fontStyle: 'italic'
	},
	rolesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	roleBadge: {
		padding: 6,
		borderRadius: 2,
		marginRight: 6,
		marginBottom: 6
	},
	role: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	roomButtonsContainer: {
		flexDirection: 'row',
		flex: 1,
		justifyContent: 'center'
	},
	roomButton: {
		alignItems: 'center',
		paddingHorizontal: 20,
		justifyContent: 'space-between'
	},
	roomButton1: {
		height: 40,
		paddingHorizontal: 16,
		flexDirection: 'row',
		borderRadius: 4,
		textAlign: 'center',
		alignItems: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		backgroundColor: '#F0F2F4',
		marginHorizontal: 12
	},
	roomButtonText: {
		fontSize: 16,
		color: 'rgba(0, 0, 0, 0.9)'
	},
	chatIcon: {
		marginRight: 8
	},
	listInfo: {
		width: '100%'
	},
	listItem: {
		flexDirection: 'row',
		// alignItems: 'center',
		marginHorizontal: 12,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F3F3'
	},
	lastListItem: {
		paddingBottom: 0,
		borderBottomWidth: 0
	},
	listItemTitleBox: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 24
	},
	listItemIcon: {
		width: 18
	},
	listItemTitle: {
		width: 64,
		marginLeft: 4,
		fontSize: 14,
		// backgroundColor: 'red',
		color: 'rgba(0, 0, 0, 0.6)'
	},
	listItemText: {
		alignItems: 'center',
		fontSize: 14,
		lineHeight: 24,
		color: 'rgba(0, 0, 0, 0.9)',
		flex: 1
	},
	highlightText: {
		alignItems: 'center',
		fontSize: 16,
		lineHeight: 24,
		color: '#1B5BFF',
		textDecorationLine: 'underline'
	},
	greyText: {
		alignItems: 'center',
		fontSize: 14,
		lineHeight: 24,
		color: 'rgba(0, 0, 0, 0.6)'
	},
	depList: {
		paddingHorizontal: 16,
		paddingBottom: 16
	},
	depListItem: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F3F3'
	},
	cardTitle: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#E7E7E7'
	},
	cardTitleText: {
		fontSize: 14,
		lineHeight: 22,
		fontWeight: 'bold',
		color: 'rgba(0, 0, 0, 0.9)'
	},
	roleList: {
		flexDirection: 'row'
	},
	roleItem: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		marginRight: 8,
		backgroundColor: '#F5F6F9',
		borderRadius: 4
	},
	roleItemText: {
		fontSize: 14,
		lineHeight: 22,
		color: 'rgba(0, 0, 0, 0.9)'
	},
	depItemInfo: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 20,
		color: 'rgba(0, 0, 0, 0.6)'
	},
	tabs: {
		paddingTop: 12,
		paddingBottom: 4,
		padding: 8,
		flexDirection: 'row',
		flexWrap: 'nowrap',
		overflow: 'scroll'
	},
	tab: {
		flexShrink: 0,
		flexWrap: 'nowrap',
		paddingVertical: 4,
		borderColor: '#DCDCDC',
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 20,
		marginRight: 12
	},
	activeTab: {
		borderColor: '#2878FF',
		backgroundColor: '#F0F8FF'
	},
	tabText: {
		flexShrink: 0,
		flexWrap: 'nowrap',
		lineHeight: 17,
		marginHorizontal: 16,
		color: 'rgba(0, 0, 0, 0.6)'
	},
	okrItemWrapper: {
		flexDirection: 'row',
		marginHorizontal: 12,
		borderTopColor: '#DCDCDC',
		marginTop: 6,
		paddingTop: 6
	},
	objectItemWrapper: {
		marginTop: 16,
		borderTopWidth: 0
	},
	okrItemValue: {
		flex: 1
	},
	object: {
		marginTop: 3,
		width: 32,
		height: 18,
		marginRight: 4,
		backgroundColor: '#2878FF',
		borderRadius: 8
	},
	objectContent: {
		fontSize: 14,
		fontWeight: 'bold',
		lineHeight: 22,
		color: 'rgba(0, 0, 0, 0.9)'
	},
	objectText: {
		lineHeight: 18,
		textAlign: 'center',
		color: '#fff'
	},
	tItemWrapper: {
		borderTopWidth: StyleSheet.hairlineWidth
	},
	t: {
		marginTop: 3,
		width: 32,
		height: 18,
		marginRight: 4,
		backgroundColor: '#F0F8FF',
		borderRadius: 8
	},
	tText: {
		lineHeight: 18,
		textAlign: 'center',
		color: '#2878FF'
	},
	tContent: {
		fontSize: 14,
		lineHeight: 22,
		color: 'rgba(0, 0, 0, 0.9)'
	},
	kr: {
		marginTop: 3,
		width: 32,
		height: 18,
		marginRight: 4,
		borderRadius: 8
	},
	krText: {
		lineHeight: 18,
		textAlign: 'center',
		color: '#2878FF'
	},
	okrContent: {
		fontSize: 14,
		lineHeight: 22,
		color: 'rgba(0, 0, 0, 0.9)'
	},
	okrContent1: {
		fontSize: 12,
		lineHeight: 20,
		color: 'rgba(0, 0, 0, 0.9)'
	}
});
