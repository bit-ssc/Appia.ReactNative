import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import I18n from 'i18n-js';

import { themes } from '../lib/constants';
import sharedStyles from '../views/Styles';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import KeyboardView from './KeyboardView';
import { useTheme } from '../theme';
import StatusBar from './StatusBar';
import AppVersion from './AppVersion';
import { isTablet } from '../lib/methods/helpers';
import SafeAreaView from './SafeAreaView';

interface IFormContainer extends ScrollViewProps {
	testID: string;
	children: React.ReactElement | React.ReactElement[] | null;
	handlerForgetPassword?: () => void;
}

const styles = StyleSheet.create({
	scrollView: {
		minHeight: '100%'
	}
});

export const FormContainerInner = ({ children }: { children: (React.ReactElement | null)[] }) => (
	<View style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]}>{children}</View>
);

const FormContainer = ({ children, testID, handlerForgetPassword, ...props }: IFormContainer) => {
	const { theme } = useTheme();

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].backgroundColor }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<ScrollView
				style={sharedStyles.container}
				contentContainerStyle={[sharedStyles.containerScrollView, styles.scrollView]}
				{...scrollPersistTaps}
				{...props}
			>
				<SafeAreaView testID={testID} style={{ backgroundColor: themes[theme].backgroundColor }}>
					<KeyboardAvoidingView behavior={'position'} keyboardVerticalOffset={0}>
						{children}
						<View style={{ flexDirection: 'row' }}>
							<AppVersion theme={theme} />
							<TouchableOpacity
								onPress={() => handlerForgetPassword && handlerForgetPassword()}
								style={{ paddingHorizontal: 32 }}
							>
								<Text style={{ fontSize: 12, color: '#205DFF' }}>{I18n.t('Forgot_password')}</Text>
							</TouchableOpacity>
						</View>
					</KeyboardAvoidingView>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default FormContainer;
