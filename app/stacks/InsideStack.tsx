import React, { useCallback, useEffect } from 'react';
import { I18nManager, Image } from 'react-native';
import { createStackNavigator, StackNavigationOptions, CardStyleInterpolators } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';

import { ThemeContext } from '../theme';
import { ModalAnimation, StackAnimation, defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import Sidebar from '../views/SidebarView';
// Chats Stack
import RoomView from '../views/RoomView';
import RoomsListView from '../views/RoomsListView';
import RoomActionsView from '../views/RoomActionsView';
import RoomInfoView from '../views/RoomInfoView';
import RoomInfoEditView from '../views/RoomInfoEditView';
import RoomMembersView from '../views/RoomMembersView';
import RoomMembersEditView from '../views/RoomMembersEditView';
import SearchMessagesView from '../views/SearchMessagesView';
import SelectedUsersView from '../views/SelectedUsersView';
import InviteUsersView from '../views/InviteUsersView';
import InviteUsersEditView from '../views/InviteUsersEditView';
import MessagesView from '../views/MessagesView';
import AutoTranslateView from '../views/AutoTranslateView';
import DirectoryView from '../views/DirectoryView';
import NotificationPrefView from '../views/NotificationPreferencesView';
import ForwardLivechatView from '../views/ForwardLivechatView';
import CloseLivechatView from '../views/CloseLivechatView';
import LivechatEditView from '../views/LivechatEditView';
import PickerView from '../views/PickerView';
import ThreadMessagesView from '../views/ThreadMessagesView';
import TeamChannelsView from '../views/TeamChannelsView';
import MarkdownTableView from '../views/MarkdownTableView';
import ReadReceiptsView from '../views/ReadReceiptView';
import CannedResponsesListView from '../views/CannedResponsesListView';
import CannedResponseDetail from '../views/CannedResponseDetail';
import { DEFAULT_HOMEPAGE, themes } from '../lib/constants';
import UserPreferences from '../lib/methods/userPreferences';
// Profile Stack
import ProfileView from '../views/ProfileView';
import UserPreferencesView from '../views/UserPreferencesView';
import UserNotificationPrefView from '../views/UserNotificationPreferencesView';
// Display Preferences View
import DisplayPrefsView from '../views/DisplayPrefsView';
// Settings Stack
import SettingsView, { settingsViewNavigationOptions } from '../views/SettingsView';
import SecurityPrivacyView from '../views/SecurityPrivacyView';
import E2EEncryptionSecurityView from '../views/E2EEncryptionSecurityView';
import LanguageView from '../views/LanguageView';
import ThemeView from '../views/ThemeView';
import DefaultHomepageView from '../views/DefaultHomepageView';
import DefaultFontSettingView from '../views/DefaultFontSettingView';
import DefaultBrowserView from '../views/DefaultBrowserView';
import ScreenLockConfigView from '../views/ScreenLockConfigView';
// Admin Stack
import AdminPanelView from '../views/AdminPanelView';
// NewMessage Stack
// import NewMessageView from '../views/NewMessageView';
import CreateChannelView from '../views/CreateChannelView';
// E2ESaveYourPassword Stack
import E2ESaveYourPasswordView from '../views/E2ESaveYourPasswordView';
import E2EHowItWorksView from '../views/E2EHowItWorksView';
// E2EEnterYourPassword Stack
import E2EEnterYourPasswordView from '../views/E2EEnterYourPasswordView';
// InsideStackNavigator
import AttachmentView from '../views/AttachmentView';
import ModalBlockView from '../views/ModalBlockView';
import JitsiMeetView from '../views/JitsiMeetView';
import StatusView from '../views/StatusView';
import ShareView from '../views/ShareView';
import CreateDiscussionView from '../views/CreateDiscussionView';
import QueueListView from '../ee/omnichannel/views/QueueListView';
import AddChannelTeamView from '../views/AddChannelTeamView';
import AddExistingChannelView from '../views/AddExistingChannelView';
import SelectListView from '../views/SelectListView';
import DiscussionsView from '../views/DiscussionsView';
import ChangeAvatarView from '../views/ChangeAvatarView';
import DocumentPickerView from '../views/DocumentPickerView';
import WorkspacePage from '../views/WorkspacePage';
import WebPageView from '../views/WebPageView';
import CloudDocumentWebView from '../views/CloudDocumentWebView';
import AnnouncementView from '../views/AnnouncementView';
import ScheduleView from '../views/ScheduleView';
import SelectGroupTypeView from '../views/SelectGroupTypeView';
import {
	AdminPanelStackParamList,
	BottomTabParamList,
	ChatsStackParamList,
	ContactsStackParamList,
	// CloudStorageStackParamList,
	DisplayPrefStackParamList,
	DrawerParamList,
	E2EEnterYourPasswordStackParamList,
	E2ESaveYourPasswordStackParamList,
	InsideStackParamList,
	NewMessageStackParamList,
	ProfileStackParamList,
	SettingsStackParamList,
	WorkspaceStackParamList,
	WebPageViewStackParamList
} from './types';
import ContactsView from '../views/ContactsView';
import { isIOS } from '../lib/methods/helpers';
import styles from './styles';
import I18n from '../i18n';
import { IApplicationState } from '../definitions';
import { getContacts } from '../actions/contacts';
import Companies from '../containers/Company';
import MyCardView from '../views/MyCardView';
import ScannerView from '../views/ScannerView';
import ForwardMessageView from '../views/ForwardMessageView';
import { ChannelTypeView } from '../views/ChannelTypeView';
import { ShareChannelView } from '../views/ShareChannelView';
import SelectedExternalUserView from '../views/SelectedExternalUsersView';
import RoomGroupManageView from '../views/RoomGroupManageView';
import CloudStorageView from '../views/CloudStorageView';
import CloudDocTaskListView from '../views/CloudDocTaskListView';
import ScannerResultView from '../views/ScannerResultView';
import RoomManagersView from '../views/RoomManagersView';
import CloudDiskView from '../views/CloudDiskView';
import CloudDocumentPage from '../views/CloudDocumentPage';
import CloudDocSettingView from '../views/CloudDocSettingView';
import CloudDocActionsView from '../views/CloudDocActionsView';
import CloudDocFileDetailView from '../views/CloudDocFileDetailView';
import CloudDocRecycleView from '../views/CloudDocRecycleView';
import CloudPermissionManageView from '../views/CloudPermissionManageView';
import CloudUsersSelectedView from '../views/CloudUsersSelectedView';
import FederationChooseOrgView from '../views/FederationChooseOrgView';
import FederationCreateOrgView from '../views/FederationCreateOrgView';
import VoiceChatUsersSelectView from '../views/VoiceChatUsersSelectView';
import TodoListView from '../views/TodoListView';
import CloudDocumentView from '../views/CloudDocumentView';
import FastModelBotInfoView from '../views/FastModelBotInfoView';
import RoomChangeFakeNameView from '../views/RoomChangeFakeNameView';
import SimpleWebView from '../views/SimpleWebView';

const RoomsListStack = createStackNavigator<ChatsStackParamList>();
const RoomsListStackStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<RoomsListStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<ChatsStack.Screen name='RoomsListView' component={RoomsListView} />
		</RoomsListStack.Navigator>
	);
};

