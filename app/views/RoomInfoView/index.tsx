import React from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import UAParser from 'ua-parser-js';
import isEmpty from 'lodash/isEmpty';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { Observable, Subscription } from 'rxjs';

import { TIconsName } from '../../containers/CustomIcon';
import Status from '../../containers/Status';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import log, { events, logEvent } from '../../utils/log';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { MarkdownPreview } from '../../containers/markdown';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import SafeAreaView from '../../containers/SafeAreaView';
import { MaleIcon, FemaleIcon } from '../../containers/SvgIcons';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import Navigation from '../../lib/navigation/appNavigation';
import Direct from './Direct';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import {
	SubscriptionType,
	TSubscriptionModel,
	ISubscription,
	IUser,
	IApplicationState,
	IDepartment,
	IRoomSettings
} from '../../definitions';
import { ILivechatVisitor } from '../../definitions/ILivechatVisitor';
import { getRoomTitle, getUidDirectMessage, hasPermission } from '../../lib/methods';
import { getDepartment, getRoles } from '../../sagas/contacts';
import { Services } from '../../lib/services';
import { COMPANY_ID } from '../../lib/constants/contacts';
import ChatIcon from '../../containers/Icon/Chat';
import Okr from './Okr';
import { showErrorAlert } from '../../utils/info';
// import { showToast } from '../../lib/methods/helpers/showToast';

interface IRoomInfoViewProps {
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'RoomInfoView'>,
		StackNavigationProp<MasterDetailInsideStackParamList>
	>;
	route: RouteProp<ChatsStackParamList, 'RoomInfoView'>;
	rooms: string[];
	theme: TSupportedThemes;
	isMasterDetail: boolean;
	jitsiEnabled: boolean;
	enterpriseId: string;
	roleSortSetting: string;
	departmentMap: Record<string, IDepartment>;
	editRoomPermission?: string[];
	editOmnichannelContact?: string[];
	editLivechatRoomCustomfields?: string[];
	roles: { [key: string]: string };
}

export interface IUserParsed extends IUser {
	parsedRoles?: string[];
	userOTKR: Record<string, any>;
}

export interface ILivechatVisitorModified extends ILivechatVisitor {
	os?: string;
	browser?: string;
}

interface IRoomInfoViewState {
	room: ISubscription;
	roomUser: IUserParsed | ILivechatVisitorModified;
	showEdit: boolean;
	inputText: string;
}

class RoomInfoView extends React.Component<IRoomInfoViewProps, IRoomInfoViewState> {
	private rid: string;

	private t: SubscriptionType;

	private unsubscribeFocus?: () => void;

	private subscription?: Subscription;

	private roomObservable?: Observable<TSubscriptionModel>;

	private isOuterUser?: boolean;

	private importIds?: string[];

	private inputRef: TextInput;

	private positions?: {
		[key: string]: string[];
	};

	constructor(props: IRoomInfoViewProps) {
		super(props);
		const room = props.route.params?.room;
		const roomUser = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.isOuterUser = props.route.params?.isOuterUser;
		this.importIds = props.route.params?.importIds;
		this.positions = props.route.params?.positions;
		// @ts-ignore
		this.state = {
			room: (room || { rid: this.rid, t: this.t }) as any,
			roomUser: roomUser || {},
			showEdit: false,
			inputText: room?.fname ? room?.fname : room?.dname
		};
	}

	componentDidMount() {
		if (this.isDirect) {
			this.loadUser();
		} else {
			this.loadRoom();
		}
		this.setHeader();

		const { navigation } = this.props;
		this.unsubscribeFocus = navigation.addListener('focus', () => {
			if (this.isLivechat) {
				this.loadVisitor();
			}
		});
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
	}

