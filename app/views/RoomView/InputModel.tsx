import React, { useState, useCallback, useRef } from 'react';
import { Text, View, TextInput, StyleSheet } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';

import { isAndroid } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import Button from '../../containers/Button/index';

interface IProps {
	title?: string;
	message?: string;
	placeholder?: string;
	closePress?: () => void;
	okPress?: (text: string) => void;
}

const InputModal: React.FC<IProps> = props => {
	const { closePress, okPress, message } = props;
	const [inputText, setInputText] = useState<string>(message || '');
	const [keyboardVisible, setKeybordVisible] = useState(false);
	const refInput = useRef(null);

	const confirm = () => {
		okPress && okPress(inputText);
	};

	const onChange = useCallback(e => {
		setInputText(e.nativeEvent.text);
	}, []);

	const centerView = () => (
		<View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
			<View style={styles.modalView}>
				<Text style={styles.modalTitle}>{props.title ? props.title : '标题'}</Text>
				<View style={styles.modalForm}>
					<TextInput
						ref={refInput}
						onFocus={() => setKeybordVisible(true)}
						onBlur={() => setKeybordVisible(false)}
						keyboardType='default'
						autoFocus={keyboardVisible}
						value={inputText}
						onChange={onChange}
						style={styles.modalInput}
						multiline
						maxLength={2000}
						placeholder={props.placeholder ? props.placeholder : '请输入...'}
					/>
				</View>
				<View style={styles.modalFooter}>
					<Button
						style={styles.modalButton}
						title={I18n.t('Cancel')}
						type='secondary'
						onPress={() => {
							closePress && closePress();
						}}
					/>
					<View style={styles.splitLine}></View>
					<Button style={styles.modalButton} title={I18n.t('Confirmation')} type='secondary' color='#2878FF' onPress={confirm} />
				</View>
			</View>
		</View>
	);

	const renderContent = () => <View style={styles.centeredView}>{centerView()}</View>;

	if (keyboardVisible && !isAndroid) {
		return (
			<View style={styles.centeredView}>
				<KeyboardAccessoryView kbInputRef={refInput} renderContent={centerView} />
			</View>
		);
	}
	return renderContent();
};

const styles = StyleSheet.create({
	// feedback
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)'
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

export default InputModal;
