import { StyleSheet, PixelRatio, Dimensions } from 'react-native';

import UserPreferences from '../../../../lib/methods/userPreferences';
import { DEFAULT_FONT_SETTING } from '../../../../lib/constants';
import sharedStyles from '../../../Styles';

const { width: DimensionsWidth } = Dimensions.get('window');

const fontSettingValue = UserPreferences.getString(DEFAULT_FONT_SETTING);
const ROW_HEIGHT_CONDENSED = fontSettingValue === 'Follow_System_Setting' ? 60 * PixelRatio.getFontScale() : 60;
const ROW_HEIGHT = fontSettingValue === 'Follow_System_Setting' ? 75 * PixelRatio.getFontScale() : 75;

export const ACTION_WIDTH = 80;
export const SMALL_SWIPE = ACTION_WIDTH / 2;
export const LONG_SWIPE = ACTION_WIDTH * 2.5;

const styles = StyleSheet.create({
	flex: {
		flex: 1
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 14,
		height: ROW_HEIGHT,

		width: DimensionsWidth
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
		color: '#FF1B1B',
		marginEnd: 4
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
	},

	// ---------------------
	containerCondensed: {
		height: ROW_HEIGHT_CONDENSED
	},
	typeTitleContainer: {
		flexDirection: 'row',
		flex: 1,
		alignItems: 'center',
		paddingLeft: 14,
		paddingVertical: 10,
		paddingRight: 16,
		borderBottomWidth: 1.5,
		borderBottomColor: '#e6e6e6',
		borderTopColor: '#efefef'
	},
	typeTitle: {
		paddingRight: 16
	},

	// 头部 搜索类型
	tabBarSearch: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-between',
		alignContent: 'center',
		height: 40
	},

	searchTypeTitle: {
		width: '33.333%',
		justifyContent: 'center',
		alignContent: 'center',
		flexDirection: 'row',

		flex: 1,
		alignItems: 'center'
	},
	searchTypeTitleText: {
		// flexDirection: "column",
		// justifyContent: "space-between",
		// alignContent: "center",
		fontSize: 15,
		paddingBottom: 3,
		textAlign: 'center',
		borderBottomWidth: 3,
		borderBottomColor: 'rgba(0,0,0,0)'
	},
	// ScrollView 样式
	ScrollView: {
		width: DimensionsWidth,
		flex: 1,
		height: '100%'
	},

	allSearchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: DimensionsWidth
	},

	// 查看全部的样式
	MoreContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row'
	},
	MoreItem: {
		flex: 1,
		paddingLeft: 14,
		paddingVertical: 10,
		paddingRight: 16,

		borderTopColor: 'rgba(0,0,0,0)'
	},
	MoreItemText: {
		color: '#1b5bff',
		fontWeight: '700'
	},

	// // 无查询结果样式
	NoItemMsg: {
		flex: 1,
		justifyContent: 'center',
		width: DimensionsWidth,
		height: '100%'
	},

	NoItemMsgText: {
		textAlign: 'center'
	},

	// 覆盖 FlatList 样式
	FlatListStyle: {
		width: '100%',
		height: '100%'
	},

	// AllList 所有搜索列表
	AllList: {
		width: DimensionsWidth
	}
});

export default styles;