	setHeader = () => {
		const { navigation, route } = this.props;
		const t = route.params?.t;
		const showCloseModal = route.params?.showCloseModal;
		let headerTitle = '';
		switch (t) {
			case SubscriptionType.DIRECT:
				headerTitle = I18n.t('User_Info');
				break;
			case SubscriptionType.CHANNEL:
				headerTitle = '修改频道主题';
				break;
			default:
				headerTitle = '修改项目名称';
				break;
		}
		navigation.setOptions({
			headerTitleAlign: 'center',
			headerLeft: showCloseModal
				? () => <HeaderButton.CloseModal navigation={navigation} />
				: () => <HeaderButton.BackButton navigation={navigation} />,
			title: headerTitle
			// headerRight:
			// 	showEdit && t !== SubscriptionType.GROUP
			// 		? () => (
			// 				<HeaderButton.Container>
			// 					<HeaderButton.Item
			// 						iconName='edit'
			// 						onPress={() => {
			// 							const isLivechat = t === SubscriptionType.OMNICHANNEL;
			// 							logEvent(events[`RI_GO_${isLivechat ? 'LIVECHAT' : 'RI'}_EDIT`]);
			// 							navigation.navigate(isLivechat ? 'LivechatEditView' : 'RoomInfoEditView', { rid, room, roomUser });
			// 						}}
			// 						testID='room-info-view-edit-button'
			// 					/>
			// 				</HeaderButton.Container>
			// 		  )
			// 		: undefined
		});
	};

	get isDirect() {
		const { room } = this.state;
		return room.t === SubscriptionType.DIRECT;
	}

	get isLivechat() {
		const { room } = this.state;
		return room.t === SubscriptionType.OMNICHANNEL;
	}

	getRoleDescription = (id: string) => {
		const { roles } = this.props;
		return roles[id];
	};

	loadVisitor = async () => {
		const { room } = this.state;
		try {
			if (room.visitor?._id) {
				const result = await Services.getVisitorInfo(room.visitor._id);
				if (result.success) {
					const { visitor } = result;
					const params: { os?: string; browser?: string } = {};
					if (visitor.userAgent) {
						const ua = new UAParser();
						ua.setUA(visitor.userAgent);
						params.os = `${ua.getOS().name} ${ua.getOS().version}`;
						params.browser = `${ua.getBrowser().name} ${ua.getBrowser().version}`;
					}
					this.setState({ roomUser: { ...visitor, ...params } as ILivechatVisitorModified }, () => this.setHeader());
				}
			}
		} catch (error) {
			// Do nothing
		}
	};

	parseRoles = (roleArray: string[]) =>
		Promise.all(
			roleArray.map(async role => {
				const description = await this.getRoleDescription(role);
				return description;
			})
		);