const ChannelStack = createStackNavigator<ChatsStackParamList>();
const ChannelStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ChannelStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<ChatsStack.Screen name='RoomsListView' component={props => <RoomsListView isChannel={true} {...props} />} />
		</ChannelStack.Navigator>
	);
};

const BotsStack = createStackNavigator<ChatsStackParamList>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BotsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<BotsStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<ChatsStack.Screen name='RoomsListView' component={props => <RoomsListView isBots={true} {...props} />} />
		</BotsStack.Navigator>
	);
};

// Workspace
const WorkspaceStack = createStackNavigator<WorkspaceStackParamList>();
const WorkspaceStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<WorkspaceStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<WorkspaceStack.Screen name='WorkspacePage' component={WorkspacePage} />
		</WorkspaceStack.Navigator>
	);
};

const ContactsStack = createStackNavigator<ContactsStackParamList>();
const ContactsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ContactsStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<ContactsStack.Screen name='ContactsView' component={ContactsView} />
		</ContactsStack.Navigator>
	);
};

/* const CloudStorageStack = createStackNavigator<CloudStorageStackParamList>();
const CloudStorageNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<CloudStorageStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<CloudStorageStack.Screen name='CloudStorageView' component={CloudStorageView} />
		</CloudStorageStack.Navigator>
	);
}; */

