import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { connect } from 'react-redux';

import { themes } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import SearchBox from '../containers/SearchBox';
import StatusBar from '../containers/StatusBar';
import Button from '../containers/Button';
import { IApplicationState, IBaseScreen, IExternalData, IExternalMember, IUser } from '../definitions';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';
import I18n from '../i18n';
import sharedStyles from './Styles';
import { ISelectedUser } from '../reducers/selectedUsers';
import { isIOS } from '../utils/deviceInfo';
import Avatar from '../containers/Avatar';
import { styles } from '../containers/Organization/UserItem';
import { CustomIcon } from '../containers/CustomIcon';
import { events, logEvent } from '../utils/log';
import { addUser, removeUser, reset } from '../actions/selectedUsers';
import { Services } from '../lib/services';
import { sendLoadingEvent } from '../containers/Loading';

interface ISelectedExternalUsersViewProps extends IBaseScreen<ChatsStackParamList, 'SelectedExternalUserView'> {
	users: ISelectedUser[];
	loading: boolean;
	user: IUser;
	baseUrl: string;
	enterprise: string;
	userMe: IUser;
}
interface ISelectedExternalUsersViewState {
	searchText: string;
	search: IExternalMember[];
}

class SelectedExternalUserView extends React.Component<ISelectedExternalUsersViewProps, ISelectedExternalUsersViewState> {
	private externalData: IExternalData[] | undefined;
	constructor(props: ISelectedExternalUsersViewProps) {
		super(props);
		this.state = {
			searchText: '',
			search: []
		};
		this.setHeader();
		props.dispatch(reset());
	}

	componentDidUpdate(prevProps: ISelectedExternalUsersViewProps) {
		const { loading } = this.props;

		if (loading !== prevProps.loading) {
			sendLoadingEvent({ visible: loading });
		}
	}

	componentWillUnmount() {
		this.props.dispatch(reset());
	}

	getAllMembers = async () => {
		const { rid } = this.props.route.params;
		try {
			const res = await Services.getExternalMembers({ rid });
			// @ts-ignore
			this.externalData = res.data;
		} catch (e) {
			console.info('getAllMembers', e);
		}
	};

	componentDidMount() {
		this.getAllMembers();
	}

	cancelSearch = () => {
		this.setState(
			{
				searchText: ''
			},
			() => {
				this.setHeader();
			}
		);
	};

	onSearchChangeText(text: string) {
		this.setState({ searchText: text });
		this.handleSearch(text);
	}

	handleSearch = (text: string) => {
		const { enterprise } = this.props;
		const pattern = new RegExp(text, 'i');
		const result = [] as IExternalMember[];
		this.externalData &&
			this.externalData.forEach(item => {
				if (item.orgType.toLowerCase() !== enterprise.toLowerCase()) {
					item.members.forEach(member => {
						if (pattern.test(member.username) || pattern.test(member.name) || pattern.test(member.email)) {
							member.orgType = item.orgType;
							member.remote = item.remote;
							result.push(member);
						}
					});
				}
			});
		this.setState({ search: result });
	};

	onBackPress = () => {
		const { navigation } = this.props;
		navigation?.pop();
	};

	setHeader = (title?: string) => {
		const { navigation, route } = this.props;
		title = title || route.params?.title || I18n.t('Select_Users');
		const options = {
			title,
			headerLeft: () => <HeaderButton.BackButton onPress={this.onBackPress} />
		};
		navigation.setOptions(options);
	};

	toggleUser = (user: ISelectedUser) => {
		const { dispatch } = this.props;
		const isContain = this.isChecked(user);

		if (!isContain) {
			logEvent(events.SELECTED_USERS_ADD_USER);
			dispatch(addUser(user));
		} else {
			logEvent(events.SELECTED_USERS_REMOVE_USER);
			dispatch(removeUser(user, true));
		}
	};

	isChecked = (user: ISelectedUser) => {
		const { users } = this.props;
		return users.includes(user);
	};

	_onPressItem = (item = {} as ISelectedUser) => {
		this.toggleUser(item);
	};

