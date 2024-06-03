import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { connect } from 'react-redux';
import ImagePicker, { Image, Options } from 'react-native-image-crop-picker';
import { StackNavigationOptions } from '@react-navigation/stack';

import KeyboardView from '../../containers/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { events, logEvent } from '../../utils/log';
import I18n from '../../i18n';
import Avatar from '../../containers/Avatar';
import StatusBar from '../../containers/StatusBar';
import { BackButton } from '../../containers/HeaderButton';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { ProfileStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import * as List from '../../containers/List';
import { IApplicationState, IAvatar, IBaseScreen, IUser } from '../../definitions';
import { Icon } from '../../containers/List';
import ActivityIndicator from '../../containers/ActivityIndicator';
import styles from './styles';
import { isAndroid } from '../../utils/deviceInfo';
import QRCodeIcon from '../../containers/Icon/QRCode';
import Navigation from '../../lib/navigation/appNavigation';

interface IProfileViewProps extends IBaseScreen<ProfileStackParamList, 'ProfileView'> {
	user: IUser;
	Accounts_AllowUserAvatarChange: boolean;
	theme: TSupportedThemes;
}

interface IProfileViewState {
	saving: boolean;
	avatar: IAvatar;
}

class ProfileView extends React.Component<IProfileViewProps, IProfileViewState> {
	static navigationOptions = ({ navigation }: IProfileViewProps) => {
		const options: StackNavigationOptions = {
			headerTitleAlign: 'center',
			title: I18n.t('Profile'),
			headerLeft: () => <BackButton onPress={() => navigation.goBack()} />
		};
		return options;
	};

	state: IProfileViewState = {
		saving: false,
		avatar: {
			data: {},
			url: ''
		}
	};

	componentDidMount() {
		Services.getAvatarSuggestion();
	}

	pickImage = async () => {
		const { Accounts_AllowUserAvatarChange } = this.props;

		if (!Accounts_AllowUserAvatarChange) {
			return;
		}

		const iosOptions: Options = {
			// cropping: true,
			compressImageQuality: 0.8,
			freeStyleCropEnabled: true,
			// cropperAvoidEmptySpaceAroundImage: false,
			// cropperChooseText: I18n.t('Choose'),
			// cropperCancelText: I18n.t('Cancel'),
			includeBase64: true,
			multiple: false,
			mediaType: 'photo',
			maxFiles: 1
		};

		const androidOptions: Options = {
			cropping: true,
			compressImageQuality: 0.8,
			freeStyleCropEnabled: true,
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			includeBase64: true
		};

		try {
			logEvent(events.PROFILE_PICK_AVATAR);
			const response: Image = await ImagePicker.openPicker(isAndroid ? androidOptions : iosOptions);
			this.setState({ saving: true });
			const avatar = { url: response.path, data: `data:image/jpeg;base64,${response.data}`, service: 'upload' };
			await Services.setAvatarFromService(avatar);
			this.setState({ saving: false });
		} catch (error) {
			logEvent(events.PROFILE_PICK_AVATAR_F);
			console.warn(error);
			this.setState({ saving: false });
		}
	};

	render() {
		const { avatar, saving } = this.state;
		const { user, theme, Accounts_AllowUserAvatarChange } = this.props;

		return (
			<KeyboardView contentContainerStyle={sharedStyles.container} keyboardVerticalOffset={128}>
				<StatusBar />
				<SafeAreaView testID='profile-view'>
					{saving ? <ActivityIndicator size='large' absolute={true} style={{ backgroundColor: 'rgba(0,0,0, 0.15)' }} /> : null}

					<ScrollView testID='profile-view-list' {...scrollPersistTaps}>
						<List.Container style={{ padding: 0 }}>
							<List.Section style={{ padding: 0 }}>
								<List.Item
									title='Avatar'
									heightContainer={80}
									showActionIndicator={false}
									onPress={Accounts_AllowUserAvatarChange ? this.pickImage : undefined}
									right={() => (
										<View style={styles.avatar}>
											<Avatar text={user.username} avatar={avatar?.url} isStatic={avatar?.url} size={60} />
											<Icon name='chevron-right' />
										</View>
									)}
								/>
								<List.Separator />
								<List.Item
									title='Name'
									showActionIndicator={false}
									right={() => <Text style={[styles.font, { color: themes[theme].auxiliaryText }]}>{user.name}</Text>}
								/>
								<List.Separator />
								<List.Item
									title='Username'
									showActionIndicator={false}
									right={() => <Text style={[styles.font, { color: themes[theme].auxiliaryText }]}>{user.username}</Text>}
								/>
								<List.Separator />
								<List.Item
									title='My_QRCode'
									showActionIndicator={false}
									onPress={() => {
										Navigation.navigate('MyCardView', {
											rid: user.username
										});
									}}
									right={() => (
										<View style={styles.avatar}>
											<QRCodeIcon />
											<Icon name='chevron-right' />
										</View>
									)}
								/>
								<List.Separator />
								{user.emails?.length ? (
									<>
										<List.Item
											title='Email'
											showActionIndicator={false}
											right={() => (
												<Text style={[styles.font, { color: themes[theme].auxiliaryText }]}>
													{user.emails?.map(email => email.address).join('\n')}
												</Text>
											)}
										/>
										<List.Separator />
									</>
								) : null}
							</List.Section>
						</List.Container>
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	Accounts_AllowUserAvatarChange: state.settings.Accounts_AllowUserAvatarChange as boolean
});

export default connect(mapStateToProps)(withTheme(ProfileView));