const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator: React.FC = () => {
	let messageBadge = useSelector((state: IApplicationState) => state.tab.messageBadge);
	let channelBadge = useSelector((state: IApplicationState) => state.tab.channelBadge);

	messageBadge = messageBadge > 99 ? 99 : messageBadge;
	channelBadge = channelBadge > 99 ? 99 : channelBadge;

	const defaultHomepage = (UserPreferences.getString(DEFAULT_HOMEPAGE) ??
		'RoomsListStackStackNavigator') as keyof BottomTabParamList;

	return (
		<BottomTab.Navigator
			initialRouteName={defaultHomepage}
			tabBarOptions={{
				activeTintColor: '#2878FF',
				inactiveTintColor: '#919DB1',
				labelStyle: {
					fontSize: 12
				},
				tabStyle: {
					backgroundColor: '#FDFEFF',
					borderTopColor: '#E7E7E7',
					borderTopWidth: 0.5
				}
			}}
		>
			<BottomTab.Screen
				name='RoomsListStackStackNavigator'
				component={RoomsListStackStackNavigator}
				options={{
					tabBarLabel: I18n.t('Messenger'),
					tabBarIcon: ({ focused }) => {
						if (focused) {
							return <Image source={require('../static/images/bottom_tabs/chat_hover.png')} style={styles.bottomTabImage} />;
						}

						return <Image source={require('../static/images/bottom_tabs/chat.png')} style={styles.bottomTabImage} />;
					},
					tabBarBadge: messageBadge || undefined,
					tabBarBadgeStyle: { backgroundColor: '#E34D59', borderRadius: 4 }
				}}
			/>
			<BottomTab.Screen
				name='ChannelStackNavigator'
				component={ChannelStackNavigator}
				options={{
					tabBarLabel: I18n.t('Channel'),
					tabBarIcon: ({ focused }) => {
						if (focused) {
							return <Image source={require('../static/images/bottom_tabs/channel_hover.png')} style={styles.bottomTabImage} />;
						}

						return <Image source={require('../static/images/bottom_tabs/channel.png')} style={styles.bottomTabImage} />;
					},
					tabBarBadge: channelBadge || undefined,
					tabBarBadgeStyle: { backgroundColor: '#E34D59', borderRadius: 4 }
				}}
			/>
			<BottomTab.Screen
				name='WorkspaceStackNavigator'
				component={WorkspaceStackNavigator}
				options={{
					tabBarLabel: I18n.t('Workspace'),
					tabBarIcon: ({ focused }) => {
						if (focused) {
							return <Image source={require('../static/images/bottom_tabs/work_hover.png')} style={styles.bottomTabImage} />;
						}

						return <Image source={require('../static/images/bottom_tabs/work.png')} style={styles.bottomTabImage} />;
					}
				}}
			/>
			{/*
			<BottomTab.Screen
				name='BotsStackNavigator'
				component={BotsStackNavigator}
				options={{
					tabBarLabel: I18n.t('Bots'),
					tabBarIcon: ({ focused }) => {
						if (focused) {
							return <Image source={require('../static/images/bottom_tabs/bot_hover.png')} style={styles.bottomTabImage} />;
						}

						return <Image source={require('../static/images/bottom_tabs/bot.png')} style={styles.bottomTabImage} />;
					}
				}}
			/>
			*/}

			<BottomTab.Screen
				name='ContactsStackNavigator'
				component={ContactsStackNavigator}
				options={{
					tabBarLabel: I18n.t('Contacts'),
					tabBarIcon: ({ focused }) => {
						if (focused) {
							return <Image source={require('../static/images/bottom_tabs/contacts_hover.png')} style={styles.bottomTabImage} />;
						}

						return <Image source={require('../static/images/bottom_tabs/contacts.png')} style={styles.bottomTabImage} />;
					}
				}}
			/>
			{/* 			<BottomTab.Screen
				name='CloudStorageNavigator'
				component={CloudStorageNavigator}
				options={{
					tabBarLabel: I18n.t('CloudStorage'),
					tabBarIcon: ({ focused }) => {
						if (focused) {
							return <Image source={require('../static/images/bottom_tabs/cloud_hover.png')} style={styles.bottomTabImage} />;
						}

						return <Image source={require('../static/images/bottom_tabs/cloud.png')} style={styles.bottomTabImage} />;
					}
				}}
			/> */}
		</BottomTab.Navigator>
	);
};

