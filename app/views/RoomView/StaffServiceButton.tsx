import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import AgentIcon from './StaffService/Agent';
import RobotIcon from './StaffService/Robot';
import { getStaffServiceAssignType, postStaffServiceAgent, postStaffServiceAgentClose } from '../../lib/services/restApi';
import { AssignType } from '../../definitions/rest/v1/udesk';
import I18n from '../../i18n';
import { IApplicationState } from '../../definitions';

const styles = StyleSheet.create({
	toggleWrapper: {
		position: 'absolute',
		top: 134,
		right: 0,
		backgroundColor: '#fff',
		paddingHorizontal: 3,
		paddingVertical: 6,
		borderTopLeftRadius: 12,
		borderBottomLeftRadius: 12
	}
});

export interface StaffServiceButtonProps {
	name?: string;
	rid: string;
}
const icons = {
	[AssignType.urobot]: {
		icon: AgentIcon,
		label: 'ToAgent'
	},
	[AssignType.agent]: {
		icon: RobotIcon,
		label: 'ToRobot'
	}
};

const StaffServiceButton: React.FC<StaffServiceButtonProps> = ({ name, rid }) => {
	const [type, setType] = useState<AssignType | null>(null);
	const staffServiceNames = useSelector(
		useCallback((state: IApplicationState) => state.settings.Staff_Service_Names, [])
	) as string;
	const onPress = async () => {
		if (type === AssignType.agent) {
			await postStaffServiceAgentClose(rid);
			setType(AssignType.urobot);
		} else if (type === AssignType.urobot) {
			await postStaffServiceAgent(rid);
			setType(AssignType.agent);
		}
	};

	useEffect(() => {
		const names = (staffServiceNames || '').split(',');

		if (name && names.includes(name)) {
			getStaffServiceAssignType(rid)
				.then(assignType => {
					if (assignType) {
						setType(assignType as unknown as AssignType);
					}
				})
				.catch(() => {
					setType(null);
				});
		} else {
			setType(null);
		}
	}, [name, rid, staffServiceNames]);

	if (type && icons[type]) {
		const { icon: Icon, label } = icons[type];

		return (
			<TouchableOpacity onPress={onPress} style={styles.toggleWrapper}>
				<View style={{ alignSelf: 'center' }}>
					<Icon width='24' height='24' />
				</View>
				<Text>{I18n.t(label)}</Text>
			</TouchableOpacity>
		);
	}

	return null;
};

export default StaffServiceButton;
