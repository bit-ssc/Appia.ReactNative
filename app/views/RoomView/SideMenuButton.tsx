import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';

import { IApplicationState } from '../../definitions';
import { Services } from '../../lib/services';
import Navigation from '../../lib/navigation/appNavigation';

const styles = StyleSheet.create({
	toggleWrapper: {
		position: 'absolute',
		bottom: 160,
		right: 0
	},
	btn: {
		width: 96,
		height: 96
	}
});

export interface StaffServiceButtonProps {
	rid: string;
}

const SideMenuButton: React.FC<StaffServiceButtonProps> = ({ rid }) => {
	const btn = useSelector(
		useCallback((state: IApplicationState) => {
			const str = (state.settings.Appia_Room_Side_Menu_StaffServiceButton as string) || 'GENERAL';

			return new Set(str.split(','));
		}, [])
	);

	const onPress = useCallback(async () => {
		const name = 'staffService.bot';
		const result = await Services.createDirectMessage(name);
		if (result.success) {
			const { room } = result;
			const params = {
				rid: room.rid,
				t: room.t,
				name: '员工服务',
				roomUserId: name
			};

			Navigation.replace('RoomView', params);
		}
	}, []);

	if (rid && btn.has(rid)) {
		return (
			<TouchableOpacity onPress={onPress} style={styles.toggleWrapper}>
				<Image style={styles.btn} source={require('./StaffService/btn.png')} />
			</TouchableOpacity>
		);
	}

	return null;
};

export default SideMenuButton;