// ChatsStackNavigator
const ChatsStack = createStackNavigator<ChatsStackParamList>();
const ChatsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ChatsStack.Navigator
			screenOptions={
				{
					...defaultHeader,
					...themedHeader(theme),
					...StackAnimation,
					headerBackImage: () => <Image source={require('../static/images/navigation_back.png')} style={styles.navigationBack} />
				} as StackNavigationOptions
			}
		>
			<ChatsStack.Screen name='RoomsListView' options={{ headerShown: false }} component={BottomTabNavigator} />
			<ChatsStack.Screen name='RoomView' component={RoomView} />
			<ChatsStack.Screen name='FastModelBotInfoView' component={FastModelBotInfoView} />
			<ChatsStack.Screen name={'CloudDiskView'} component={CloudDiskView} />
			<ChatsStack.Screen name='ForwardMessageView' component={ForwardMessageView} />
			<ChatsStack.Screen name='MyCardView' component={MyCardView} />
			<ChatsStack.Screen name='ScannerView' component={ScannerView} options={ScannerView.navigationOptions} />
			<ChatsStack.Screen name='ScannerResultView' component={ScannerResultView} />
			<ChatsStack.Screen name='FederationChooseOrgView' component={FederationChooseOrgView} />
			<ChatsStack.Screen name='FederationCreateOrgView' component={FederationCreateOrgView} />
			<ChatsStack.Screen name='RoomManagersView' component={RoomManagersView} />
			<ChatsStack.Screen
				name='DocumentPickerView'
				component={DocumentPickerView}
				options={DocumentPickerView.navigationOptions}
			/>
			<ChatsStack.Screen name='RoomActionsView' component={RoomActionsView} options={RoomActionsView.navigationOptions} />
			<ChatsStack.Screen name='RoomChangeFakeNameView' component={RoomChangeFakeNameView} />
			<ChatsStack.Screen name='RoomGroupManageView' component={RoomGroupManageView} />
			<ChatsStack.Screen name='SelectListView' component={SelectListView} options={SelectListView.navigationOptions} />
			<ChatsStack.Screen name='RoomInfoView' component={RoomInfoView} options={RoomInfoView.navigationOptions} />
			<ChatsStack.Screen name='RoomInfoEditView' component={RoomInfoEditView} options={RoomInfoEditView.navigationOptions} />
			<ChatsStack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
			<ChatsStack.Screen name='RoomMembersView' component={RoomMembersView} />
			<ChatsStack.Screen name='CloudStorageView' component={CloudStorageView} />
			<ChatsStack.Screen
				name='RoomMembersEditView'
				component={RoomMembersEditView}
				options={RoomMembersEditView.navigationOptions}
			/>
			<ChatsStack.Screen name='DiscussionsView' component={DiscussionsView} />
			<ChatsStack.Screen
				name='SearchMessagesView'
				component={SearchMessagesView}
				options={SearchMessagesView.navigationOptions}
			/>
			<ChatsStack.Screen name='SelectedUsersView' component={SelectedUsersView} />
			<ChatsStack.Screen name='SelectedExternalUserView' component={SelectedExternalUserView} />
			<ChatsStack.Screen name='InviteUsersView' component={InviteUsersView} />
			<ChatsStack.Screen name='InviteUsersEditView' component={InviteUsersEditView} />
			<ChatsStack.Screen name='MessagesView' component={MessagesView} />
			<ChatsStack.Screen name='AutoTranslateView' component={AutoTranslateView} options={AutoTranslateView.navigationOptions} />
			<ChatsStack.Screen name='DirectoryView' component={DirectoryView} options={DirectoryView.navigationOptions} />
			<ChatsStack.Screen name='NotificationPrefView' component={NotificationPrefView} />
			<ChatsStack.Screen name='ForwardLivechatView' component={ForwardLivechatView} />
			<ChatsStack.Screen name='CloseLivechatView' component={CloseLivechatView} />
			<ChatsStack.Screen name='LivechatEditView' component={LivechatEditView} options={LivechatEditView.navigationOptions} />
			<ChatsStack.Screen name='PickerView' component={PickerView} options={PickerView.navigationOptions} />
			<ChatsStack.Screen
				name='ThreadMessagesView'
				component={ThreadMessagesView}
				options={ThreadMessagesView.navigationOptions}
			/>
			<ChatsStack.Screen name='TeamChannelsView' component={TeamChannelsView} />
			<ChatsStack.Screen name='CreateChannelView' component={CreateChannelView} />
			<ChatsStack.Screen name='AddChannelTeamView' component={AddChannelTeamView} />
			<ChatsStack.Screen
				name='AddExistingChannelView'
				component={AddExistingChannelView}
				options={AddExistingChannelView.navigationOptions}
			/>
			<ChatsStack.Screen name='MarkdownTableView' component={MarkdownTableView} />
			<ChatsStack.Screen name='ReadReceiptsView' component={ReadReceiptsView} options={ReadReceiptsView.navigationOptions} />
			<ChatsStack.Screen name='QueueListView' component={QueueListView} />
			<ChatsStack.Screen name='CannedResponsesListView' component={CannedResponsesListView} />
			<ChatsStack.Screen name='CannedResponseDetail' component={CannedResponseDetail} />
			<ChatsStack.Screen
				name='JitsiMeetView'
				component={JitsiMeetView}
				options={{ headerShown: false, animationEnabled: isIOS }}
			/>
			<ChatsStack.Screen name='WebPageView' component={WebPageView} />
			<ChatsStack.Screen name='CloudDocumentWebView' component={CloudDocumentWebView} />
			<ChatsStack.Screen name='CloudDocumentPage' component={CloudDocumentPage} />
			<ChatsStack.Screen name='CloudDocumentView' component={CloudDocumentView} />
			<ChatsStack.Screen name='CloudDocActionsView' component={CloudDocActionsView} />
			<ChatsStack.Screen name='CloudDocSettingView' component={CloudDocSettingView} />
			<ChatsStack.Screen name='AnnouncementView' component={AnnouncementView} />
			<ChatsStack.Screen name='ScheduleView' component={ScheduleView} />
			<ChatsStack.Screen name='ChannelTypeView' component={ChannelTypeView} />
			<ChatsStack.Screen name='ShareChannelView' component={ShareChannelView} />
			<ChatsStack.Screen name='CloudDocTaskListView' component={CloudDocTaskListView} />
			<ChatsStack.Screen name='CloudDocFileDetailView' component={CloudDocFileDetailView} />
			<ChatsStack.Screen name='CloudPermissionManageView' component={CloudPermissionManageView} />
			<ChatsStack.Screen name='CloudDocRecycleView' component={CloudDocRecycleView} />
			<ChatsStack.Screen name='CloudUsersSelectedView' component={CloudUsersSelectedView} />
			<ChatsStack.Screen name='VoiceChatUsersSelectView' component={VoiceChatUsersSelectView} />
			<ChatsStack.Screen name='TodoListView' component={TodoListView} />
		</ChatsStack.Navigator>
	);
};

