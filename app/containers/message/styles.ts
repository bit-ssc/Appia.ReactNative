import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
// import { isTablet } from '../../lib/methods/helpers';

export default StyleSheet.create({
	root: {
		flexDirection: 'row'
	},
	container: {
		paddingVertical: 4,
		width: '100%',
		paddingHorizontal: 14,
		flexDirection: 'column'
	},
	headerBox: {
		marginTop: 12
	},
	contentContainer: {
		flex: 1
	},
	messageContent: {
		flex: 1,
		marginLeft: 46
	},
	messageContainer: {
		maxWidth: '90%',
		flexShrink: 1
	},
	messageContentWithHeader: {
		marginLeft: 10
	},
	messageContentWithError: {
		marginLeft: 0
	},
	flex: {
		flexDirection: 'row'
	},
	temp: { opacity: 0.3 },
	msgText: {
		alignSelf: 'flex-start',
		paddingTop: 6,
		paddingBottom: 6,
		paddingLeft: 12,
		paddingRight: 12,
		marginTop: 6,
		backgroundColor: '#FFFFFF',
		borderRadius: 4
	},
	msgTextOwn: {
		backgroundColor: '#CCE6FF'
	},
	msgTodo: {
		backgroundColor: '#FFF7E8',
		borderWidth: 1,
		borderColor: '#FF7D00',
		borderRadius: 4
	},
	marginTop: {
		marginTop: 6
	},
	reactionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 8
	},
	reactionButton: {
		marginRight: 8,
		marginBottom: 8,
		borderRadius: 4
	},
	reactionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 4,
		borderWidth: 1,
		height: 28,
		minWidth: 46.3
	},
	reactionCount: {
		fontSize: 14,
		marginLeft: 3,
		marginRight: 8.5,
		...sharedStyles.textSemibold
	},
	reactionEmoji: {
		fontSize: 13,
		marginLeft: 7,
		color: '#ffffff'
	},
	reactionCustomEmoji: {
		width: 19,
		height: 19,
		marginLeft: 7
	},
	avatar: {
		marginTop: 4
	},
	avatarSmall: {
		marginLeft: 16
	},
	buttonContainer: {
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center'
	},
	button: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4
	},
	buttonIcon: {
		marginRight: 8
	},
	buttonText: {
		fontSize: 12,
		...sharedStyles.textSemibold
	},
	imageContainer: {
		flexDirection: 'column',
		borderRadius: 4
	},
	image: {
		maxWidth: '100%',
		// minHeight: isTablet ? 300 : 200,
		borderRadius: 4,
		borderWidth: 1,
		overflow: 'hidden'
	},
	imagePressed: {
		opacity: 0.5
	},
	inlineImage: {
		width: 300,
		height: 300,
		resizeMode: 'contain'
	},
	text: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	textInfo: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	startedDiscussion: {
		fontStyle: 'italic',
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textRegular
	},
	time: {
		fontSize: 13,
		marginLeft: 8,
		...sharedStyles.textRegular
	},
	repliedThread: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
		marginBottom: 12
	},
	repliedThreadIcon: {
		marginRight: 10,
		marginLeft: 16
	},
	repliedThreadName: {
		fontSize: 16,
		flex: 1,
		...sharedStyles.textRegular
	},
	repliedThreadDisclosure: {
		marginLeft: 4,
		marginRight: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	threadBadge: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginLeft: 8
	},
	threadBell: {
		marginLeft: 8
	},
	rightIcons: {
		paddingLeft: 8
	},
	threadDetails: {
		flex: 1,
		marginLeft: 12
	},
	checkboxArea: {
		paddingTop: 16,
		paddingRight: 8
	},
	readReceipt: {
		width: 16,
		height: 16,
		marginLeft: 8,
		marginBottom: 4,
		paddingLeft: 1,
		paddingTop: 1,
		borderRadius: 8,
		alignItems: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		borderWidth: 1
	},
	dot: {
		width: 3,
		height: 3,
		marginHorizontal: 5,
		marginTop: 10,
		backgroundColor: '#2878FF'
	}
});
