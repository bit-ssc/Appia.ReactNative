import { SafeAreaView, Text, View, StyleSheet, Platform } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import React from 'react';
import { useSelector } from 'react-redux';

import CalendarIcon from '../../containers/Icon/Calendar';
import { IApplicationState } from '../../definitions';
import { openWebview } from '../../utils/openLink';
import { useTheme } from '../../theme';

interface Props {
	url: string;
	label: string;
	needAuth: boolean;
	title?: string;
	icon?: React.ReactElement;
}

// SOPHGO ANTALPHA ANTPOOL BITMAIN SSC
const companyMap = new Map<string, string>([
	['SOPHGO', 'https://oaw.sophgo.com'],
	['ANTALPHA', 'https://oaw.antalpha.vip'],
	['ANTPOOL', ''],
	['BITMAIN', 'https://oaw.bitmain.work'],
	['SSC', 'https://oaw.appia.vip']
]);

export const ButtonFooter: React.FC<Props> = ({
	url,
	label,
	title = ' ',
	needAuth,
	icon = <CalendarIcon style={{ marginRight: 8 }} />
}) => {
	const { theme } = useTheme();

	const openUrl = () => {
		if (url) {
			openWebview(url, { title, needAuth }, theme);
		}
	};

	return (
		<SafeAreaView>
			<View
				style={[
					{
						paddingHorizontal: 16,
						paddingVertical: 20,
						borderBottomWidth: 1,
						borderBottomColor: 'rgba(0,0,0, 0.05)'
					},
					styles.inverted
				]}
			>
				<Touchable onPress={openUrl}>
					<View
						style={{
							height: 40,
							borderWidth: 1,
							borderColor: '#2878FF',
							flexDirection: 'row',
							alignItems: 'center',
							borderRadius: 4,
							justifyContent: 'center'
						}}
					>
						{icon}
						<Text style={{ color: '#2878FF' }}>{label}</Text>
					</View>
				</Touchable>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

export const ApprovalBot = ({ name }: { name: 'meeting.bot' | 'approval.bot' }) => {
	const url = useSelector(({ server: { server }, settings: { Enterprise_ID } }: IApplicationState) => {
		if (name === 'meeting.bot') return `${companyMap.get(Enterprise_ID as string)}/meeting/#/orderH5/myOrders`;
		return `${server}/appia_oa/approve/list#approve`;
	});

	// 特殊处理 AP 主体
	if (!url.startsWith('https')) return null;
	const title = name === 'meeting.bot' ? '我的会议' : '我的待办';
	return <ButtonFooter url={url} label={title} title={title} needAuth />;
};

export const MissionBot: React.FC = () => {
	const url = useSelector((state: IApplicationState) => {
		const url = state.settings.Appia_OAW_Url || 'https://oaw.bitmain.vip';

		return `${url}/meeting/#/todoActionsH5`;
	});

	return <ButtonFooter url={url} label='待办任务' needAuth />;
};
