import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { connect } from 'react-redux';

import { ThemeContext } from '../theme';
import { ModalAnimation, StackAnimation, defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
// Outside Stack
// import NewServerView from '../views/NewServerView';
import WorkspaceView from '../views/WorkspaceView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import SendEmailConfirmationView from '../views/SendEmailConfirmationView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';
import { OutsideModalParamList, OutsideParamList } from './types';
import AreaCodeView from '../views/AreaCodeView';
import VerificationCodeView from '../views/VerificationCodeView';
import WebPageView from '../views/WebPageView';
import SimpleWebView from '../views/SimpleWebView';

// Outside
const Outside = createStackNavigator<OutsideParamList>();
const _OutsideStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}>
			{/* <Outside.Screen name='NewServerView' component={NewServerView} options={NewServerView.navigationOptions} /> */}
			<Outside.Screen name='LoginView' component={LoginView} options={{ headerShown: false }} />
			<Outside.Screen name='WorkspaceView' component={WorkspaceView} options={WorkspaceView.navigationOptions} />
			<Outside.Screen name='ForgotPasswordView' component={ForgotPasswordView} />
			<Outside.Screen name='SendEmailConfirmationView' component={SendEmailConfirmationView} />
			<Outside.Screen name='RegisterView' component={RegisterView} options={RegisterView.navigationOptions} />
			<Outside.Screen name='LegalView' component={LegalView} />
			<Outside.Screen name={'SimpleWebView'} component={SimpleWebView} />
		</Outside.Navigator>
	);
};

const mapStateToProps = (state: any) => ({
	root: state.app.root
});

const OutsideStack = connect(mapStateToProps)(_OutsideStack);

// OutsideStackModal
const OutsideModal = createStackNavigator<OutsideModalParamList>();
const OutsideStackModal = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<OutsideModal.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...ModalAnimation, presentation: 'transparentModal' }}
		>
			<OutsideModal.Screen name='OutsideStack' component={OutsideStack} options={{ headerShown: false }} />
			<OutsideModal.Screen name='AreaCodeView' component={AreaCodeView} />
			<OutsideModal.Screen name='WebPageView' component={WebPageView} />
			<OutsideModal.Screen name='VerificationCodeView' component={VerificationCodeView} />
			<OutsideModal.Screen
				name='AuthenticationWebView'
				component={AuthenticationWebView}
				options={AuthenticationWebView.navigationOptions}
			/>
		</OutsideModal.Navigator>
	);
};

export default OutsideStackModal;
