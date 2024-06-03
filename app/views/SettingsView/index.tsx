import Clipboard from '@react-native-clipboard/clipboard';
import CookieManager from '@react-native-cookies/cookies';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Linking, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import RNFetchBlob from 'react-native-blob-util';
import RNFS from 'react-native-fs';

import { appStart } from '../../actions/app';
import { logout } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { LISTENER } from '../../containers/Toast';
import { RootEnum } from '../../definitions';
import I18n from '../../i18n';
import database from '../../lib/database';
import { useAppSelector } from '../../lib/hooks';
import { clearCache } from '../../lib/methods';
import { deleteAllAudioFiles } from '../../lib/methods/audioFile';
import EventEmitter from '../../lib/methods/helpers/events';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import { getUserSelector } from '../../selectors/login';
import { SettingsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import styles from './styles';
import { showToast } from '../../lib/methods/helpers/showToast';
import * as HeaderButton from '../../containers/HeaderButton';
import { logInfo } from '../../utils/log';
import { getReadableVersion, isAndroid } from '../../utils/deviceInfo';
import { PrivacyUrl } from '../LoginView';

type TLogScreenName = 'SE_GO_LANGUAGE' | 'SE_GO_DEFAULTBROWSER' | 'SE_GO_THEME' | 'SE_GO_PROFILE' | 'SE_GO_SECURITYPRIVACY';

// @ts-ignore
export const settingsViewNavigationOptions = ({ navigation }) => ({
	headerTitleAlign: 'center',
	headerLeft: () => (
		<HeaderButton.BackButton
			navigation={navigation}
			onPress={() => {
				navigation.goBack();
			}}
		></HeaderButton.BackButton>
	),
	title: I18n.t('Settings')
});

const SettingsView = (): React.ReactElement => {
	const { colors } = useTheme();
	const navigation = useNavigation<StackNavigationProp<SettingsStackParamList, 'SettingsView'>>();
	const dispatch = useDispatch();
	const userId = useAppSelector(state => getUserSelector(state).id);
	const { server, version } = useAppSelector(state => state.server);
	const user = useAppSelector(state => state.login.user);

	const checkCookiesAndLogout = async () => {
		const db = database.servers;
		const usersCollection = db.get('users');
		logInfo(server, 'logout log', 'info', 'logout', 'logout', user.id, user.username);
		try {
			const userRecord = await usersCollection.find(userId);
			if (userRecord.isFromWebView) {
				showConfirmationAlert({
					title: I18n.t('Clear_cookies_alert'),
					message: I18n.t('Clear_cookies_desc'),
					confirmationText: I18n.t('Clear_cookies_yes'),
					dismissText: I18n.t('Clear_cookies_no'),
					onPress: async () => {
						await CookieManager.clearAll(true);
						dispatch(logout());
					},
					onCancel: () => {
						dispatch(logout());
					}
				});
			} else {
				dispatch(logout());
			}
		} catch {
			// Do nothing: user not found
		}
	};

	const handleLogout = () => {
		logEvent(events.SE_LOG_OUT);
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_of_this_application'),
			confirmationText: I18n.t('Logout'),
			onPress: checkCookiesAndLogout
		});
	};

	const handleClearCache = () => {
		logEvent(events.SE_CLEAR_LOCAL_SERVER_CACHE);
		showConfirmationAlert({
			message: I18n.t('This_will_clear_all_your_offline_data'),
			confirmationText: I18n.t('Clear'),
			onPress: async () => {
				dispatch(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Clear_cache_loading') }));
				await deleteAllAudioFiles(server);
				await clearCache({ server });
				await FastImage.clearMemoryCache();
				await FastImage.clearDiskCache();
				Services.disconnect();
				dispatch(selectServerRequest(server));
				RNFS.unlink(`${RNFS.DocumentDirectoryPath}/uploads`)
					.then(() => {
						console.info('本地下载文件夹已删除');
					})
					.catch(error => {
						console.error(error.message);
					});
			}
		});
	};

	const navigateToScreen = (screen: keyof SettingsStackParamList) => {
		const screenName = screen.replace('View', '').toUpperCase();
		logEvent(events[`SE_GO_${screenName}` as TLogScreenName]);
		navigation.navigate(screen);
	};

	const saveToClipboard = async (content: string) => {
		await Clipboard.setString(content);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	const copyServerVersion = () => {
		const vers = version as string;
		logEvent(events.SE_COPY_SERVER_VERSION, { serverVersion: vers });
		saveToClipboard(vers);
	};

	const copyAppVersion = () => {
		logEvent(events.SE_COPY_APP_VERSION, { appVersion: getReadableVersion });
		saveToClipboard(getReadableVersion);
	};

	const versionCompare = (oldVerison: string, newVerison: string) => oldVerison.toLowerCase() < newVerison.toLowerCase();

	const getLastestVersion = async () => {
		try {
			await RNFetchBlob.fetch(
				'get',
				`https://appia.cn/appia_be/v1/api/appia_latest_version?status=1&platform=android&versionName=${getReadableVersion}`
			).then(res => {
				const { data } = res.json();
				if (data) {
					const haveNewVersion = versionCompare(getReadableVersion, data[0]?.version);
					if (haveNewVersion) {
						Linking.openURL(
							isAndroid ? `https://appia.cn/appia_fe/download` : 'https://apps.apple.com/cn/app/appia/id1630882554'
						);
					} else {
						showToast(I18n.t('Latest_Version'));
					}
				} else {
					showToast(I18n.t('Latest_Version_Not_Found'));
				}
			});
		} catch (error) {
			console.info(error);
		}
	};

	const logoutOtherLocations = () => {
		logEvent(events.PL_OTHER_LOCATIONS);
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_from_other_locations'),
			confirmationText: I18n.t('Logout'),
			onPress: async () => {
				try {
					await Services.logoutOtherLocations();
					EventEmitter.emit(LISTENER, { message: I18n.t('Logged_out_of_other_clients_successfully') });
				} catch {
					logEvent(events.PL_OTHER_LOCATIONS_F);
					EventEmitter.emit(LISTENER, { message: I18n.t('Logout_failed') });
				}
			}
		});
	};

	const goSimpleWebView = (url: string, title: string) => {
		navigation.navigate('SimpleWebView', { url, title });
	};

	return (
		<SafeAreaView testID='settings-view'>
			<StatusBar />
			<List.Container style={styles.container}>
				<List.Section style={styles.container}>
					<List.Item
						title='Language'
						onPress={() => navigateToScreen('LanguageView')}
						showActionIndicator
						testID='settings-view-language'
					/>
					<List.Separator />
					<List.Item
						title='Default_Font_Setting'
						onPress={() => navigateToScreen('DefaultFontSettingView')}
						showActionIndicator
						testID='settings-view-default_font'
					/>
					<List.Separator />
					<List.Item
						title='Default_Homepage'
						onPress={() => navigateToScreen('DefaultHomepageView')}
						showActionIndicator
						testID='settings-view-default_homepage'
					/>
					<List.Separator />
					<List.Item
						title='Default_browser'
						showActionIndicator
						onPress={() => navigateToScreen('DefaultBrowserView')}
						testID='settings-view-default-browser'
					/>
					<List.Separator />
					{/* {isAndroid ? (*/}
					{/*	<>*/}
					{/*		<List.Item*/}
					{/*			title='Android-Keep-Alive'*/}
					{/*			showActionIndicator*/}
					{/*			onPress={requestIgnoreBatteryOptimizations}*/}
					{/*			testID='settings-view-default-browser'*/}
					{/*		/>*/}
					{/*		<List.Separator />*/}
					{/*	</>*/}
					{/* ) : null}*/}
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						title={I18n.t('Version_no')}
						onPress={copyAppVersion}
						right={() => <Text style={[styles.font, { fontSize: 16, color: colors.auxiliaryText }]}>{getReadableVersion}</Text>}
						testID='settings-view-version'
						translateTitle={false}
					/>
					<List.Separator />
					<List.Item
						title={I18n.t('Server_version')}
						onPress={copyServerVersion}
						right={() => (
							<View>
								<Text style={[styles.font, { color: colors.auxiliaryText, textAlign: 'right' }]}>{version}</Text>
								<Text style={[styles.font, { color: colors.auxiliaryText, textAlign: 'right' }]}>{server.split('//')[1]}</Text>
							</View>
						)}
						testID='settings-view-server-version'
						translateTitle={false}
						translateSubtitle={false}
					/>
					<List.Separator />
					<List.Item
						title='Check_New_Version'
						showActionIndicator
						onPress={() => {
							getLastestVersion();
						}}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						title='Privacy_Policy'
						showActionIndicator
						onPress={() => {
							goSimpleWebView(PrivacyUrl.Privacy_Policy, I18n.t('Privacy_Policy'));
						}}
					/>
					<List.Separator />
					<List.Item
						title='Terms_of_Service'
						showActionIndicator
						onPress={() => {
							goSimpleWebView(PrivacyUrl.Terms_of_Service, I18n.t('Terms_of_Service'));
						}}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						title='Clear_cache'
						testID='settings-view-clear-cache'
						onPress={handleClearCache}
						color={colors.dangerColor}
						styleTitle={{
							textAlign: 'center',
							flex: 1
						}}
					/>
					<List.Separator />
					<List.Item
						title='Logout'
						testID='settings-logout'
						onPress={handleLogout}
						color={colors.dangerColor}
						styleTitle={{
							textAlign: 'center',
							flex: 1
						}}
					/>
					<List.Separator />
					<List.Item
						title='Logout_from_other_logged_in_locations'
						testID='profile-view-logout-other-locations'
						onPress={logoutOtherLocations}
						color={colors.dangerColor}
						styleTitle={{
							textAlign: 'center',
							flex: 1
						}}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default SettingsView;
