import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAFAFA'
	},
	headerWrapper: {
		flex: 1,
		marginVertical: 20,
		marginHorizontal: 16,
		alignItems: 'center'
	},
	shadow: {
		shadowColor: 'rgba(0, 0, 0, 0.05)',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 0.5,
		borderRadius: 4
	},
	header: {
		width: 240,
		paddingVertical: 32,
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerTextContainer: {
		flex: 1
	},
	headerUsername: {
		flex: 1,
		justifyContent: 'space-between'
	},
	username: {
		fontSize: 18,
		lineHeight: 28,
		...sharedStyles.textRegular
	},
	companyName: {
		fontSize: 14,
		lineHeight: 20,
		color: 'rgba(0, 0, 0, 0.4)',
		...sharedStyles.textRegular
	},
	avatar: {
		marginRight: 12
	},
	loadButtonContainer: {
		paddingTop: 30,
		justifyContent: 'center',
		alignItems: 'center'
	},
	roomButton1: {
		width: 320,
		height: 40,
		flex: 1,
		flexDirection: 'row',
		borderWidth: 1,
		borderColor: '#2878FF',
		borderRadius: 4,
		textAlign: 'center',
		alignItems: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		marginHorizontal: 16
	},
	QD_codeContainer: {
		width: 240,
		height: 240,
		marginBottom: 40
	},
	QD_code: {
		flex: 1,
		width: 240,
		height: 240
	},
	ButtonText: {
		fontSize: 16,
		color: '#2878FF',
		fontFamily: 'PingFang SC'
	}
});
