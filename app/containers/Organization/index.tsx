import React from 'react';
import { FlatList, ScrollView, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import { IApplicationState, IDepartment, IUserSummary } from '../../definitions';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import { CheckboxHalfChecked } from '../SvgIcons';
import DepartmentItem from '../../views/ContactsView/DepartmentItem';
import UserItem from '../../views/ContactsView/UserItem';
import { getContacts } from '../../actions/contacts';
import { COMPANY_NAME } from '../../lib/constants/contacts';
import { IContacts } from '../../reducers/contacts';
import { ISelectedUser } from '../../reducers/selectedUsers';
import store from '../../lib/store';

interface IOrganizationProps {
	theme: TSupportedThemes;
	selectedUsers: ISelectedUser[];
	onPress: (users: IUserSummary[], checked: boolean) => void;
	setPageTitle: (title?: string) => void;
	setOrgHistory: (orgHistory: IDepartment[]) => void;
	disabledUsers?: ISelectedUser[];
	onRef: (ref: any) => void;
}

interface IOrganizationViewProps extends IOrganizationProps {
	theme: TSupportedThemes;
	rootId: string;
	enterpriseName: string;
	contacts: IContacts;
}

interface IOrganizationState {
	loading: boolean;
	department: IDepartment;
	departments: IDepartment[];
	users: IUserSummary[];
}

class Organization extends React.PureComponent<IOrganizationViewProps, IOrganizationState> {
	orgHistory: IDepartment[];
	constructor(props: IOrganizationViewProps) {
		super(props);
		const { rootId, enterpriseName } = props;
		const company = { _id: rootId, name: enterpriseName } as IDepartment;
		this.orgHistory = [company];
		this.state = {
			loading: false,
			department: company,
			departments: [],
			users: []
		};
	}

	componentDidMount() {
		// 将组件实例this传递给onRef方法
		this.props.setOrgHistory([...this.orgHistory]);
		this.props.onRef(this);
		const { rootId, contacts } = this.props;
		if (contacts?.departmentMap && Object.keys(contacts.departmentMap).length) {
			this.getListByDepartment(rootId);
		} else {
			this.load();
		}
	}

	getListByDepartment = (departmentId: string) => {
		// const { departmentMap } = this.props.contacts;
		const { contacts, rootId, enterpriseName } = this.props;

		const department = contacts.departmentMap[departmentId];
		const title = departmentId === rootId ? enterpriseName : department.name;
		this.props.setPageTitle(title);
		const users = this.getUsersByDepartmentId(departmentId);
		const departments = this.getDepartmentsByParentId(departmentId);

		this.setState({ department, users, departments });
	};

	getUsersByDepartmentId = (departmentId: string) => {
		const { departmentMap, userMap } = this.props.contacts;
		const users = Array.from(
			new Set([...(departmentMap[departmentId]?.managers || []), ...(departmentMap[departmentId]?.users || [])])
		);
		return users.map(user => userMap[user]).filter(user => !!user);
	};

	getDepartmentsByParentId = (departmentId: string) => {
		const { departmentMap } = this.props.contacts;
		const departments = departmentMap[departmentId]?.children?.map(id => departmentMap[id]) || [];

		return departments.filter(department => !!department);
	};

	getAllUsersByDepartmentId = (departmentId: string) => {
		const result = this.getUsersByDepartmentId(departmentId);
		const departments = this.getDepartmentsByParentId(departmentId);
		departments.forEach(a => {
			const arr = this.getAllUsersByDepartmentId(a._id);
			// 合并时需要去重
			arr.forEach(b => {
				if (!result.find(c => c._id === b._id)) {
					result.push(b);
				}
			});
		});
		return result;
	};

	finished = () => {
		const { rootId } = this.props;
		this.setState({ loading: false });
		this.getListByDepartment(rootId);
	};

	load = (force = false) => {
		this.setState({ loading: true });
		new Promise(() => store.dispatch(getContacts({ force }, { resolve: this.finished, reject: this.finished })));
	};

	goPrev = () => {
		this.orgHistory.pop();
		const parent = this.orgHistory[this.orgHistory.length - 1];
		if (parent) {
			this.getListByDepartment(parent._id);
			this.props.setOrgHistory([...this.orgHistory]);
		}
		return parent;
	};

	goNext = (item: IDepartment) => {
		this.orgHistory.push(item);
		this.getListByDepartment(item._id);
		this.props.setOrgHistory([...this.orgHistory]);
	};

	jump = (orgId: string) => {
		const index = this.orgHistory.findIndex(a => a._id === orgId);
		if (index > -1) {
			this.getListByDepartment(orgId);
			this.orgHistory = this.orgHistory.slice(0, index + 1);
			this.props.setOrgHistory([...this.orgHistory]);
		}
	};

	renderDepartmentItem = ({ item }: { item: IDepartment }) => {
		const { theme, selectedUsers, onPress } = this.props;
		const depUsers = this.getAllUsersByDepartmentId(item._id);

		const includeAll =
			depUsers.length &&
			depUsers.every(user =>
				selectedUsers.some(
					a => a.userId === user._id || user.username === a.name || a.username === user.username || a.username === user.name
				)
			);
		const includeSome = depUsers.some(user =>
			selectedUsers.some(
				a =>
					a.username === user.name ||
					a.username === user.username ||
					a.name === user.username ||
					a.userId === user._id ||
					a._id === user._id
			)
		);

		return (
			<View style={{ flexDirection: 'row' }}>
				<View style={{ marginLeft: includeSome ? 18 : 15, alignSelf: 'center' }}>
					<TouchableOpacity onPress={() => onPress(depUsers, !includeAll)}>
						{includeAll || !includeSome ? (
							<CustomIcon
								// onPress={this.}
								name={includeAll ? 'checkbox-checked' : 'checkbox-unchecked'}
								size={24}
								style={{ alignSelf: 'center', opacity: depUsers.length ? 1 : 0.2 }}
								color={includeAll ? themes[theme].actionTintColor : themes[theme].auxiliaryText}
							/>
						) : (
							<CheckboxHalfChecked />
						)}
					</TouchableOpacity>
				</View>
				<DepartmentItem department={item} onPress={() => this.goNext(item)} theme={theme} />
			</View>
		);
	};

	renderUserItem = ({ item }: { item: IUserSummary }) => {
		const { theme, selectedUsers, onPress, disabledUsers } = this.props;
		const checked = selectedUsers.some(
			a =>
				a.username === item.username ||
				a.name === item.username ||
				a.name === item.name ||
				a.username === item.name ||
				a.userId === item._id ||
				a._id === item._id
		);
		const disabled =
			disabledUsers &&
			disabledUsers.some(
				a =>
					a.username === item.username ||
					a.name === item.username ||
					a.name === item.name ||
					a.username === item.name ||
					a.userId === item._id ||
					a._id === item._id
			);
		return (
			<TouchableOpacity onPress={() => !disabled && onPress([item], !checked)}>
				<View style={{ flexDirection: 'row' }}>
					<CustomIcon
						name={checked ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={24}
						style={{ marginLeft: 15, alignSelf: 'center', opacity: disabled ? 0.4 : 1 }}
						color={checked ? themes[theme].actionTintColor : themes[theme].auxiliaryText}
					/>
					<UserItem user={item} theme={theme} pressDisabled={true} />
				</View>
			</TouchableOpacity>
		);
	};

	render() {
		const { theme } = this.props;
		const { loading, departments, users } = this.state;

		const footer = loading ? <ActivityIndicator style={{ paddingTop: 80 }} color={themes[theme].auxiliaryText} /> : null;

		return (
			<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>
				<FlatList data={users} renderItem={this.renderUserItem} keyExtractor={item => item._id} ListFooterComponent={footer} />
				<FlatList data={departments} renderItem={this.renderDepartmentItem} keyExtractor={item => item._id} />
			</ScrollView>
		);

		// return (
		// 	<TouchableOpacity onPress={this.load}>
		// 		<View style={{ flex: 1, alignContent: 'center', justifyContent: 'center' }}>
		// 			<Text style={{ textAlign: 'center', fontSize: 16, color: themes[theme].titleText }}>加载失败...</Text>
		// 		</View>
		// 	</TouchableOpacity>
		// );
	}
}

const mapStateToProps = (state: IApplicationState, props: IOrganizationProps) => ({
	...props,
	rootId: state.contacts.departmentMap?.root?._id,
	enterpriseName: state.settings.Enterprise_Name || COMPANY_NAME,
	contacts: state.contacts
});

export default connect(mapStateToProps)(Organization);
// export default Organization;
