import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { WebView } from 'react-native-webview';

import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';

const SimpleWebView = (): React.ReactElement => {
	const { goBack, setOptions } = useNavigation();

	const { params } = useRoute();
	const { url, title } = params as { url: string; title: string };

	useEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			headerLeft: () => <HeaderButton.BackButton onPress={goBack} />,
			title
		});
		// eslint-disable-next-line
	}, []);

	return (
		<SafeAreaView>
			<StatusBar />
			<WebView style={{ flex: 0, minHeight: '100%' }} containerStyle={{ marginBottom: 1 }} source={{ uri: url }} />
		</SafeAreaView>
	);
};

export default SimpleWebView;
