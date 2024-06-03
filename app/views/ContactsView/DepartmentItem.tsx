import { Image, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

import styles from './styles';
import { CustomIcon } from '../../containers/CustomIcon';
import { IDepartment } from '../../definitions';
import { ContactsStackParamList } from '../../stacks/types';
import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import UserIcon from '../../containers/Icon/User';

interface IProps {
	department: IDepartment;
	navigation?: StackNavigationProp<ContactsStackParamList>;
	theme: TSupportedThemes;
	onPress?: () => void;
}

const getIcon = (department: IDepartment) => {
	if (!department) {
		return require('../../static/images/contacts/organization.png');
	}

	if (department._id.startsWith('head_board')) {
		return require('../../static/images/contacts/heads.png');
	}

	if (department.type === 'PMT') {
		return require('../../static/images/contacts/pmt.png');
	}

	if (department.type === 'PDT') {
		return require('../../static/images/contacts/pdt.png');
	}

	if (department.type === 'L1D') {
		return require('../../static/images/contacts/l1d.png');
	}

	if (department.type === 'L3D') {
		return require('../../static/images/contacts/l3d.png');
	}

	return require('../../static/images/contacts/organization.png');
};

const DepartmentItem: React.FC<IProps> = ({ department, navigation, theme, onPress }) => {
	const icon = getIcon(department);
	return (
		<View style={styles.itemViewBox}>
			<TouchableOpacity
				onPress={() => (onPress ? onPress() : navigation?.push('ContactsView', { departmentId: department._id }))}
			>
				<View style={styles.itemView}>
					<Image source={icon} style={styles.departmentIcon} />
					<Text style={[styles.departmentName, { color: themes[theme].titleText }]}>{department.name}</Text>
					{department.countIncludeChildren?.all !== undefined ? (
						<View style={styles.departmentCountWrapper}>
							<UserIcon />
							<Text style={{ marginLeft: 5, color: 'rgba(0, 0, 0, 0.4)' }}>{department.countIncludeChildren.all}</Text>
						</View>
					) : null}
					<CustomIcon name='chevron-right' size={18} color='rgba(0, 0, 0, 0.26)' style={styles.departmentArrow} />
				</View>
			</TouchableOpacity>
			<View style={[styles.borderBottom, { borderBottomColor: themes[theme].borderColor }]} />
		</View>
	);
};

export default DepartmentItem;
