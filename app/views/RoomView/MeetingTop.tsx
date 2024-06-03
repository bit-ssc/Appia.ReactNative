import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../../containers/CustomIcon';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { Services } from '../../lib/services';
import sharedStyles from '../Styles';
import useTimeToHHMMSS from './hooks/useTimeToHHMMSS';

const { width: phoneW } = Dimensions.get('window');

interface IBannerProps {
	roomId: string;
	toMessage: (messageId: string) => Promise<void>;
	username: string;
}

interface MeetingTitle {
	subject: string;
	startTime: string;
	meetingRoomName: string;
	messageId: null | string;
}

const MeetingTop = React.memo(({ roomId, toMessage, username }: IBannerProps) => {
	const { theme } = useTheme();
	// 展示数据
	const [data, setData] = useState<MeetingTitle>({
		subject: '',
		startTime: '',
		meetingRoomName: '',
		messageId: null
	});
	// 将时间转化为正确的格式
	const { changeTime } = useTimeToHHMMSS();
	// 请求消息
	useEffect(() => {
		Services.getMeetingTop(roomId, username).then(data => {
			if ('data' in data && data.data !== null) setData(data.data as any);
		});
	}, [roomId, username]);

	return (
		<>
			{Boolean(data.startTime) && (
				<>
					<BorderlessButton
						style={[styles.topContainer]}
						testID='room-view-banner'
						onPress={() => {
							// 跳转到指定消息
							if (data.messageId !== null) toMessage(data.messageId);
						}}
					>
						<View style={styles.meetingBox}>
							<View style={[{ flexDirection: 'row', justifyContent: 'space-between' }]}>
								<View style={[{ flexDirection: 'row', alignItems: 'center' }]}>
									<Text style={[styles.meetingUserBy, { paddingLeft: 2, color: '#1B5BFF', fontWeight: '900', fontSize: 13 }]}>
										{'下一会议：'}
										{data.subject}
									</Text>
								</View>
							</View>
							<View style={styles.meetingDetail}>
								<CustomIcon name={'clock'} color={themes[theme].auxiliaryText} size={17} />
								<Text style={[styles.meetingUserBy, { textAlign: 'center' }]}>{changeTime(data.startTime)}</Text>
								{Boolean(data.meetingRoomName) && (
									<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
										<CustomIcon name={'pin-map'} color={themes[theme].auxiliaryText} size={17} />
										<Text style={[styles.meetingUserBy, { textAlign: 'center' }]}>{data.meetingRoomName}</Text>
									</View>
								)}
							</View>
						</View>
					</BorderlessButton>
				</>
			)}
		</>
	);
});
export default MeetingTop;

const styles = StyleSheet.create({
	topContainer: {
		position: 'relative',
		minHeight: 80,
		width: phoneW,
		backgroundColor: '#F5F5F5',
		alignItems: 'center'
	},
	meetingDetail: {
		flexDirection: 'row',
		paddingTop: 5
	},
	meetingUserBy: {
		fontSize: 12,
		color: '#555555',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		...sharedStyles.textRegular,
		fontWeight: '400',
		marginRight: 10
	},
	meetingBox: {
		marginTop: 10,
		width: '96%',
		padding: 10,
		position: 'absolute',
		flexDirection: 'column',
		borderColor: '#dddddd',
		opacity: 0.9,
		borderWidth: 2,
		borderStyle: 'solid',
		borderRadius: 10
	}
});
