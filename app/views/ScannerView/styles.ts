import { Dimensions, StyleSheet } from 'react-native';

export default StyleSheet.create({
	parent: {
		backgroundColor: '#fff',
		width: '100%',
		height: '100%'
	},
	bottomContent: {
		position: 'absolute',
		bottom: 48,
		width: 82,
		height: 82
	},
	loadingContainer: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		backgroundColor: 'rgba(255,255,255,0.8)'
	},
	loading: {
		start: '45%',
		top: '45%'
	},
	container: {
		backgroundColor: '#000000'
	},
	camera: {
		height: Dimensions.get('window').height
	},
	stateContainer: {
		width: '100%',
		height: '100%',
		backgroundColor: '#ffffff',
		alignItems: 'center',
		justifyContent: 'center'
	},
	text: {
		marginTop: 30
	},
	customMarkerContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent'
	},
	customMarker: {
		height: 250,
		width: 250,
		borderWidth: 2,
		borderColor: 'transparent',
		backgroundColor: 'transparent'
	},
	topLeftCorner: {
		position: 'absolute',
		top: 0,
		left: 0,
		borderLeftWidth: 4,
		borderTopWidth: 4,
		width: 40,
		height: 40,
		borderColor: 'white'
	},
	topRightCorner: {
		position: 'absolute',
		top: 0,
		right: 0,
		borderRightWidth: 4,
		borderTopWidth: 4,
		width: 40,
		height: 40,
		borderColor: 'white'
	},
	bottomLeftCorner: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		borderLeftWidth: 4,
		borderBottomWidth: 4,
		width: 40,
		height: 40,
		borderColor: 'white'
	},
	bottomRightCorner: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		borderRightWidth: 4,
		borderBottomWidth: 4,
		width: 40,
		height: 40,
		borderColor: 'white'
	}
});
