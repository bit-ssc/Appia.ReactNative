import { dequal } from 'dequal';
import React from 'react';
import {
	Alert,
	Keyboard,
	NativeSyntheticEvent,
	StyleSheet,
	Text,
	TextInput as RNTextInput,
	TextInputChangeEventData,
	TouchableWithoutFeedback,
	View,
	Image,
	Animated
} from 'react-native';
import { connect } from 'react-redux';
import ModalDropdown from 'react-native-modal-dropdown';
import Touchable from 'react-native-platform-touchable';
import NetInfo from '@react-native-community/netinfo';
import { Checkbox } from 'react-native-ui-lib';

import Switching from '../../containers/Switching';
import { loginFailure, loginWithServer, setUser, switchLogin } from '../../actions/login';
import { ENTERPRISE, themes } from '../../lib/constants';
import Button from '../../containers/Button';
import FormContainer from '../../containers/FormContainer';
import { FormTextInput } from '../../containers/TextInput/FormTextInput';
import { IApplicationState, IBaseScreen } from '../../definitions';
import { LANGUAGES, setLanguage, default as I18n } from '../../i18n';
import { OutsideParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import { Select } from '../../containers/UIKit/Select2';
import { Enterprises } from '../../lib/constants/enterprise';
import UserPreferences from '../../lib/methods/userPreferences';
import DebugTouchable from '../../containers/DebugTouchable';
import styles from './styles';
import Navigation from '../../lib/navigation/appNavigation';
import { ActionType, Countdown } from '../../containers/CountDown';
import { sendCode } from '../../lib/services/common';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import { CustomIcon } from '../../containers/CustomIcon';
import { endNetworkTimer } from '../../lib/methods/networkTimer';
import { showToast } from '../../lib/methods/helpers/showToast';

interface ILoginViewProps extends IBaseScreen<OutsideParamList, 'LoginView'> {
	Site_Name: string;
	// Accounts_PasswordReset: boolean;
	isFetching: boolean;
	error: {
		error: string;
	};
	failure: boolean;
	loginRequest: Function;
	language: string;
	connecting: boolean;
	switching: boolean;
}

enum Tab {
	ldap = 'ldap',
	smsCode = 'smsCode'
}

export const PrivacyUrl = {
	Terms_of_Service: 'https://appia.cn/service/services-terms.html',
	Privacy_Policy: 'https://appia.cn/service/privacy.html',
	Forget_Password: 'https://pwdresetall.appia.vip/?from=appia'
};

interface ILoginViewState {
	user: string;
	password: string;
	enterprise: string;
	selectEnterprise: boolean;
	activeTab: Tab;
	phone: string;
	areaCode: string;
	code: string;
	networkIsConnecting: boolean;
	agreed: boolean;
}

class LoginView extends React.Component<ILoginViewProps, ILoginViewState> {
	private passwordInput: RNTextInput | null | undefined;
	private verificationCode: RNTextInput | null | undefined;
	private countdownRef = React.createRef<ActionType>();
	private pressTime: number | null = null;
	private tabs = [
		{
			label: 'LDAP',
			value: Tab.ldap
		},
		{
			label: 'Sms_Code',
			value: Tab.smsCode
		}
	];
	private readonly shakeAnimation: Animated.Value;

	constructor(props: ILoginViewProps) {
		super(props);
		let enterpriseInit = UserPreferences.getString(ENTERPRISE) || Enterprises[0].value;
		if (!enterpriseInit || enterpriseInit.length === 0) {
			enterpriseInit = 'https://appia.cn';
		}
		this.shakeAnimation = new Animated.Value(0);
		this.state = {
			enterprise: enterpriseInit,
			user: props.route.params?.username ?? '',
			password: '',
			selectEnterprise: true,
			activeTab: Tab.ldap,
			phone: '',
			code: '',
			areaCode: '+86',
			networkIsConnecting: true,
			agreed: false
		};
	}

	componentDidMount() {
		NetInfo.addEventListener(state => {
			this.setState({ networkIsConnecting: state.isConnected! });
		});
	}

	UNSAFE_componentWillReceiveProps(nextProps: ILoginViewProps) {
		const { error, dispatch } = this.props;

		// if (nextProps.failure) {
		// 	const enterprise = UserPreferences.getString(ENTERPRISE);
		// 	sdk.initialize(enterprise ?? 'https://appia.cn');
		// }
		dispatch(switchLogin(false));
		console.info('nextProps.failure=========', nextProps.failure);
		console.info('error=================', error);
		console.info('nextProps.error===========', nextProps.error);
		if (nextProps.failure && !dequal(error, nextProps.error)) {
			endNetworkTimer();

			if (nextProps.error?.error === 'error-invalid-email') {
				this.resendEmailConfirmation();
			} else {
				Alert.alert(I18n.t('Oops'), I18n.t('Login_error'));
			}
		}
	}

	countdownReset = () => {
		this.pressTime = null;
		this.countdownRef.current?.reset();
	};

	changeTabs = (activeTab: Tab) => () => {
		this.setState({ activeTab });
	};

	setEnterprise = (enterprise: string) => {
		this.setState({ enterprise });
		this.countdownReset();
		UserPreferences.setString(ENTERPRISE, enterprise);
	};

	changeEnterprise = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
		this.setState({ enterprise: e.nativeEvent.text });
		this.countdownReset();
	};

	login = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('LoginView', { title: Site_Name });
	};

	register = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('RegisterView', { title: Site_Name });
	};

	resendEmailConfirmation = () => {
		const { user } = this.state;
		const { navigation } = this.props;
		navigation.navigate('SendEmailConfirmationView', { user });
	};

	valid = () => {
		const { user, password, activeTab, phone, code } = this.state;

		if (activeTab === Tab.ldap) {
			return user.trim() && password.trim();
		}

		return phone.trim() && code.trim();
	};

	submit = () => {
		if (!this.valid()) {
			return;
		}

		Keyboard.dismiss();

		const { agreed } = this.state;
		if (!agreed) {
			this.startShake();
			return;
		}

		const { networkIsConnecting } = this.state;

		if (!networkIsConnecting) {
			showToast(I18n.t('NetworkError'));
			return;
		}

		const { user, password, enterprise, activeTab, phone, areaCode, code } = this.state;

		const { dispatch } = this.props;
		let params = {};

		switch (activeTab) {
			case Tab.ldap:
				params = { user, password, ldap: true };
				break;
			case Tab.smsCode:
				params = { phone, areaCode, code, smsCode: true };
				break;
		}
		dispatch(loginFailure({}));
		dispatch(loginWithServer(enterprise, params));
	};

	changeCountry = ({ areaCode }: { areaCode: string }) => {
		this.setState({ areaCode });
		this.countdownReset();
	};

	changePhone = (phone: string) => {
		this.setState({ phone });
		this.countdownReset();
	};

	onCountDownPress = () => {
		const { enterprise, phone } = this.state;

		if (!phone?.trim()) {
			EventEmitter.emit(LISTENER, { message: I18n.t('Phone_Number_Placeholder') });
			return false;
		}

		Navigation.navigate('VerificationCodeView', {
			uri: `${enterprise}/verification/sms-login?locale=${I18n.locale}&t=${Date.now()}`,
			onChange: this.fetchVerificationCode
		});
	};

	fetchVerificationCode = async (ic: unknown) => {
		const { enterprise, phone, areaCode } = this.state;

		const res = await sendCode(enterprise, {
			phone,
			areaCode,
			ic
		});

		if (!res.success) {
			EventEmitter.emit(LISTENER, { message: res.message || I18n.t('Get_Verification_Code_Error') });
			return Promise.reject();
		}

		this.pressTime = Date.now();
		this.countdownRef?.current?.restart();
	};

	openChangeCountryModal = () => {
		Navigation.navigate('AreaCodeView', {
			server: this.state.enterprise,
			onChange: this.changeCountry
		});
	};

	toggleSelectEnterprise = () =>
		this.setState(({ selectEnterprise, enterprise }) => {
			const result = {
				selectEnterprise: !selectEnterprise,
				enterprise
			};

			if (result.selectEnterprise) {
				result.enterprise = Enterprises[0].value;
				UserPreferences.setString(ENTERPRISE, result.enterprise);
			}

			return result;
		});

	renderUserForm = () => {
		const { user } = this.state;
		const { theme } = this.props;

		return (
			<>
				<FormTextInput
					label={I18n.t('Username')}
					containerStyle={[styles.inputContainer, { borderColor: themes[theme].separatorColor }]}
					inputStyle={styles.input}
					placeholder={I18n.t('Username_Placeholder')}
					keyboardType='default'
					returnKeyType='next'
					onChangeText={(value: string) => this.setState({ user: value })}
					onSubmitEditing={() => {
						this.passwordInput?.focus();
					}}
					testID='login-view-email'
					textContentType='username'
					autoCompleteType='username'
					value={user}
				/>
				<FormTextInput
					label={I18n.t('Password')}
					containerStyle={[styles.inputContainer, { borderColor: themes[theme].separatorColor }]}
					inputRef={e => {
						this.passwordInput = e;
					}}
					inputStyle={styles.input}
					placeholder={I18n.t('Password_Placeholder')}
					returnKeyType='send'
					secureTextEntry
					onSubmitEditing={this.submit}
					onChangeText={(value: string) => this.setState({ password: value })}
					testID='login-view-password'
					textContentType='password'
					autoCompleteType='password'
				/>
			</>
		);
	};

	renderSmsCodeForm = () => {
		const { phone, code, areaCode } = this.state;
		const { theme } = this.props;

		return (
			<>
				<FormTextInput
					label={I18n.t('Phone_Number')}
					containerStyle={[styles.inputContainer, { borderColor: themes[theme].separatorColor }]}
					inputStyle={styles.input}
					placeholder={I18n.t('Phone_Number_Placeholder')}
					keyboardType='numeric'
					returnKeyType='next'
					onChangeText={this.changePhone}
					onSubmitEditing={() => {
						this.verificationCode?.focus();
					}}
					testID='login-view-phone'
					textContentType='telephoneNumber'
					value={phone}
					addonBefore={
						<TouchableWithoutFeedback onPress={this.openChangeCountryModal}>
							<View style={[styles.areaCodeWrapper, { borderColor: themes[theme].headerBorder }]}>
								<Text style={{ fontSize: 16, color: themes[theme].auxiliaryText }}>{areaCode}</Text>
								<CustomIcon name='chevron-down' size={20} color={themes[theme].auxiliaryText} />
							</View>
						</TouchableWithoutFeedback>
					}
				/>
				{/* 添加空标签是为了防止密码输入框的隐藏文本属性（secureTextEntry）失效*/}
				<></>
				<FormTextInput
					label={I18n.t('Verification_Code')}
					containerStyle={[styles.inputContainer, { borderBottomWidth: 0 }]}
					inputContainerStyle={{ alignItems: 'flex-end' }}
					inputStyle={[styles.input, { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: themes[theme].separatorColor }]}
					placeholder={I18n.t('Verification_Code_Placeholder')}
					keyboardType='numeric'
					returnKeyType='send'
					onChangeText={(code: string) => this.setState({ code })}
					inputRef={e => {
						this.verificationCode = e;
					}}
					secureTextEntry={false}
					testID='login-view-code'
					value={code}
					addonAfter={
						<Countdown
							text={I18n.t('Get_Verification_Code')}
							ref={this.countdownRef}
							pressTime={this.pressTime}
							autoExecuted={false}
							onPress={this.onCountDownPress}
							testID='login-view-get-verification-code'
						/>
					}
				/>
			</>
		);
	};

	changeLanguage = (index: number) => {
		setLanguage(LANGUAGES[index].value);
		this.props.dispatch(setUser({ language: LANGUAGES[index].value }));
	};

	renderRow = (item: any, index: number) => (
		<Touchable onPress={() => this.changeLanguage(index)}>
			<Text style={styles.dropItemView}>{item}</Text>
		</Touchable>
	);

	startShake = () => {
		Animated.sequence([
			Animated.timing(this.shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(this.shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
			Animated.timing(this.shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(this.shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
		]).start();
	};

	checkPress = () => {
		const { agreed } = this.state;
		this.setState({
			agreed: !agreed
		});
	};

	policyPress = (url: string, title: string) => {
		if (!url) return;
		Navigation.navigate('SimpleWebView', {
			url,
			title
		});
	};

	handlerForgetPassWord = () => {
		const { agreed } = this.state;
		if (!agreed) {
			this.startShake();
			return;
		}
		Navigation.navigate('WebPageView', {
			url: PrivacyUrl.Forget_Password
		});
	};

	renderPolicy = () => {
		const { agreed } = this.state;
		return (
			<Animated.View style={{ transform: [{ translateX: this.shakeAnimation }] }}>
				<View style={styles.policyContainer}>
					<Checkbox
						value={agreed}
						style={styles.checkbox}
						size={18}
						onValueChange={() => this.checkPress()}
						iconColor={'#ffffff'}
						color={'#2878FF'}
						borderRadius={50}
					/>
					<Text style={styles.text}>
						{I18n.t('Read_Policy')}
						<Text
							style={styles.policyText}
							onPress={() => this.policyPress(PrivacyUrl.Terms_of_Service, I18n.t('Terms_of_Service'))}
						>
							{I18n.t('Terms_of_Service')}
						</Text>
						{I18n.t('and')}
						<Text style={styles.policyText} onPress={() => this.policyPress(PrivacyUrl.Privacy_Policy, I18n.t('Privacy_Policy'))}>
							{I18n.t('Privacy_Policy')}
						</Text>
					</Text>
				</View>
			</Animated.View>
		);
	};

	renderBadNetwork = () => (
		<View style={styles.connectedWrapper}>
			<Image source={require('../../static/images/error-circle-filled.png')} style={styles.errorNetworkIcon} />
			<Text style={styles.errorNetworkText}>{I18n.t('Network_Error')}</Text>
		</View>
	);

	render() {
		const { theme, isFetching, language, connecting, switching } = this.props;
		const { activeTab, enterprise, selectEnterprise, networkIsConnecting } = this.state;
		const enterprises = Enterprises.map(value => ({
			...value,
			label: I18n.t(value.label)
		}));
		const l = LANGUAGES.find(item => item.value === language);
		const map = {
			[Tab.ldap]: this.renderUserForm,
			[Tab.smsCode]: this.renderSmsCodeForm
		};

		if (switching) {
			return <Switching />;
		}
		return (
			<View style={{ flex: 1, backgroundColor: themes[theme].backgroundColor }}>
				<FormContainer
					contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
					testID='login-view'
					handlerForgetPassword={this.handlerForgetPassWord}
				>
					<Image source={require('../../static/images/login/login.png')} style={styles.containerBackground} />
					<ModalDropdown
						options={LANGUAGES.map(item => item.label)}
						style={[styles.dropdown]}
						textStyle={[styles.dropdownText, { color: themes[theme].buttonText }]}
						dropdownStyle={[styles.dropdownView]}
						renderRow={(item, index) => this.renderRow(item, index as unknown as number)}
						showsVerticalScrollIndicator={false}
					>
						<View style={[styles.dropWrap]}>
							<Text style={[styles.dropButton, { color: themes[theme].buttonText }]}>{l?.label}</Text>
							<CustomIcon name='chevron-down' size={20} color={themes[theme].buttonText} style={[styles.dropIcon]} />
						</View>
					</ModalDropdown>

					<Text style={[styles.welcome, { color: themes[theme].buttonText }]}>{I18n.t('Welcome_To_Appia')}</Text>
					<View style={[styles.tabWrapper, { backgroundColor: themes[theme].backgroundColor }]}>
						{this.tabs.map(({ value, label }) => (
							<TouchableWithoutFeedback key={value} onPress={this.changeTabs(value)}>
								<View style={styles.tabContainer}>
									<Text
										style={[
											activeTab === value && styles.activeTab,
											styles.tab,
											{ color: themes[theme][activeTab === value ? 'headerTitleColor' : 'headerTintColor'] }
										]}
									>
										{I18n.t(label)}
									</Text>
									{activeTab === value && (
										<View style={[styles.activeTabLine, { backgroundColor: themes[theme].buttonBackground }]} />
									)}
								</View>
							</TouchableWithoutFeedback>
						))}
					</View>

					<View style={{ paddingHorizontal: 32, paddingVertical: 24 }}>
						<DebugTouchable onPress={this.toggleSelectEnterprise}>
							<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t('Enterprise')}</Text>
						</DebugTouchable>

						{selectEnterprise ? (
							<Select options={enterprises} value={enterprise} onChange={this.setEnterprise} />
						) : (
							<RNTextInput
								style={[
									styles.input,
									{
										backgroundColor: themes[theme].backgroundColor,
										borderColor: themes[theme].separatorColor,
										borderBottomWidth: StyleSheet.hairlineWidth,
										color: themes[theme].titleText
									}
								]}
								value={enterprise}
								onChange={this.changeEnterprise}
							/>
						)}
						{map[activeTab] && map[activeTab]()}

						<Button
							title={I18n.t('Login')}
							type='primary'
							onPress={this.submit}
							testID='login-view-submit'
							loading={isFetching || connecting}
							disabled={!this.valid()}
							style={styles.loginButton}
						/>
						{this.renderPolicy()}
					</View>
				</FormContainer>
				{networkIsConnecting ? null : this.renderBadNetwork()}
			</View>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	Site_Name: state.settings.Site_Name as string,
	isFetching: state.login.isFetching,
	failure: state.login.failure,
	switching: state.login.switching,
	error: state.login.error && state.login.error.data,
	// Accounts_PasswordReset: state.settings.Accounts_PasswordReset as boolean,
	language: I18n.locale,
	connecting: state.server.connecting
});

export default connect(mapStateToProps)(withTheme(LoginView));
