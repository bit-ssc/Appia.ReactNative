import { Dimensions, Platform, StyleSheet } from 'react-native';
import { rgba } from 'color2k';

import sharedStyles from '../../views/Styles';
import { isTablet } from '../../utils/deviceInfo';

const screen = Dimensions.get('window');
export default StyleSheet.create({
	modalView: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: rgba(0, 0, 0, 0.2)
	},
	container: {
		alignItems: 'center',
		flexDirection: 'column',
		justifyContent: 'space-between',
		width: isTablet ? screen.width * 0.425 : screen.width * 0.85
	},
	img: {
		position: 'absolute'
	},
	header: {
		width: '100%',
		paddingStart: 20,
		marginTop: 90
	},
	title: {
		fontSize: 28,
		lineHeight: 32,
		...sharedStyles.textSemibold
	},
	text: {
		fontSize: 16,
		lineHeight: 32,
		...sharedStyles.textSemibold
	},
	content: {
		width: '100%',
		marginTop: 80,
		marginBottom: 20,
		paddingStart: 20
	},
	tip: {
		fontSize: 16,
		lineHeight: 25,
		marginStart: 16,
		...sharedStyles.textSemibold
	},
	note: {
		fontSize: 16,
		lineHeight: 25,
		marginHorizontal: 30,
		...Platform.select({
			ios: {
				fontFamily: 'System'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif'
			}
		})
	},
	buttonContainer: {
		width: '100%',
		paddingHorizontal: 38,
		flexDirection: 'column'
	},
	update: {
		borderRadius: 8,
		marginBottom: 12
	},
	reject: {
		backgroundColor: '#00000000'
	},
	loadingContainer: {
		height: 100,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 30
	},
	installButton: {
		width: 270,
		borderRadius: 4,
		marginBottom: 12
	},
	progressbar: {
		marginTop: 50
	},
	loadingText: {
		marginTop: 30,
		fontSize: 16,
		lineHeight: 25,
		...sharedStyles.textSemibold
	},
	installText: {
		marginTop: 12,
		marginBottom: 12,
		fontSize: 16,
		...sharedStyles.textSemibold
	}
});
