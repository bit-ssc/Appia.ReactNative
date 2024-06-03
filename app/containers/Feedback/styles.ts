import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	btnFeedback: {
		// width: 40,
		// height: 40,
		// borderRadius: 40,
		// backgroundColor: '#555555',
		position: 'absolute',
		zIndex: 1
	},
	collapseIcon: {
		position: 'absolute',
		right: 0,
		bottom: 100,
		zIndex: 1
	},

	// feedback
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
		// backgroundColor: 'rgba(0, 0, 0, 0.6)'
	},
	modalView: {
		width: '80%',
		backgroundColor: 'white',
		borderRadius: 12,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5
	},
	modalHeaderIcon: {
		marginTop: -30
		// transform: [{ translateY: -30 }]
	},
	modalTitle: {
		marginTop: 8,
		fontWeight: '600',
		fontSize: 16,
		textAlign: 'center'
	},
	modalForm: {
		width: '100%',
		marginTop: 16,
		marginBottom: 36,
		paddingLeft: 20,
		paddingRight: 20
	},
	modalInput: {
		height: 100,
		paddingHorizontal: 12,
		paddingTop: 12,
		paddingBottom: 12,
		fontSize: 14,
		lineHeight: 22,
		textAlignVertical: 'top',
		borderRadius: 12,
		backgroundColor: '#F0F2F4'
	},
	modalFooter: {
		flexDirection: 'row',
		borderTopWidth: 1,
		borderColor: '#E7E7E7'
	},
	modalButton: {
		flex: 1,
		marginBottom: 0,
		borderRadius: 12
	},
	splitLine: {
		width: 1,
		height: '100%',
		backgroundColor: '#E7E7E7'
	}
});