	loadUser = async () => {
		const { room, roomUser } = this.state;

		if (isEmpty(roomUser)) {
			try {
				const roomUserId = getUidDirectMessage(room);
				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					const { user } = result;
					const { roles } = user;
					const parsedRoles: { parsedRoles?: string[] } = {};
					if (roles && roles.length) {
						parsedRoles.parsedRoles = await this.parseRoles(roles);
					}
					user.importIds = this.importIds || user.importIds;
					user.positions = this.positions || user.positions;
					this.setState({ roomUser: { ...user, ...parsedRoles } as IUserParsed });
				}
			} catch {
				// do nothing
			}
		} else {
			try {
				const { roles } = roomUser as IUserParsed;
				if (roles && roles.length) {
					const parsedRoles = await this.parseRoles(roles);
					this.setState({ roomUser: { ...roomUser, parsedRoles } });
				} else {
					this.setState({ roomUser });
				}
			} catch (e) {
				// do nothing
			}
		}
	};

	loadRoom = async () => {
		const { room: roomState } = this.state;
		const { route, editRoomPermission, editOmnichannelContact, editLivechatRoomCustomfields } = this.props;
		let room = route.params?.room as any;
		const roomModel = room as TSubscriptionModel;
		if (roomModel && roomModel.observe) {
			this.roomObservable = roomModel.observe();
			this.subscription = this.roomObservable.subscribe(changes => {
				this.setState({ room: changes }, () => this.setHeader());
			});
		} else {
			try {
				const result = await Services.getRoomInfo(this.rid);
				if (result.success) {
					({ room } = result);
					this.setState({ room: { ...roomState, ...room } });
				}
			} catch (e) {
				log(e);
			}
		}

		const permissionToEdit = this.isLivechat ? [editOmnichannelContact, editLivechatRoomCustomfields] : [editRoomPermission];

		const permissions = await hasPermission(permissionToEdit, room.rid);
		if (permissions.some(Boolean) || room.prid) {
			this.setState({ showEdit: true }, () => this.setHeader());
		}
	};

	createDirect = () =>
		new Promise<void>(async (resolve, reject) => {
			const { route } = this.props;

			// We don't need to create a direct
			const member = route.params?.member;
			if (!isEmpty(member)) {
				return resolve();
			}

			// TODO: Check if some direct with the user already exists on database
			try {
				const {
					roomUser: { username }
				} = this.state;
				const result = await Services.createDirectMessage(username);
				if (result.success) {
					const {
						room: { rid }
					} = result;
					return this.setState(({ room }) => ({ room: { ...room, rid } }), resolve);
				}
			} catch {
				// do nothing
			}
			reject();
		});

	goRoom = () => {
		logEvent(events.RI_GO_ROOM_USER);
		const { roomUser, room } = this.state;
		const { name, username } = roomUser;
		const { rooms, navigation, isMasterDetail } = this.props;
		const params = {
			rid: room.rid,
			name: getRoomTitle({
				t: room.t,
				fname: name,
				name: username
			}),
			t: room.t,
			roomUserId: getUidDirectMessage(room)
		};

		if (room.rid) {
			// if it's on master detail layout, we close the modal and replace RoomView
			if (isMasterDetail) {
				Navigation.navigate('DrawerNavigator');
				goRoom({ item: params, isMasterDetail });
			} else {
				let navigate = navigation.push;
				// if this is a room focused
				if (rooms.includes(room.rid)) {
					({ navigate } = navigation);
				}
				const state = navigation.getState(); // 获取当前navigation的状态
				const currentRoutes = state.routes;

				// 对比本次导航的参数 是否在栈中存在相同导航（navigate 类似功能是相同的房间直接跳转到之前的路由
				const existingRoute = currentRoutes.find(
					({ params: routesParams, name }) => routesParams?.rid === params.rid && name === 'RoomView'
				);

				if (existingRoute) return navigation.navigate('RoomView', params);

				navigate('RoomView', params);
			}
		}
	};

	renderAvatar = (room: ISubscription, roomUser: IUserParsed, size = 80, borderRadius?: number) => {
		const { theme } = this.props;

		return (
			<Avatar
				borderRadius={borderRadius}
				text={room.name || roomUser.username}
				style={styles.avatar}
				type={this.t}
				size={size}
				rid={room?.rid}
			>
				{this.t === SubscriptionType.DIRECT && roomUser._id ? (
					<View style={[sharedStyles.status1, { backgroundColor: themes[theme].auxiliaryBackground }]}>
						<Status size={20} id={roomUser._id} />
					</View>
				) : null}
			</Avatar>
		);
	};

	renderButton = (onPress: () => void, iconName: TIconsName, text: string) => {
		const { theme } = this.props;

		const onActionPress = async () => {
			try {
				if (this.isDirect) {
					await this.createDirect();
				}
				onPress();
			} catch {
				EventEmitter.emit(LISTENER, {
					message: I18n.t('error-action-not-allowed', { action: I18n.t('Create_Direct_Messages') })
				});
			}
		};

		return (
			<TouchableOpacity onPress={onActionPress} style={[styles.roomButton1]}>
				<View style={styles.chatIcon}>
					<ChatIcon />
				</View>
				<Text style={[styles.roomButtonText, { color: themes[theme].titleText }]}>{text}</Text>
			</TouchableOpacity>
		);
	};

	renderRoles(user: IUserParsed, deps: string[]) {
		const { theme, roleSortSetting } = this.props;
		const total = deps.length;
		const positions = user.positions || {};
		const roleSort = roleSortSetting ? roleSortSetting.split(',').reverse() : [];
		return (
			<View style={[styles.box, styles.roleBox, { backgroundColor: themes[theme].backgroundColor }]}>
				<View style={styles.cardTitle}>
					<Text style={styles.cardTitleText}>{I18n.t('Employee_Roles')}</Text>
				</View>
				<View style={styles.depList}>
					{deps.map((id, index) => (
						<View style={[styles.depListItem, index + 1 === total && styles.lastListItem]}>
							<View style={styles.roleList}>
								{(positions[id] || getRoles(id))
									?.sort((a, b) => roleSort.indexOf(b) - roleSort.indexOf(a))
									?.map(role => (
										<View style={styles.roleItem}>
											<Text style={styles.roleItemText}>{role}</Text>
										</View>
									))}
							</View>
							<Text style={styles.depItemInfo}>{getDepartment(id).slice(2).join('/')}</Text>
						</View>
					))}
				</View>
			</View>
		);
	}

	renderDirectInfo() {
		const { room, roomUser } = this.state;
		const { theme, departmentMap, enterpriseId } = this.props;
		const user = roomUser as IUserParsed;
		const roomUserParsed = roomUser as IUserParsed;
		const roleDeps = user?.importIds?.filter(id => id.indexOf('OU=委员会') > -1);
		const getDepartmentsByParentId = (departmentId: string): IDepartment[] => {
			const departments = departmentMap[departmentId]?.children?.map(id => departmentMap[id]) || [];
			return departments.filter(department => !!department);
		};
		if (roleDeps && roleDeps.length > 0) {
			// EMT > AMT > PDT > 其他委员会
			// const sortKeys = ['EMT', 'AMT', 'PDT'].reverse();
			const depsSort = getDepartmentsByParentId(`${enterpriseId},委员会`);
			const sortKeys = depsSort.map((dep: IDepartment) => dep._id.split(',')[2]).reverse();
			roleDeps.sort((a, b) => {
				const depA = getDepartment(a)[2];
				const depB = getDepartment(b)[2];
				return sortKeys.indexOf(depB) - sortKeys.indexOf(depA);
			});
		}
		return (
			<>
				<View style={[styles.headerWrapper, { backgroundColor: themes[theme].backgroundColor }]}>
					<View style={styles.headerInner}>
						{this.renderAvatar(room, roomUserParsed, 56, 56)}
						<View style={styles.headerRight}>
							<View style={styles.row}>
								<Text style={[styles.roomTitle, { color: themes[theme].titleText }]}>{roomUserParsed?.name}</Text>
								{user.sexId === 2 ? <FemaleIcon style={{ marginLeft: 10 }} /> : <MaleIcon style={{ marginLeft: 10 }} />}
							</View>
							<View style={styles.row}>
								{user.workPlaceName && (
									<View style={styles.workerType}>
										<Text style={styles.position}>{user.workPlaceName}</Text>
									</View>
								)}
								{user.employeeType && (
									<View style={styles.workerType}>
										<Text style={styles.workerTypeText}>{user.employeeID}</Text>
									</View>
								)}
							</View>
						</View>

						{this.isOuterUser ? null : this.renderButton(this.goRoom, 'message', I18n.t('Message'))}
					</View>
					{!!roomUserParsed?.statusText && (
						<View style={styles.status} testID='room-info-view-custom-status'>
							<MarkdownPreview
								msg={`“ ${roomUserParsed?.statusText} ”`}
								numberOfLines={0}
								style={[styles.roomUsername, styles.directRoomStatus, { color: themes[theme].auxiliaryText }]}
							/>
						</View>
					)}
				</View>

				<Direct user={user} theme={theme} />

				{roleDeps?.length ? this.renderRoles(user, roleDeps) : null}

				<Okr username={roomUser.username} theme={theme} />
			</>
		);
	}

	onInputChangeText = (text: string) => {
		const { room } = this.state;
		console.info(room.name);
		this.setState({ inputText: text });
	};

	submit = async () => {
		logEvent(events.RI_EDIT_SAVE);
		Keyboard.dismiss();
		const { room } = this.state;

		// sendLoadingEvent({ visible: true });
		let error = false;

		const params = {} as IRoomSettings;
		// Name
		params.roomName = this.state.inputText;

		try {
			await Services.saveRoomSettings(room.rid, params);
		} catch (e: any) {
			if (e.error === 'error-invalid-room-name') {
				this.setState({ nameError: e });
			}
			error = true;
			log(e);
		}

		setTimeout(() => {
			// sendLoadingEvent({ visible: false });
			if (error) {
				logEvent(events.RI_EDIT_SAVE_F);
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_settings') }));
			} else {
				// showToast(I18n.t('Settings_succesfully_changed'));
				const { navigation } = this.props;
				navigation.goBack();
			}
		}, 100);
	};

	renderInfo() {
		const { room, roomUser, inputText, showEdit } = this.state;
		const { theme } = this.props;
		const canEdit: false | string = (room.fname ? room.fname : room.dname) !== inputText && inputText;
		return (
			<>
				<View style={{ backgroundColor: 'white', flexDirection: 'column', width: '100%', height: '100%', alignItems: 'center' }}>
					<View style={{ alignItems: 'center', height: 50, justifyContent: 'center', marginTop: 30 }}>
						<Text style={{ fontSize: 18 }}>修改名称后，将在群内通知其他成员</Text>
					</View>
					<View style={{ height: 0.5, width: '80%', backgroundColor: themes[theme].auxiliaryBackground, marginTop: 20 }}></View>
					<View style={{ flexDirection: 'row', width: '100%', paddingVertical: 5, paddingHorizontal: 20 }}>
						<Avatar
							borderRadius={5}
							text={room.name || roomUser.username}
							style={styles.avatar}
							type={this.t}
							size={50}
							rid={room?.rid}
						>
							{this.t === SubscriptionType.DIRECT && roomUser._id ? (
								<View style={[sharedStyles.status1, { backgroundColor: themes[theme].auxiliaryBackground }]}>
									<Status size={20} id={roomUser._id} />
								</View>
							) : null}
						</Avatar>
						<TextInput
							style={{ width: '100%', height: '100%', marginHorizontal: 15, fontSize: 18 }}
							onChangeText={this.onInputChangeText}
							clearButtonMode='unless-editing'
							placeholder='请输入名称'
							keyboardType='default'
							editable={showEdit}
							ref={ref => {
								// @ts-ignore
								this.inputRef = ref;
							}}
						>
							{room.fname ? room.fname : room.dname}
						</TextInput>
					</View>
					<View style={{ height: 0.5, width: '80%', backgroundColor: themes[theme].auxiliaryBackground }}></View>
					<KeyboardAvoidingView behavior={'position'} keyboardVerticalOffset={120}>
						<TouchableOpacity
							style={{
								alignItems: 'center',
								justifyContent: 'center',
								width: 100,
								backgroundColor: !canEdit ? '#E7E7E7' : '#5E94FF',
								height: 35,
								borderRadius: 7,
								marginTop: 400
							}}
							disabled={!canEdit}
							onPress={() => this.submit()}
						>
							<Text style={{ fontSize: 18, color: 'white' }}>完成</Text>
						</TouchableOpacity>
					</KeyboardAvoidingView>
				</View>
			</>
		);
	}

	render() {
		const { theme } = this.props;

		return (
			<ScrollView style={[styles.scroll, { backgroundColor: this.isDirect ? themes[theme].auxiliaryBackground : 'white' }]}>
				<StatusBar />
				<SafeAreaView testID='room-info-view'>{this.isDirect ? this.renderDirectInfo() : this.renderInfo()}</SafeAreaView>
			</ScrollView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	rooms: state.room.rooms, // todo 暂时没用
	isMasterDetail: state.app.isMasterDetail,
	enterpriseId: state.settings.Enterprise_ID || COMPANY_ID,
	roleSortSetting: state.settings.Appia_Role_Sort_Settings || '',
	departmentMap: state.contacts.departmentMap,
	jitsiEnabled: (state.settings.Jitsi_Enabled as boolean) || false,
	editRoomPermission: state.permissions['edit-room'],
	editOmnichannelContact: state.permissions['edit-omnichannel-contact'],
	editLivechatRoomCustomfields: state.permissions['edit-livechat-room-customfields'],
	roles: state.roles
});

// @ts-ignore
export default connect(mapStateToProps)(withTheme(RoomInfoView));
