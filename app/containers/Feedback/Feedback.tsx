import React, { useState, useCallback, useRef } from 'react';
import { Text, View, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';

import { FeedbackHeaderIcon } from '../Icon/Feedback';
import Navigation from '../../lib/navigation/appNavigation';
import { saveFeedback } from '../../lib/services/restApi';
import { showToast } from '../../lib/methods/helpers/showToast';
import { getUserSelector } from '../../selectors/login';
import { IApplicationState } from '../../definitions';
import { isAndroid } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import Button from '../Button';
import styles from './styles';

interface IProps {
	closeModal: () => void;
}

const FeedbackModal: React.FC<IProps> = props => {
	const { closeModal } = props;
	const [feedbackText, setFeedbackText] = useState('');
	const [keyboardVisible, setKeybordVisible] = useState(false);
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const refInput = useRef(null);
	let isFetch = false;

	const confirm = async (): Promise<void> => {
		if (isFetch) {
			return;
		}
		if (!feedbackText.trim()) {
			return showToast(I18n.t('Feedback_Placeholder'));
		}
		const params = Navigation.navigationRef.current?.getCurrentRoute()?.params;
		const data = {
			user_info: {
				user_id: user?.id,
				user_name: user?.username
			},
			content: {
				feedback: feedbackText,
				page: `${Navigation.routeNameRef.current}`,
				pageParams: { rid: params?.rid },
				appiaVersion: DeviceInfo.getVersion(),
				brand: DeviceInfo.getBrand(),
				osVersion: DeviceInfo.getSystemVersion(),
				isLandscape: DeviceInfo.isLandscapeSync(),
				model: DeviceInfo.getModel(),
				platform: isAndroid ? `android-${DeviceInfo.getBrand()}` : 'ios'
			}
		};
		isFetch = true;
		try {
			await saveFeedback(data);
			isFetch = false;
			showToast(I18n.t('Save_Successfully'));
			closeModal();
		} catch (e) {
			isFetch = false;
			showToast(I18n.t('Save_Failed'));
		}
	};

	const onChange = useCallback(e => {
		setFeedbackText(e.nativeEvent.text);
	}, []);

	const renderContent = () => (
		<View style={styles.centeredView}>
			<View style={styles.modalView}>
				<FeedbackHeaderIcon style={styles.modalHeaderIcon} />
				<Text style={styles.modalTitle}>{I18n.t('Feedback')}</Text>
				<View style={styles.modalForm}>
					<TextInput
						ref={refInput}
						onFocus={() => setKeybordVisible(true)}
						onBlur={() => setKeybordVisible(false)}
						keyboardType='default'
						autoFocus={keyboardVisible}
						value={feedbackText}
						onChange={onChange}
						style={styles.modalInput}
						multiline
						maxLength={2000}
						placeholder={I18n.t('Feedback_Placeholder')}
					/>
				</View>
				<View style={styles.modalFooter}>
					<Button style={styles.modalButton} title={I18n.t('Cancel')} type='secondary' onPress={closeModal} />
					<View style={styles.splitLine}></View>
					<Button style={styles.modalButton} title={I18n.t('Confirmation')} type='secondary' color='#2878FF' onPress={confirm} />
				</View>
			</View>
		</View>
	);

	if (keyboardVisible && !isAndroid) {
		return <KeyboardAccessoryView kbInputRef={refInput} renderContent={renderContent} />;
	}
	return renderContent();
};

export default FeedbackModal;