	renderHeader = () => {
		const { theme } = this.props;
		const { searchText } = this.state;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor }}>
				<SearchBox
					onChangeText={(text: string) => this.onSearchChangeText(text)}
					value={searchText}
					onTouchCancel={this.cancelSearch}
					testID='select-users-view-search'
				/>
			</View>
		);
	};

	renderItem = ({ item }: { item: IExternalMember }) => {
		const { theme } = this.props;
		const username = item.username || item.name;
		const name = item.name || item.username;
		const checked = this.isChecked(item as unknown as ISelectedUser);
		const exist = Boolean(item.exist);

		return (
			<Pressable
				onPress={() => this._onPressItem(item as unknown as ISelectedUser)}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }: any) => ({
					backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
				})}
				disabled={exist}
			>
				<View style={[styles.container]}>
					<CustomIcon
						name={checked || exist ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={24}
						style={[
							styles.checkbox,
							{
								opacity: exist ? 0.4 : 1
							}
						]}
						color={checked || exist ? themes[theme].actionTintColor : themes[theme].auxiliaryText}
					/>
					<Avatar text={username} rid={'rid'} size={40} style={styles.avatar} />
					<View style={styles.textContainer}>
						<Text style={[styles.name, { color: themes[theme].titleText }]} numberOfLines={1}>
							{name}
						</Text>
						<Text style={[styles.name, { color: themes[theme].titleText }]}>{item.orgType}</Text>
					</View>
				</View>
			</Pressable>
		);
	};

	renderListView = () => {
		const { search } = this.state;
		const { theme } = this.props;
		return (
			<>
				<FlatList
					data={search}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
					contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
					keyboardShouldPersistTaps='always'
				/>
			</>
		);
	};

	onConfirm = () => {
		const { users, route, navigation } = this.props;
		const minUsers = route.params?.minUsers || 0;
		const nextAction = route.params?.nextAction;
		if (users.length >= minUsers && nextAction) {
			nextAction(navigation, users);
		}
	};

	renderSelectedItem = ({ item }: { item: ISelectedUser; index: number }) => {
		const { theme } = this.props;
		return (
			<Pressable
				testID={`selected-user-${item.name}`}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }: any) => ({
					backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
				})}
			>
				<View style={{ paddingRight: 15 }}>
					<Avatar text={item.username} rid={item.rid} size={36} style={{ marginVertical: 12 }} />
				</View>
			</Pressable>
		);
	};

	renderSelected = () => {
		const { users: selectUsers, theme, route, userMe } = this.props;
		const users = selectUsers.filter(item => userMe.id !== item.userId);

		const buttonText = route.params?.buttonText ?? I18n.t('Next');

		if (users.length === 0) {
			return null;
		}

		return (
			<View style={sharedStyles.footerBox}>
				<FlatList
					data={users}
					// getItemLayout={getItemLayout}
					style={{ borderColor: themes[theme].separatorColor }}
					contentContainerStyle={{ marginTop: 5, marginBottom: 10, height: 55, marginLeft: 20, paddingRight: 10 }}
					renderItem={this.renderSelectedItem}
					keyboardShouldPersistTaps='always'
					horizontal
				/>
				<View style={sharedStyles.confirmButtonBox}>
					<Button style={sharedStyles.confirmButton} title={`${buttonText}(${users.length})`} onPress={this.onConfirm}></Button>
				</View>
			</View>
		);
	};

	render = () => (
		<SafeAreaView testID='select-users-view'>
			<StatusBar />
			{this.renderHeader()}
			{this.renderListView()}
			{this.renderSelected()}
			{/* <Loading /> */}
		</SafeAreaView>
	);
}

const mapStateToProps = (state: IApplicationState) => ({
	loading: state.selectedUsers.loading,
	users: state.selectedUsers.users,
	userMe: state.login.user,
	enterprise: state.settings.Enterprise_ID
});

// @ts-ignore
export default connect(mapStateToProps)(withTheme(SelectedExternalUserView));
