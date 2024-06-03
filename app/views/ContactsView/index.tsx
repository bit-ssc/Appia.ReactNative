import React, { useMemo, useRef, useState } from 'react';
import {
	FlatList,
	LayoutChangeEvent,
	RefreshControl,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Image,
	Dimensions
} from 'react-native';
import { StackNavigationOptions } from '@react-navigation/stack';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { debounce, escapeRegExp, sortBy } from 'lodash';
import { WatermarkView } from 'react-native-watermark-component';
import { rgba } from 'color2k';

import styles from './styles';
import {
	IApplicationState,
	IBaseScreen,
	IDepartment,
	IDepartmentCount,
	IUserSummary,
	IUser,
	SubscriptionType
} from '../../definitions';
import { ContactsStackParamList } from '../../stacks/types';
import { themes } from '../../lib/constants';
import Navigation from '../../lib/navigation/appNavigation';
import Avatar from '../../containers/Avatar';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../dimensions';
import { withTheme } from '../../theme';
import DepartmentItem from './DepartmentItem';
import UserItem from './UserItem';
import { getContacts } from '../../actions/contacts';
import { COMPANY_ID, COMPANY_NAME } from '../../lib/constants/contacts';
import * as HeaderButton from '../../containers/HeaderButton';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { getUserSelector } from '../../selectors/login';
import { PHASE } from '../../reducers/contacts';
import I18n from '../../i18n';
import ListIcon from '../../containers/Icon/List';
import { toggleCompanies } from '../../actions/company';

interface IContactsViewProps extends IBaseScreen<ContactsStackParamList, 'ContactsView'> {
	phase: PHASE;
	loaded: boolean;
	departments: IDepartment[];
	users: IUserSummary[];
	department: IDepartment;
	departmentId: string;
	rootId: string;
	search: (keyword: string) => IUserSummary[];
	enterpriseName: string;
	enterpriseId: string;
	user: IUser;
	getUsersByDepartmentId: (departmentId: string) => IUserSummary[];
	toggle: boolean;
}

interface IContactsViewState {
	searching: boolean;
	search: IUserSummary[];
	refreshing: boolean;
}

const DepartmentCount: React.FC<{ usersCount: IDepartmentCount }> = ({ usersCount }) => {
	const fields = useMemo(
		() => [
			{
				key: 'fullTime',
				label: '全职'
			},
			{
				key: 'outsourcing',
				label: '外包'
			},
			{
				key: 'internship',
				label: '实习'
			},
			{
				key: 'partTime',
				label: '兼职'
			},
			{
				key: 'other',
				label: '其他'
			}
		],
		[]
	);
	const [state, setState] = useState<Set<number>>(new Set());
	const layout = useRef<Map<number, number>>(new Map());

	if (usersCount?.all) {
		return (
			<View style={styles.countView}>
				<View
					style={{
						backgroundColor: '#F5F6F9',
						borderRadius: 4,
						marginLeft: 26,
						marginRight: 12
					}}
				>
					<Text style={[styles.count]}>共 {usersCount.all} 人</Text>
				</View>
				{fields
					.filter(({ key }) => !!usersCount[key as keyof IDepartmentCount])
					.map(({ key, label }, index) => (
						<View
							key={key}
							style={{ flexDirection: 'row', alignItems: 'center' }}
							onLayout={(event: LayoutChangeEvent) => {
								const { y } = event.nativeEvent.layout;

								layout.current.set(index, y);
								const map = new Map<number, number>();

								layout.current.forEach((value, key) => {
									if (!map.has(value) || (map.get(value) as number) > key) {
										map.set(value, key);
									}
								});

								setState(new Set(Array.from(map.values())));
							}}
						>
							{index !== 0 ? (
								<Text style={{ color: !state.has(index) ? 'rgba(0, 0, 0, 0.26)' : '#ffffff', width: 26, textAlign: 'center' }}>
									|
								</Text>
							) : null}

							<Text style={styles.count}>
								{label} {usersCount[key as keyof IDepartmentCount]} 人
							</Text>
						</View>
					))}
			</View>
		);
	}

	return null;
};

class ContactsView extends React.Component<IContactsViewProps, IContactsViewState> {
	constructor(props: IContactsViewProps) {
		super(props);
		this.state = {
			searching: false,
			refreshing: false,
			search: []
		};
	}

	componentDidMount() {
		const { departmentId, rootId } = this.props;
		this.load(departmentId === rootId);

		this.setHeader();
	}

	componentDidUpdate(prevProps: IContactsViewProps, prevState: IContactsViewState) {
		const { departmentId } = this.props;
		const { searching } = this.state;

		if (departmentId !== prevProps?.departmentId || searching !== prevState.searching) {
			this.setHeader();
		}

		return false;
	}

