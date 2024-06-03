import { Platform, StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	safeAreaView: {
		flex: 1
	},
	readOnly: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	forwardFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 6,
		paddingVertical: 15,
		backgroundColor: '#fff',
		borderColor: '#E7E7E7',
		borderTopWidth: 0.5,
		...Platform.select({
			ios: { paddingBottom: 35, position: 'absolute', bottom: 0 },
			android: {}
		})
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		flex: 1,
		paddingEnd: 20
	},
	forwardButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 20
	},
	buttonText: {
		marginStart: 12,
		color: '#5f5f5f',
		fontSize: 16
	},
	reactionSearchContainer: {
		marginHorizontal: 12,
		marginBottom: 8
	},
	reactionPickerContainer: {
		flex: 1,
		flexDirection: 'column'
	},
	bannerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 6,
		marginTop: 8,
		marginHorizontal: 12,
		paddingBottom: 4
	},
	bannerText: {
		// flex: 1
	},
	buttonBox: {
		alignItems: 'flex-end'
	},
	button: {
		width: 70,
		height: 36,
		borderRadius: 4
	},
	bannerModalTitle: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	announcementBox: {
		flex: 1,
		marginLeft: 8
	},
	announcementUserBy: {
		fontSize: 12,
		color: '#555555',
		...sharedStyles.textRegular
	},
	announcementMsgBg: {
		padding: 10,
		borderRadius: 4,
		justifyContent: 'center',
		backgroundColor: 'white'
	},
	modalView: {
		padding: 20,
		paddingBottom: 6,
		borderRadius: 4,
		justifyContent: 'center'
	},
	modalScrollView: {
		maxHeight: 180,
		marginVertical: 20
	},
	modalCloseButton: {
		alignSelf: 'flex-end'
	},
	joinRoomContainer: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	joinRoomButton: {
		width: 107,
		height: 44,
		marginTop: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4
	},
	joinRoomText: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	previewMode: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	avatar: {
		marginHorizontal: 15
	},
	leaderContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 65
	},
	avatarContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	leaderName: {
		fontSize: 16,
		fontWeight: '400'
	},
	leaderButton: {
		height: 36,
		marginRight: 16,
		marginBottom: 0,
		fontSize: 16,
		borderRadius: 4
	},
	searchbarContainer: {
		height: 56,
		marginBottom: 8,
		paddingHorizontal: 12
	},
	reactionPickerSearchbar: {
		paddingHorizontal: 20,
		minHeight: 48
	},
	welcomeMsgContainer: {
		alignItems: 'center',
		width: '100%',
		paddingVertical: 12,
		paddingHorizontal: 24,
		flexDirection: 'row'
	},
	welcomeMsgText: {
		marginHorizontal: 8
	},
	refText: {
		paddingVertical: 20,
		paddingHorizontal: 12,
		fontSize: 16,
		color: '#2f343d',
		lineHeight: 28
	}
});
