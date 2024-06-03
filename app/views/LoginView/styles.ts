import { Dimensions, Platform, StyleSheet } from 'react-native';
import { rgba } from 'color2k';

import sharedStyles from '../Styles';

const windowWidth = Dimensions.get('window').width;
export default StyleSheet.create({
	containerBackground: {
		width: windowWidth,
		height: 194,
		position: 'absolute'
	},
	dropdown: {
		flex: 1,
		flexDirection: 'column',
		height: 40,
		marginTop: 16,
		alignSelf: 'flex-end',
		position: 'absolute',
		...Platform.select({
			ios: { marginTop: 40 },
			android: {}
		})
	},
	dropdownView: {
		flex: 1,
		backgroundColor: 'rgba(255,255,255,0.2)',
		height: 80,
		marginEnd: 11,
		textAlign: 'center'
	},
	dropItemView: {
		height: 40,
		textAlignVertical: 'center',
		fontSize: 16,
		...sharedStyles.textSemibold,
		textAlign: 'center',
		color: '#ffffff',
		marginHorizontal: 14,
		...Platform.select({
			ios: { lineHeight: 35 },
			android: {}
		})
	},
	dropdownText: {
		fontSize: 16,
		...sharedStyles.textSemibold,
		color: '#ffffff',
		textAlign: 'center'
	},
	dropWrap: {
		flexDirection: 'row'
	},
	dropButton: {
		flexDirection: 'row',
		marginVertical: 8,
		marginStart: 12,
		fontSize: 18,
		...sharedStyles.textSemibold
	},
	dropIcon: {
		marginTop: 8,
		marginEnd: 11
	},
	dropdownTextHighlight: {
		flex: 1,
		backgroundColor: '#53a3fd',
		color: '#FFFFFF'
	},
	welcome: {
		fontSize: 24,
		marginHorizontal: 35,
		marginTop: 82,
		marginBottom: 52,
		lineHeight: 32,
		...sharedStyles.textSemibold
	},
	tabWrapper: {
		flexDirection: 'row',
		borderTopLeftRadius: 26,
		borderTopRightRadius: 26
	},
	tabContainer: {
		flex: 1,
		height: 58,
		alignContent: 'center',
		alignItems: 'center',
		justifyContent: 'center'
	},
	tab: {
		flex: 1,
		fontSize: 18,
		paddingTop: 13,
		lineHeight: 24,
		textAlign: 'center'
	},
	activeTab: {
		...sharedStyles.textSemibold,
		textAlign: 'center'
	},
	activeTabLine: {
		position: 'absolute',
		width: 20,
		height: 4,
		bottom: 16,
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8
	},
	inputContainer: {
		marginVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	loginButton: {
		marginTop: 42,
		height: 40,
		borderRadius: 8
	},
	label: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textSemibold
	},
	areaCodeWrapper: {
		flexDirection: 'row',
		height: 48,
		fontSize: 16,
		padding: 14,
		paddingLeft: 0,
		borderWidth: 0
	},
	input: {
		...sharedStyles.textRegular,
		height: 48,
		fontSize: 16,
		padding: 14,
		paddingLeft: 0,
		borderWidth: 0,
		width: 300
	},
	button: {
		height: 38
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
	policyContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	checkbox: {
		borderRadius: 50,
		borderColor: rgba(0, 0, 0, 0.2)
	},
	text: {
		fontSize: 14,
		marginStart: 5
	},
	policyText: {
		color: '#2878FF'
	}
});