	load = async (force = false) => {
		const { dispatch } = this.props;
		await new Promise((resolve, reject) =>
			dispatch(
				getContacts(
					{
						force
					},
					{
						resolve: resolve as () => void,
						reject
					}
				)
			)
		);
	};

	toggle = () => {
		this.props.dispatch(toggleCompanies(!this.props.toggle));
	};

	getHeader = () => {
		if (this.state.searching) {
			return {
				headerTitleAlign: 'left',
				headerLeft: () => null,
				headerTitle: () => (
					<View style={styles.headerTextInput}>
						<TextInput autoFocus placeholder={I18n.t('Search')} onChangeText={this.onSearchChangeText} keyboardType='default' />
					</View>
				),
				headerRight: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.cancelSearch} />
					</HeaderButton.Container>
				)
			};
		}

		const { departmentId, department, navigation, enterpriseName, rootId } = this.props;
		let headerTitle = enterpriseName;

		if (departmentId !== rootId && department?.name) {
			headerTitle = department.name;
		}

		return {
			headerTitle,
			headerTitleAlign: 'center',
			headerLeft: () =>
				rootId && this.props.departmentId !== rootId ? (
					<HeaderButton.BackButton navigation={navigation} />
				) : (
					<TouchableOpacity onPress={this.toggle} style={{ paddingHorizontal: 12 }}>
						<ListIcon />
					</TouchableOpacity>
				),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='search' onPress={this.initSearching} testID='contacts-list-view-search' />
				</HeaderButton.Container>
			)
		};
	};

	setHeader = (): void => {
		const { navigation } = this.props;
		const options = this.getHeader() as Partial<StackNavigationOptions>;
		navigation.setOptions(options);
	};

	initSearching = () => {
		this.setState({
			searching: true,
			search: this.props.search('')
		});
	};

	cancelSearch = () => {
		this.setState({
			searching: false,
			search: []
		});
	};

	onRefresh = async () => {
		this.setState({
			refreshing: true
		});

		try {
			await this.load(true);
		} catch (e) {
			console.error(e);
		}

		this.setState({
			refreshing: false
		});
	};

	onSearchChangeText = debounce((keyword: string) => {
		this.setState({
			search: this.props.search(keyword)
		});
	}, 150);

	renderDepartmentItem = ({ item }: { item: IDepartment }) => {
		const { theme } = this.props;

		return <DepartmentItem department={item} navigation={this.props.navigation} theme={theme} />;
	};

	renderUserItem = ({ item }: { item: IUserSummary }) => {
		const { theme } = this.props;

		return <UserItem user={item} theme={theme} />;
	};

	navigateMe = () => {
		const { user } = this.props;
		Navigation.navigate('RoomInfoView', {
			rid: user.username,
			t: SubscriptionType.DIRECT
		});
		// Navigation.navigate('MyView');
	};

	renderMe = () => {
		const { theme, user } = this.props;
		return (
			<View style={styles.itemViewBox}>
				<TouchableOpacity onPress={this.navigateMe}>
					<View style={styles.itemView}>
						<Avatar style={styles.userAvatar} text={user.username} size={40} />
						<Text style={[styles.userName, { color: themes[theme].titleText }]}>{I18n.t('Me')}</Text>
					</View>
				</TouchableOpacity>
				<View style={[styles.borderBottom, { borderBottomColor: themes[theme].borderColor }]} />
			</View>
		);
	};

	renderHeadBoard = () => {
		const { theme, getUsersByDepartmentId, departmentId } = this.props;
		const managers = getUsersByDepartmentId(`head_board_${departmentId}`);
		const headBoard = {
			_id: `head_board_${departmentId}`,
			name: 'Heads',
			// countIncludeChildren: { all: department?.managers?.length || 0 }
			countIncludeChildren: { all: managers.length }
		};
		return <DepartmentItem department={headBoard as IDepartment} navigation={this.props.navigation} theme={theme} />;
	};

	renderContent = () => {
		const { department, departments, users, phase, loaded, theme, departmentId, rootId } = this.props;

		const props = {} as { refreshControl?: React.ReactElement };

		if (rootId && departmentId === rootId) {
			props.refreshControl = <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />;
		}

		if (loaded) {
			const isHeadBoard = departmentId.startsWith('head_board');
			const showUsers = isHeadBoard || departments.length === 0;
			if (users.length === 0 && departments.length === 0) {
				return <Image source={require('../../static/images/none.png')} style={styles.noData} />;
			}

			return (
				<ScrollView {...props}>
					{departmentId === rootId && this.renderMe()}
					{!isHeadBoard && departments.length > 0 && this.renderHeadBoard()}
					{showUsers && <FlatList data={users} renderItem={this.renderUserItem} keyExtractor={item => item._id} />}
					<FlatList data={departments} renderItem={this.renderDepartmentItem} keyExtractor={item => item._id} />
					<DepartmentCount usersCount={department.countIncludeChildren} />
				</ScrollView>
			);
		}

		if (phase === PHASE.LOADING) {
			return <ActivityIndicator />;
		}

		return (
			<TouchableOpacity onPress={this.load}>
				<View style={styles.loadError}>
					<Text style={[styles.loadText, { color: themes[theme].titleText }]}>加载失败...</Text>
				</View>
			</TouchableOpacity>
		);
	};

	renderSearch = () => {
		const { search } = this.state;
		const { theme } = this.props;

		if (search.length) {
			return (
				<ScrollView>
					<FlatList data={this.state.search} renderItem={this.renderUserItem} keyExtractor={item => item._id} />
				</ScrollView>
			);
		}

		return (
			<View style={styles.loadError}>
				<Text style={[styles.loadText, { color: themes[theme].titleText }]}>未找到...</Text>
			</View>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { theme, user } = this.props;
		const { searching } = this.state;

		return (
			<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: themes[theme].backgroundColor }}>
				<WatermarkView
					foreground
					watermark={user.username}
					itemWidth={Dimensions.get('window').width / 2}
					itemHeight={160}
					rotateZ={-30}
					watermarkTextStyle={{ color: rgba(0, 0, 0, 0.04) }}
				>
					<StatusBar />

					{searching ? this.renderSearch() : this.renderContent()}
				</WatermarkView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState, props: IBaseScreen<ContactsStackParamList, 'ContactsView'>) => {
	const rootId = state.contacts.departmentMap?.root?._id || '';
	const departmentId = (props.route.params?.departmentId || rootId || '') as string;
	const { departmentMap = {}, userMap = {}, phase } = state.contacts;

	const getDepartmentById = (departmentId: string) => {
		if (departmentId.startsWith('head_board')) {
			const users = getUsersByDepartmentId(departmentId);
			return {
				_id: `head_board_${departmentId}`,
				name: 'Heads',
				countIncludeChildren: { all: users.length }
			};
		}
		return departmentMap[departmentId];
	};
	// const getUserById = (userId: string) => userMap[userId];
	const getBoss = (): IUserSummary | undefined => Object.values(userMap).find(a => a.name === '詹克团');
	const getUsersByDepartmentId = (departmentId: string): IUserSummary[] => {
		if (!departmentId) {
			return [];
		}

		const getHeadsByDepartmentId = (departmentId: string): number[] => {
			const department = departmentMap[departmentId];
			const departments = getDepartmentsByParentId(departmentId);
			return departments.length === 0
				? department.managers || []
				: Array.from(new Set([...(department?.managers || []), ...(department?.users || [])]));
		};
		const isHeadBoard = departmentId.startsWith('head_board');
		const departments = getDepartmentsByParentId(departmentId);
		if (isHeadBoard) {
			departmentId = departmentId.substring(11);
			let users = getHeadsByDepartmentId(departmentId);
			if (departmentId === departmentMap.root?._id) {
				const departments = getDepartmentsByParentId(departmentId);
				departments.forEach(dep => {
					if (dep.type === 'L3D') {
						const managers = getHeadsByDepartmentId(dep._id);
						users = [...users, ...managers];
					}
				});

				const boss = getBoss();
				if (boss) {
					users.unshift(boss.username);
				}
			}

			return Array.from(new Set(users))
				.map(user => userMap[user])
				.filter(user => !!user);
		}

		if (departments.length > 0) {
			return []; // 只有最底层部门和heads才展示人员
		}

		const users = Array.from(
			new Set([...(departmentMap[departmentId]?.managers || []), ...(departmentMap[departmentId]?.users || [])])
		);

		return users.map(user => userMap[user]).filter(user => !!user);
	};

	const getDepartmentsByParentId = (departmentId: string): IDepartment[] => {
		const departments = departmentMap[departmentId]?.children?.map(id => departmentMap[id]) || [];
		return departments.filter(department => !!department);
	};

	const search = (keyword: string): IUserSummary[] => {
		const regexp = new RegExp(escapeRegExp(keyword), 'i');

		return sortBy(
			Object.values(userMap).filter(user => (user.name && regexp.test(user.name)) || regexp.test(user.username)),
			user => user.pinyin
		);
	};

	return {
		search,
		phase,
		loaded: Boolean(Object.keys(userMap).length),
		departmentId,
		user: getUserSelector(state),
		rootId,
		enterpriseId: state.settings.Enterprise_ID || COMPANY_ID,
		enterpriseName: state.settings.Enterprise_Name || COMPANY_NAME,
		getUsersByDepartmentId,
		departments: getDepartmentsByParentId(departmentId),
		users: getUsersByDepartmentId(departmentId),
		department: getDepartmentById(departmentId),
		toggle: state.company.toggle
	};
};

export default connect(mapStateToProps)(withDimensions(withTheme(withSafeAreaInsets(ContactsView))));
