import React, { PureComponent } from 'react';
import { ColorValue, Modal, Platform, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

export type DialogInputProps = {
	isDialogVisible: boolean;
	title?: string;
	message?: string;
	hintInput?: string;
	initValueTextInput?: string;
	cancelText?: string;
	submitText?: string;
	placeholderTextColor?: ColorValue;
	animationType?: any;
	textInputProps?: TextInputProps;
	modalStyle?: {};
	dialogStyle?: {};
	submitInput: Function;
	closeDialog: Function;
};

interface DialogInputState {
	inputModal?: string;
	openning?: boolean;
}

class DialogInput extends PureComponent<DialogInputProps, DialogInputState> {
	constructor(props: DialogInputProps) {
		super(props);
		this.state = { inputModal: props.initValueTextInput, openning: true };
	}

	handleOnRequestClose = () => {
		this.props.closeDialog();
		this.setState({ inputModal: '' });
	};

	handleOnKeyPress = () => {
		this.setState({ openning: false });
	};

	handleOnChangeText = (inputModal: string) => {
		this.setState({ inputModal, openning: false });
	};

	handleOnCloseDialog = () => {
		this.props.closeDialog();
		this.setState({ inputModal: '', openning: true });
	};

	handleSubmit = () => {
		this.props.submitInput(this.state.inputModal);
		this.setState({ inputModal: '', openning: true });
	};

	render() {
		const title = this.props.title || '';
		const hintInput = this.props.hintInput || '';
		let value = '';
		if (!this.state.openning) {
			value = this.state.inputModal || '';
		} else {
			value = this.props.initValueTextInput ? this.props.initValueTextInput : '';
		}

		const textProps = this.props.textInputProps || null;
		const modalStyleProps = this.props.modalStyle || {};
		const dialogStyleProps = this.props.dialogStyle || {};
		const { placeholderTextColor } = this.props;
		const animationType = this.props.animationType || 'fade';
		let cancelText = this.props.cancelText || 'Cancel';
		let submitText = this.props.submitText || 'Submit';
		cancelText = Platform.OS === 'ios' ? cancelText : cancelText.toUpperCase();
		submitText = Platform.OS === 'ios' ? submitText : submitText.toUpperCase();

		return (
			<Modal
				animationType={animationType}
				transparent={true}
				visible={this.props.isDialogVisible}
				onRequestClose={this.handleOnRequestClose}
			>
				<View style={[styles.container, { ...modalStyleProps }]}>
					<TouchableOpacity style={styles.container} activeOpacity={1} onPress={this.handleOnCloseDialog}>
						<View style={[styles.modal_container, { ...dialogStyleProps }]}>
							<View style={styles.modal_body}>
								<Text style={styles.title_modal}>{title}</Text>
								<Text style={[this.props.message ? styles.message_modal : { height: 0 }]}>{this.props.message}</Text>
								<TextInput
									style={styles.input_container}
									autoCorrect={!(textProps && textProps.autoCorrect)}
									autoCapitalize={textProps && textProps.autoCapitalize ? textProps.autoCapitalize : 'none'}
									clearButtonMode={textProps && textProps.clearButtonMode ? textProps.clearButtonMode : 'never'}
									clearTextOnFocus={textProps && textProps.clearTextOnFocus ? textProps.clearTextOnFocus : false}
									keyboardType={textProps && textProps.keyboardType ? textProps.keyboardType : 'default'}
									secureTextEntry={textProps && textProps.secureTextEntry ? textProps.secureTextEntry : false}
									// maxLength={textProps && textProps.maxLength > 0 ? textProps.maxLength : undefined}
									autoFocus={true}
									onKeyPress={this.handleOnKeyPress}
									underlineColorAndroid='transparent'
									placeholder={hintInput}
									placeholderTextColor={placeholderTextColor}
									onChangeText={this.handleOnChangeText}
									value={value}
									selectionColor={placeholderTextColor}
								/>
							</View>
							<View style={styles.btn_container}>
								<TouchableOpacity style={styles.touch_modal} onPress={this.handleOnCloseDialog}>
									<Text style={styles.btn_modal_left}>{cancelText}</Text>
								</TouchableOpacity>
								<View style={styles.divider_btn}></View>
								<TouchableOpacity style={styles.touch_modal} onPress={this.handleSubmit}>
									<Text style={[styles.btn_modal_right, { color: this.state.inputModal ? '#1B5BFF' : 'rgba(27,91,255,0.4)' }]}>
										{submitText}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</TouchableOpacity>
				</View>
			</Modal>
		);
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		...Platform.select({
			android: {
				backgroundColor: 'rgba(0,0,0,0.2)'
			}
		})
	},
	modal_container: {
		marginLeft: 30,
		marginRight: 30,
		...Platform.select({
			ios: {
				backgroundColor: '#E3E6E7',
				borderRadius: 10,
				minWidth: 300
			},
			android: {
				backgroundColor: '#fff',
				elevation: 24,
				minWidth: 280,
				borderRadius: 5
			}
		})
	},
	modal_body: {
		...Platform.select({
			ios: {
				padding: 10
			},
			android: {
				padding: 24
			}
		})
	},
	title_modal: {
		fontWeight: 'bold',
		fontSize: 20,
		color: '#333',
		...Platform.select({
			ios: {
				marginTop: 10,
				textAlign: 'center',
				marginBottom: 5
			},
			android: {
				textAlign: 'center'
			}
		})
	},
	message_modal: {
		fontSize: 16,
		...Platform.select({
			ios: {
				textAlign: 'center',
				marginBottom: 10
			},
			android: {
				textAlign: 'left',
				marginTop: 20
			}
		})
	},
	input_container: {
		textAlign: 'left',
		fontSize: 16,
		color: 'rgba(0,0,0,0.54)',
		borderWidth: 1,
		selectionColor: '#000',
		...Platform.select({
			ios: {
				backgroundColor: 'white',
				borderRadius: 5,
				paddingTop: 5,
				borderColor: '#B0B0B0',
				paddingBottom: 5,
				paddingLeft: 10,
				marginBottom: 15,
				marginTop: 10
			},
			android: {
				marginTop: 8,
				borderColor: '#E5E5E5'
			}
		})
	},
	btn_container: {
		flex: 1,
		flexDirection: 'row',
		...Platform.select({
			ios: {
				justifyContent: 'center',
				borderTopWidth: 1,
				borderColor: '#B0B0B0',
				maxHeight: 48
			},
			android: {
				alignSelf: 'flex-end',
				maxHeight: 52,
				paddingTop: 8
			}
		})
	},
	divider_btn: {
		...Platform.select({
			ios: {
				width: 1,
				backgroundColor: '#B0B0B0'
			},
			android: {
				width: 0
			}
		})
	},
	touch_modal: {
		flex: 1,
		borderTopWidth: 1,
		borderStartWidth: 0.5,
		borderEndWidth: 0.5,
		borderColor: '#ccc',
		...Platform.select({
			ios: {
				flex: 1
			},
			android: {
				paddingRight: 8,
				minWidth: 64
			}
		})
	},
	btn_modal_left: {
		color: '#1B5BFF',
		borderColor: '#B0B0B0',
		textAlign: 'center',
		fontSize: 18,
		...Platform.select({
			ios: {
				borderRightWidth: 5,
				padding: 10,
				height: 48,
				fontWeight: 'bold'
			},
			android: {
				padding: 8,
				fontWeight: 'bold'
			}
		})
	},
	btn_modal_right: {
		color: '#1B5BFF',
		textAlign: 'center',
		fontSize: 18,
		...Platform.select({
			ios: {
				padding: 10,
				fontWeight: 'bold'
			},
			android: {
				padding: 8,
				fontWeight: 'bold'
			}
		})
	}
});
export default DialogInput;