// ProfileStackNavigator
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const ProfileStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ProfileStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<ProfileStack.Screen name='ProfileView' component={ProfileView} options={ProfileView.navigationOptions} />
			<ProfileStack.Screen name='UserPreferencesView' component={UserPreferencesView} />
			<ProfileStack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
			<ProfileStack.Screen name='UserNotificationPrefView' component={UserNotificationPrefView} />
			<ProfileStack.Screen name='PickerView' component={PickerView} options={PickerView.navigationOptions} />
		</ProfileStack.Navigator>
	);
};

// SettingsStackNavigator
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const SettingsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<SettingsStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<SettingsStack.Screen name='SettingsView' component={SettingsView} options={settingsViewNavigationOptions} />
			<SettingsStack.Screen name='SecurityPrivacyView' component={SecurityPrivacyView} />
			<SettingsStack.Screen
				name='E2EEncryptionSecurityView'
				component={E2EEncryptionSecurityView}
				options={E2EEncryptionSecurityView.navigationOptions}
			/>
			<SettingsStack.Screen name='LanguageView' component={LanguageView} options={LanguageView.navigationOptions} />
			<SettingsStack.Screen name='ThemeView' component={ThemeView} />
			<SettingsStack.Screen name='DefaultHomepageView' component={DefaultHomepageView} />
			<SettingsStack.Screen name='DefaultFontSettingView' component={DefaultFontSettingView} />
			<SettingsStack.Screen
				name='DefaultBrowserView'
				component={DefaultBrowserView}
				options={DefaultBrowserView.navigationOptions}
			/>
			<SettingsStack.Screen
				name='ScreenLockConfigView'
				component={ScreenLockConfigView}
				options={ScreenLockConfigView.navigationOptions}
			/>
			{/* <SettingsStack.Screen name='MyView' component={MyView} options={MyView.navigationOptions} />*/}
			<SettingsStack.Screen name='SimpleWebView' component={SimpleWebView} />
		</SettingsStack.Navigator>
	);
};

