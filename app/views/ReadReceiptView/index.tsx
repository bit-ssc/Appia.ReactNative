import React from 'react';
import { FlatList, Text, View, RefreshControl, TouchableOpacity } from 'react-native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/core';

import * as List from '../../containers/List';
import Avatar from '../../containers/Avatar';
import * as HeaderButton from '../../containers/HeaderButton';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { TSupportedThemes, withTheme } from '../../theme';
import { themes } from '../../lib/constants';
import SafeAreaView from '../../containers/SafeAreaView';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import { IUser, IUserMessage } from '../../definitions';
import { Services } from '../../lib/services';

interface IReadReceiptViewState {
	readView: boolean;
	readLoading: boolean;
	unreadLoading: boolean;
	readList: IUserMessage[];
	unreadList: IUser[];
}

interface INavigationOption {
	navigation: StackNavigationProp<ChatsStackParamList, 'ReadReceiptsView'>;
	route: RouteProp<ChatsStackParamList, 'ReadReceiptsView'>;
	isMasterDetail: boolean;
}

interface IReadReceiptViewProps extends INavigationOption {
	Message_TimeAndDateFormat: string;
	theme: TSupportedThemes;
}

class ReadReceiptView extends React.Component<IReadReceiptViewProps, IReadReceiptViewState> {
	private messageId: string;
	private rid: string;
	private roomType: string;
	private userId: string;

	static navigationOptions = ({ navigation, isMasterDetail }: INavigationOption) => {
		const options: StackNavigationOptions = {
			headerTitleAlign: 'center',
			title: I18n.t('Read_Details')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='read-receipt-view-close' />;
		}
		return options;
	};

	constructor(props: IReadReceiptViewProps) {
		super(props);
		this.messageId = props.route.params?.messageId;
		this.rid = props.route.params?.rid;
		this.roomType = props.route.params?.roomType;
		this.userId = props.route.params?.userId;
		this.state = {
			readView: true,
			readLoading: false,
			unreadLoading: false,
			readList: [],
			unreadList: []
		};
	}

	componentDidMount() {
		this.load();
	}

	// shouldComponentUpdate(nextProps: IReadReceiptViewProps, nextState: IReadReceiptViewState) {
	// 	const { loading, receipts } = this.state;
	// 	const { theme } = this.props;
	// 	if (nextProps.theme !== theme) {
	// 		return true;
	// 	}
	// 	if (nextState.loading !== loading) {
	// 		return true;
	// 	}
	// 	if (!dequal(nextState.receipts, receipts)) {
	// 		return true;
	// 	}
	// 	return false;
	// }

	load = async () => {
		const { readView, readLoading, unreadLoading } = this.state;
		if (readView ? readLoading : unreadLoading) {
			return;
		}

		this.setState({
			readLoading: readView ? true : readLoading,
			unreadLoading: readView ? unreadLoading : true
		});

		try {
			// 获取已读列表
			const result = await Services.getReadReceipts(this.messageId);
			// 过滤掉外部频道的人
			const readList =
				result.success && result.receipts
					? result.receipts.filter(a => a.user && !a.user.username?.includes(':')).map(a => a.user)
					: [];
			this.setState({ readLoading: false, readList });
			// 获取未读列表;
			const roomMembers =
				(await Services.getRoomMembers({
					rid: this.rid,
					roomType: this.roomType,
					type: 'all',
					filter: false,
					skip: 0,
					limit: 9999,
					allUsers: true
				})) || [];
			this.setState({
				unreadLoading: false,
				unreadList: roomMembers.filter(
					(user: IUser) => user._id !== this.userId && !readList.some((readUser: IUserMessage) => readUser._id === user._id)
				)
			});
		} catch (error) {
			this.setState({ readLoading: false, unreadLoading: false });
			console.log('err_fetch_read_receipts', error);
		}
	};

	renderEmpty = () => {
		const { readView, readLoading, unreadLoading } = this.state;
		const { theme } = this.props;
		if (readView ? readLoading : unreadLoading) {
			return null;
		}
		return (
			<View
				style={[styles.listEmptyContainer, { backgroundColor: themes[theme].chatComponentBackground }]}
				testID='read-receipt-view'
			>
				<Text style={[styles.emptyText, { color: themes[theme].auxiliaryTintColor }]}>{I18n.t('No_Read_Receipts')}</Text>
			</View>
		);
	};

	renderItem = ({ item }: { item: IUser | IUserMessage }) => {
		const { theme } = this.props;
		// const time = moment(item.ts).format(Message_TimeAndDateFormat);
		if (!item?.username) {
			return null;
		}
		return (
			<View style={[styles.itemContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Avatar text={item.username} size={40} />
				<View style={styles.infoContainer}>
					<View style={styles.item}>
						<Text style={[styles.name, { color: themes[theme].titleText }]}>{item.name}</Text>
						{/* <Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text> */}
					</View>
					{/* <Text style={[styles.username,{color: themes[theme].auxiliaryText}]}>{`@${item.user.username}`}</Text> */}
				</View>
			</View>
		);
	};

	onChangeTab(type: string) {
		console.log(type);
		this.setState({ readView: type === 'read' });
	}

	renderTab() {
		const { readView, readList, unreadList } = this.state;
		return (
			<View style={styles.tabBox}>
				<TouchableOpacity onPress={() => this.onChangeTab('read')}>
					<View style={[styles.tabItem, readView && styles.tabSelected]}>
						<Text style={[styles.tabName, readView && styles.selectedTabName]}>{I18n.t('Read')}</Text>
						<View style={[styles.listRadius, readView && styles.selectedRadius]}>
							<Text style={[styles.listCount, readView && styles.selectedCount]}>{readList.length}</Text>
						</View>
					</View>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => this.onChangeTab('unread')}>
					<View style={[styles.tabItem, !readView && styles.tabSelected]}>
						<Text style={[styles.tabName, !readView && styles.selectedTabName]}>{I18n.t('Unread')}</Text>
						<View style={[styles.listRadius, !readView && styles.selectedRadius]}>
							<Text style={[styles.listCount, !readView && styles.selectedCount]}>{unreadList.length}</Text>
						</View>
					</View>
				</TouchableOpacity>
			</View>
		);
		// {!unreadView && <div style={styles.list}>{readList.map((receipt) => renderUser(receipt.user as IUser))}</div>}
		// {unreadView && <div style={styles.list}>{unreadList.map((user: IUser) => renderUser(user))}</div>})
	}

	render() {
		const { readView, readLoading, unreadLoading, readList, unreadList } = this.state;
		const { theme } = this.props;

		return (
			<SafeAreaView testID='read-receipt-view'>
				<StatusBar />
				{this.renderTab()}
				<FlatList
					data={readView ? readList : unreadList}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
					ListEmptyComponent={this.renderEmpty}
					contentContainerStyle={{ paddingBottom: 32 }}
					style={[
						styles.list,
						{
							backgroundColor: themes[theme].chatComponentBackground,
							borderColor: themes[theme].separatorColor
						}
					]}
					refreshControl={
						<RefreshControl
							refreshing={readView ? readLoading : unreadLoading}
							onRefresh={this.load}
							tintColor={themes[theme].auxiliaryText}
						/>
					}
					keyExtractor={item => item._id}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(ReadReceiptView);

// const mapStateToProps = (state: IApplicationState) => ({
// 	Message_TimeAndDateFormat: state.settings.Message_TimeAndDateFormat as string
// });
// export default connect(mapStateToProps)(withTheme(ReadReceiptView));
