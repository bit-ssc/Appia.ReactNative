import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

const font = {
	fontSize: 16,
	lineHeight: 22
};

export default StyleSheet.create({
	container: {
		width: 250,
		borderRadius: 8,
		marginRight: 12
	},
	headerWrapper: {
		paddingVertical: 12,
		paddingHorizontal: 16
	},
	header: {
		...font,
		...sharedStyles.textSemibold,
		alignContent: 'center',
		justifyContent: 'center',
		alignItems: 'center',
		paddingRight: 4
	},
	tagWrapper: {
		paddingHorizontal: 4,
		alignSelf: 'center',
		justifyContent: 'center',
		color: '#1858D9',
		fontSize: 14,
		lineHeight: 16,
		paddingVertical: 2
	},
	tagWrapperMeeting: {
		...font,
		color: '#1858D9',
		marginLeft: 10
	},
	body: {
		paddingHorizontal: 16,
		paddingBottom: 4
	},
	row: {
		flexDirection: 'row',
		paddingBottom: 8
	},
	label: {
		...font,
		paddingRight: 12,
		minWidth: 76
	},
	value: {
		...font,
		flexWrap: 'wrap',
		flex: 1
	},
	valueTag: {
		...font
	},
	footerWrapper: {
		padding: 12,
		paddingHorizontal: 16,
		borderTopWidth: 1
	},
	footer: {
		...font,
		fontSize: 14
	},
	btnList: {
		paddingVertical: 12,
		marginHorizontal: 12,
		borderTopWidth: 1,
		display: 'flex',
		flexDirection: 'row'
	},
	btn: {
		flex: 1,
		height: 28,
		marginBottom: 0,
		borderRadius: 4
	},
	lexiangBody: {
		borderRadius: 4,
		overflow: 'hidden'
	},
	lexiangImage: {
		width: '100%',
		aspectRatio: 1.78
	},
	lexiangTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#000',
		marginBottom: 5
	},
	lexiangContent: {
		fontSize: 14,
		color: '#7c7d7f'
	},
	cloudDocContainer: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		backgroundColor: '#fff',
		alignItems: 'center',
		borderRadius: 8,
		marginTop: 4
	},
	cloudDocTitle: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		flex: 1
	},
	cloudDocContent: {
		padding: 16
	},
	titleText: {
		marginStart: 6,
		fontWeight: '400',
		color: '#1B5BFF',
		fontSize: 14,
		flex: 1
	},
	vcMsg: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		backgroundColor: '#fff',
		alignItems: 'center',
		borderRadius: 8,
		marginTop: 4,
		flexDirection: 'row'
	}
});