// WebPageViewNavigator
const WebPageViewStack = createStackNavigator<WebPageViewStackParamList>();
const WebPageViewStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<WebPageViewStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<WebPageViewStack.Screen name='WebPageView' component={WebPageView} />
			<WebPageViewStack.Screen name='CloudDocumentWebView' component={CloudDocumentWebView} />
			<WebPageViewStack.Screen name='CloudDocumentPage' component={CloudDocumentPage} />
		</WebPageViewStack.Navigator>
	);
};

// AdminPanelStackNavigator
const AdminPanelStack = createStackNavigator<AdminPanelStackParamList>();
const AdminPanelStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<AdminPanelStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<AdminPanelStack.Screen name='AdminPanelView' component={AdminPanelView} />
		</AdminPanelStack.Navigator>
	);
};

// DisplayPreferenceNavigator
const DisplayPrefStack = createStackNavigator<DisplayPrefStackParamList>();
const DisplayPrefStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<DisplayPrefStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<DisplayPrefStack.Screen name='DisplayPrefsView' component={DisplayPrefsView} />
		</DisplayPrefStack.Navigator>
	);
};

// DrawerNavigator
const Drawer = createDrawerNavigator<DrawerParamList>();
const DrawerNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<Drawer.Navigator
			// @ts-ignore
			drawerContent={({ navigation, state }) => <Sidebar navigation={navigation} state={state} />}
			useLegacyImplementation={true}
			screenOptions={{
				swipeEnabled: false,
				headerShown: false,
				drawerPosition: I18nManager.isRTL ? 'right' : 'left',
				drawerType: 'back',
				overlayColor: `rgba(0,0,0,${themes[theme].backdropOpacity})`
			}}
		>
			<Drawer.Screen name='ChatsStackNavigator' component={ChatsStackNavigator} />
			<Drawer.Screen name='ProfileStackNavigator' component={ProfileStackNavigator} />
			<Drawer.Screen name='SettingsStackNavigator' component={SettingsStackNavigator} />
			<Drawer.Screen name='WebPageViewStackNavigator' options={{ headerShown: false }} component={WebPageViewStackNavigator} />
			<Drawer.Screen name='AdminPanelStackNavigator' component={AdminPanelStackNavigator} />
			<Drawer.Screen name='DisplayPrefStackNavigator' component={DisplayPrefStackNavigator} />
		</Drawer.Navigator>
	);
};

