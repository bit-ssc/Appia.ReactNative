import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	status: {
		backgroundColor: '#fff',
		padding: 12,
		margin: 8,
		borderRadius: 4
	},
	title: {
		fontSize: 14,
		fontWeight: 'bold',
		lineHeight: 20,
		marginBottom: 12
	},
	stars: {
		flexDirection: 'row'
	},
	userWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
		borderRadius: 10,
		paddingLeft: 2,
		paddingRight: 6,
		marginRight: 8
	},
	avatar: {
		borderRadius: 7,
		width: 14,
		height: 14
	},
	name: {
		marginLeft: 4,
		fontSize: 12,
		lineHeight: 17,
		color: 'rgba(0, 0, 0, 0.6)'
	}
});
