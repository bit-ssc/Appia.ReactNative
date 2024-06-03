import { StyleSheet, Platform } from 'react-native';
import { rgba } from 'color2k';

export default StyleSheet.create({
	itemContainer: {
		marginTop: 8,
		paddingHorizontal: 16,
		width: '100%',
		flexDirection: 'row',
		backgroundColor: '#FAFAFA',
		...Platform.select({
			ios: { paddingVertical: 8 },
			android: { paddingVertical: 4 }
		})
	},
	tipContainer: {
		paddingHorizontal: 12,
		paddingVertical: 8
	},
	title: {
		fontSize: 16,
		color: rgba(0, 0, 0, 0.9)
	},
	tag: {
		marginStart: 16,
		borderRadius: 4,
		borderColor: '#DCDCDC',
		borderWidth: 1,
		paddingHorizontal: 4,
		fontSize: 12,
		color: rgba(0, 0, 0, 0.4)
	},
	type: {
		fontSize: 14,
		marginTop: 4,
		color: rgba(0, 0, 0, 0.4)
	},
	add: {
		padding: 16,
		marginTop: 4,
		flexDirection: 'row',
		justifyContent: 'space-between',
		backgroundColor: '#FAFAFA'
	}
});
