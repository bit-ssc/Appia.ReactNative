import React from 'react';
import { FlatList, View, Text, Pressable, TextInput } from 'react-native';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';

import { themes } from '../../lib/constants';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import Avatar from '../../containers/Avatar';
import { sendLoadingEvent } from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import Button from '../../containers/Button';
import { IApplicationState, IBaseScreen, IUser } from '../../definitions';
import UserItem, { styles } from '../../containers/Organization/UserItem';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { getUserSelector } from '../../selectors/login';
import { ChatsStackParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import log from '../../utils/log';
import { isIOS } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';
import { CustomIcon } from '../../containers/CustomIcon';
import { Services } from '../../lib/services';

interface SelectedUser extends ISelectedUser {
	isSelected: boolean;
}

interface VoiceChatUsersSelectViewProps extends IBaseScreen<ChatsStackParamList, 'VoiceChatUsersSelectView'> {
	loading: boolean;
	user: IUser;
}
interface VoiceChatUsersSelectViewState {
	search: SelectedUser[];
	chats: SelectedUser[];
	searchText: string;
	isChooseAll: boolean;
	selectedUsers: SelectedUser[];
}

class VoiceChatUsersSelectView extends React.Component<VoiceChatUsersSelectViewProps, VoiceChatUsersSelectViewState> {
	private flatlist?: FlatList;
	private querySubscription?: Subscription;
	private orgRef: any;
	private textInputRef: any;

	constructor(props: VoiceChatUsersSelectViewProps) {
		super(props);
		this.init();
		this.state = {
			searchText: '',
			search: [],
			chats: [],
			isChooseAll: false,
			selectedUsers: []
		};
		this.setHeader();
	}

	componentDidUpdate(prevProps: VoiceChatUsersSelectViewProps) {
		const { loading } = this.props;

		if (loading !== prevProps.loading) {
			sendLoadingEvent({ visible: loading });
		}
	}

	componentWillUnmount() {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}
	onConfirm = () => {
		const { route, navigation } = this.props;
		const nextAction = route.params?.nextAction;
		nextAction(navigation, this.state.selectedUsers);
	};

	onBackPress = () => {
		if (!this.orgRef?.goPrev()) {
			const { navigation } = this.props;
			navigation?.pop();
		}
	};

	// showButton can be sent as route params or updated by the component
	setHeader = (title?: string) => {
		const { navigation } = this.props;
		const { selectedUsers } = this.state;
		const buttonText = '发起语音';
		title = '';
		const options = {
			title,
			headerLeft: () => <HeaderButton.BackButton onPress={this.onBackPress} />,
			headerRight: () => (
				<View style={sharedStyles.confirmButtonBox}>
					<Button
						style={sharedStyles.confirmButton}
						title={`${buttonText}(${selectedUsers.length})`}
						onPress={this.onConfirm}
					></Button>
				</View>
			)
		};
		navigation.setOptions(options);
	};

	// eslint-disable-next-line react/sort-comp
	init = async () => {
		const { route } = this.props;
		const rid = route.params?.rid;
		const roomType = route.params?.roomType;
		try {
			const membersResult = (await Services.getRoomMembers({
				rid,
				roomType,
				type: 'all',
				filter: '',
				skip: 0,
				limit: 0,
				allUsers: true
			})) as SelectedUser[];
			const newUsers = membersResult.filter(item => item.username !== '' && item.username !== this.props.user.username);
			this.setState({ chats: newUsers });
		} catch (e) {
			log(e);
		}
	};

	onSearchChangeText(text: string) {
		this.setState({ searchText: text });
		this.handleSearch(text);
	}

	handleSearch = async (text: string) => {
		const { route } = this.props;
		const rid = route.params?.rid;
		const roomType = route.params?.roomType;
		const membersResult = (await Services.getRoomMembers({
			rid,
			roomType,
			type: 'all',
			filter: text,
			skip: 0,
			limit: 0,
			allUsers: true
		})) as SelectedUser[];
		const newUsers = membersResult.filter(item => item.username !== '' && item.username !== this.props.user.username);
		this.setState({ search: newUsers });
	};

	toggleUser = (user: SelectedUser) => {
		user.isSelected = !user.isSelected;
		const seletedUsers = this.state.chats.filter(item => item.isSelected);
		this.setState({ selectedUsers: seletedUsers });
	};

	_onPressItem = (id: string, item = {} as SelectedUser) => {
		const user = this.state.chats.find(user => user.username === item.username);
		if (user) {
			if (this.state.selectedUsers?.find(user => user.username === item.username)) {
				user.isSelected = false;
			} else {
				user.isSelected = true;
			}
			const selecteUsers = this.state.chats.filter(item => item.isSelected);
			this.setState({ selectedUsers: selecteUsers });

			if (this.state.searchText) {
				this.textInputRef.clear();
				this.onSearchChangeText('');
			}
		}
	};

	_onPressSelectedItem = (item: SelectedUser) => this.toggleUser(item);

	renderHeader = () => {
		const { theme } = this.props;
		const { selectedUsers } = this.state;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor, flexDirection: 'row', borderRadius: 8, minHeight: 40 }}>
				{this.renderSelected()}
				<TextInput
					keyboardType='default'
					onChangeText={(text: string) => {
						this.onSearchChangeText(text);
					}}
					style={{ minWidth: 100, flex: 1, marginStart: selectedUsers.length === 0 ? 16 : 5 }}
					placeholder={'搜索'}
					ref={ref => (this.textInputRef = ref)}
				/>
			</View>
		);
	};

	setFlatListRef = (ref: FlatList) => (this.flatlist = ref);

	onContentSizeChange = () => this.flatlist?.scrollToEnd({ animated: true });

	renderSelected = () => {
		const { theme } = this.props;
		const { selectedUsers } = this.state;
		this.setHeader();
		if (selectedUsers.length === 0) {
			return null;
		}
		return (
			<View style={sharedStyles.footerBox}>
				<FlatList
					data={selectedUsers}
					ref={this.setFlatListRef}
					onContentSizeChange={this.onContentSizeChange}
					keyExtractor={item => item._id}
					style={{ borderColor: themes[theme].separatorColor, flex: 0 }}
					contentContainerStyle={{ marginTop: 5, marginBottom: 10, height: 55, marginLeft: 20, paddingRight: 10, flex: 0 }}
					renderItem={this.renderSelectedItem}
					keyboardShouldPersistTaps='always'
					horizontal
				/>
			</View>
		);
	};

	renderSelectedItem = ({ item }: { item: SelectedUser; index: number }) => {
		const { theme } = this.props;
		return (
			<Pressable
				onPress={() => this._onPressSelectedItem(item)}
				testID={`selected-user-${item.name}`}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }: any) => ({
					backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : 'transparent'
				})}
			>
				<View style={{ paddingRight: 15 }}>
					<Avatar text={item.username} rid={item.rid} type={item.t} size={36} style={{ marginVertical: 12 }} />
				</View>
			</Pressable>
		);
	};

	renderItem = ({ item, index }: { item: SelectedUser; index: number }) => {
		const { search, chats } = this.state;
		const { theme, user } = this.props;

		item.userId = (item.t === 'd' && item.uids?.length ? item.uids?.find(id => id !== user.id) : item._id) || user.id;
		// const name = item.search ? item.name : item.fname;
		const name = item.fname || item.name;
		const username = item.search ? (item.username as string) : item.name;
		let style = { borderColor: themes[theme].separatorColor };
		if (index === 0) {
			// style = { ...style, ...sharedStyles.separatorTop };
			style = { ...style };
		}
		if (search.length > 0 && index === search.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (search.length === 0 && index === chats.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}

		return (
			<UserItem
				id={item.userId}
				name={name}
				username={username}
				rid={item.rid}
				type={item.t}
				avatar={item.username}
				avatarSize={40}
				onPress={() => this._onPressItem(item._id, item)}
				testID={`select-users-view-item-${item.name}`}
				checked={this.state.selectedUsers?.find(user => user.username === item.username) !== undefined}
				hasCheckbox={true}
				disabled={false}
				style={style}
				theme={theme}
			/>
		);
	};

	renderChooseAll = () => {
		const { theme } = this.props;
		const { isChooseAll } = this.state;
		return (
			<Pressable
				onPress={() => {
					for (const user of this.state.chats) {
						user.isSelected = !isChooseAll;
					}
					this.setState({
						isChooseAll: !isChooseAll
					});
					const seletedUsers = this.state.chats.filter(item => item.isSelected);
					this.setState({ selectedUsers: seletedUsers });
				}}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }: any) => ({
					backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : '#fff'
				})}
			>
				<View style={[styles.container, { borderColor: themes[theme].separatorColor, borderBottomWidth: 1 }]}>
					<CustomIcon
						name={isChooseAll ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={24}
						style={[styles.checkbox]}
						color={isChooseAll ? themes[theme].actionTintColor : themes[theme].auxiliaryText}
					/>

					<View style={[styles.textContainer, { marginHorizontal: 15, marginVertical: 15 }]}>
						<Text style={[styles.name, { color: themes[theme].titleText }]} numberOfLines={1}>
							选择全员
						</Text>
					</View>
				</View>
			</Pressable>
		);
	};

	renderListView = () => {
		const { search, chats, searchText } = this.state;
		const { theme } = this.props;
		const searchOrChats = (searchText ? search : chats) as SelectedUser[];
		return (
			<>
				{searchText ? null : this.renderChooseAll()}
				<FlatList
					data={searchOrChats}
					extraData={this.props}
					keyExtractor={item => item._id}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
					contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
					keyboardShouldPersistTaps='always'
				/>
			</>
		);
	};

	render = () => (
		<SafeAreaView testID='select-users-view'>
			<StatusBar />
			<View style={{ padding: 5, backgroundColor: '#f3f4f5' }}>{this.renderHeader()}</View>
			{this.renderListView()}
		</SafeAreaView>
	);
}

const mapStateToProps = (state: IApplicationState) => ({
	users: state.selectedUsers.users,
	loading: state.selectedUsers.loading,
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(VoiceChatUsersSelectView));
