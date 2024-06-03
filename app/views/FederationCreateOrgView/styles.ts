import { StyleSheet } from 'react-native';
import { rgba } from 'color2k';

export default StyleSheet.create({
	titleContainer: {
		backgroundColor: '#FAFAFA',
		paddingHorizontal: 16,
		paddingVertical: 12
	},
	itemContainer: {
		padding: 16,
		flexDirection: 'row',
		marginTop: 4,
		backgroundColor: '#FAFAFA'
	},
	contentText: {
		textAlign: 'right',
		flex: 1,
		fontSize: 14,
		color: rgba(0, 0, 0, 0.4)
	},
	text: {
		fontSize: 14,
		color: rgba(0, 0, 0, 0.9),
		lineHeight: 22
	},
	placeHolder: {
		fontSize: 16,
		color: rgba(0, 0, 0, 0.4),
		lineHeight: 24
	}
});
