import { PixelRatio, StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import UserPreferences from '../../lib/methods/userPreferences';
import { DEFAULT_FONT_SETTING } from '../../lib/constants';

const fontSettingValue = UserPreferences.getString(DEFAULT_FONT_SETTING);

export const ROW_HEIGHT = fontSettingValue === 'Follow_System_Setting' ? 75 * PixelRatio.getFontScale() : 75;
export const ROW_HEIGHT_CONDENSED = fontSettingValue === 'Follow_System_Setting' ? 60 * PixelRatio.getFontScale() : 60;
export const ACTION_WIDTH = 80;
export const SMALL_SWIPE = ACTION_WIDTH / 2;
export const LONG_SWIPE = ACTION_WIDTH * 2.5;

export default StyleSheet.create({
	flex: {
		flex: 1
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 14,
		height: ROW_HEIGHT
	},
	containerCondensed: {
		height: ROW_HEIGHT_CONDENSED
	},
	centerContainer: {
		flex: 1,
		paddingVertical: 10,
		paddingRight: 16,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	title: {
		fontSize: 18,
		...sharedStyles.textMedium
	},
	avatarBox: {
		position: 'relative'
	},
	unreadNum: {
		position: 'absolute',
		top: -6,
		right: 2,
		zIndex: 9
	},
	alert: {
		...sharedStyles.textSemibold
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	descContainer: {
		marginTop: 0,
		marginLeft: 6,
		marginRight: 6
	},
	textTodo: {
		color: 'red',
		marginEnd: 4,
		fontSize: 14,
		marginTop: 2,
		fontWeight: '400'
	},
	wrapUpdatedAndBadge: {
		alignItems: 'flex-end'
	},
	titleContainer: {
		width: '100%',
		marginTop: 6,
		marginLeft: 5,
		flexDirection: 'row',
		alignItems: 'center'
	},
	date: {
		fontSize: 12,
		marginLeft: 4,
		...sharedStyles.textRegular
	},
	updateAlert: {
		...sharedStyles.textSemibold
	},
	status: {
		marginRight: 2
	},
	markdownText: {
		flex: 1,
		fontSize: 14,
		...sharedStyles.textRegular
	},
	avatar: {
		marginRight: 10
	},
	upperContainer: {
		overflow: 'hidden'
	},
	actionsContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: ROW_HEIGHT
	},
	actionText: {
		color: '#fff',
		fontSize: 14
	},
	actionsLeftContainer: {
		flexDirection: 'row',
		position: 'absolute',
		left: 0,
		right: 0,
		height: ROW_HEIGHT
	},
	actionLeftButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		justifyContent: 'center',
		top: 0,
		right: 0
	},
	actionRightButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		justifyContent: 'center',
		top: 0
	},
	actionButton: {
		width: ACTION_WIDTH,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	tagContainer: {
		alignSelf: 'center',
		alignItems: 'center',
		borderRadius: 4,
		marginHorizontal: 4
	},
	tagText: {
		fontSize: 13,
		paddingHorizontal: 4,
		...sharedStyles.textSemibold
	},
	typeIcon: {
		height: ROW_HEIGHT,
		justifyContent: 'center'
	},
	statusIcon: {
		position: 'absolute',
		bottom: -28,
		left: -21
		// borderWidth: 0.5,
		// borderColor: '#ffffff',
		// borderRadius: 11
	},
	redBadge: {
		position: 'absolute',
		top: -4,
		right: 6,
		zIndex: 8,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#F30',
		marginTop: 2
	}
});
