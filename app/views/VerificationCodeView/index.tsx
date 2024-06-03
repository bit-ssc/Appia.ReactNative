import React, { useCallback, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as HeaderButton from '../../containers/HeaderButton';
import I18n from '../../i18n';
import { IAreaCode } from '../../lib/services/common';

const VerificationCodeView: React.FC = () => {
	const { goBack, setOptions } = useNavigation();

	const { params } = useRoute();
	const { uri, onChange } = params as { uri: string; onChange: (option: IAreaCode) => {} };
	const onMessage = useCallback((event: WebViewMessageEvent) => {
		const res = JSON.parse(event.nativeEvent.data);
		onChange && onChange(res);
		goBack();
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			headerLeft: () => <HeaderButton.BackButton onPress={goBack} />,
			title: I18n.t('Verification_Code')
		});
		// eslint-disable-next-line
	}, []);

	return (
		<SafeAreaView testID='verification-code-view'>
			<StatusBar />
			<WebView
				style={{ flex: 0, minHeight: '100%' }}
				containerStyle={{ marginBottom: 1 }}
				source={{ uri }}
				onMessage={onMessage}
			/>
		</SafeAreaView>
	);
};

export default VerificationCodeView;