// NewMessageStackNavigator
const NewMessageStack = createStackNavigator<NewMessageStackParamList>();
const NewMessageStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<NewMessageStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			{/* <NewMessageStack.Screen name='NewMessageView' component={NewMessageView} /> */}
			<NewMessageStack.Screen name='SelectedUsersViewCreateChannel' component={SelectedUsersView} />
			<NewMessageStack.Screen name='CreateChannelView' component={CreateChannelView} />
			<NewMessageStack.Screen name='CreateDiscussionView' component={CreateDiscussionView} />
			<NewMessageStack.Screen name='SelectGroupTypeView' component={SelectGroupTypeView} />
		</NewMessageStack.Navigator>
	);
};

// E2ESaveYourPasswordStackNavigator
const E2ESaveYourPasswordStack = createStackNavigator<E2ESaveYourPasswordStackParamList>();
const E2ESaveYourPasswordStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<E2ESaveYourPasswordStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<E2ESaveYourPasswordStack.Screen name='E2ESaveYourPasswordView' component={E2ESaveYourPasswordView} />
			<E2ESaveYourPasswordStack.Screen name='E2EHowItWorksView' component={E2EHowItWorksView} />
		</E2ESaveYourPasswordStack.Navigator>
	);
};

// E2EEnterYourPasswordStackNavigator
const E2EEnterYourPasswordStack = createStackNavigator<E2EEnterYourPasswordStackParamList>();
const E2EEnterYourPasswordStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<E2EEnterYourPasswordStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<E2EEnterYourPasswordStack.Screen name='E2EEnterYourPasswordView' component={E2EEnterYourPasswordView} />
		</E2EEnterYourPasswordStack.Navigator>
	);
};

const isAuthenticatedSelector = (state: IApplicationState) => state.login.isAuthenticated;
const useGlobal = () => {
	const dispatch = useDispatch();
	const flag = useSelector(useCallback((state: IApplicationState) => state.settings.Appia_Hrm_Update_Time, []));
	const isAuthenticated = useSelector(isAuthenticatedSelector);

	useEffect(() => {
		if (isAuthenticated) {
			dispatch(
				getContacts(
					{
						force: true
					},
					{
						resolve: () => {},
						reject: () => {}
					}
				)
			);
		}
		// eslint-disable-next-line
	}, [flag, isAuthenticated]);
};

// InsideStackNavigator
const InsideStack = createStackNavigator<InsideStackParamList>();
const InsideStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	// todo isAuthenticated 这个值应该还是不正确
	const isAuthenticated = useSelector(isAuthenticatedSelector);
	useGlobal();

	return (
		<>
			<InsideStack.Navigator
				screenOptions={{
					...defaultHeader,
					...themedHeader(theme),
					...ModalAnimation,
					presentation: 'transparentModal',
					cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS
				}}
			>
				<InsideStack.Screen name='DrawerNavigator' component={DrawerNavigator} options={{ headerShown: false }} />
				<InsideStack.Screen
					name='NewMessageStackNavigator'
					component={NewMessageStackNavigator}
					options={{ headerShown: false }}
				/>
				<InsideStack.Screen
					name='E2ESaveYourPasswordStackNavigator'
					component={E2ESaveYourPasswordStackNavigator}
					options={{ headerShown: false }}
				/>
				<InsideStack.Screen
					name='E2EEnterYourPasswordStackNavigator'
					component={E2EEnterYourPasswordStackNavigator}
					options={{ headerShown: false }}
				/>
				<InsideStack.Screen name='AttachmentView' component={AttachmentView} />
				<InsideStack.Screen name='StatusView' component={StatusView} />
				<InsideStack.Screen name='ShareView' component={ShareView} />
				<InsideStack.Screen name='ModalBlockView' component={ModalBlockView} options={ModalBlockView.navigationOptions} />
			</InsideStack.Navigator>
			{isAuthenticated ? <Companies /> : null}
		</>
	);
};

export default InsideStackNavigator;
