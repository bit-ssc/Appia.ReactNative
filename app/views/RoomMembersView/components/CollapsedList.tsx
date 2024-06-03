import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { useMemo, useState } from 'react';
import Touchable from 'react-native-platform-touchable';
import { sortBy } from 'lodash';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import FastImage from 'react-native-fast-image';

import { useTheme } from '../../../theme';
import { TUserModel } from '../../../definitions';
import { CustomIcon } from '../../../containers/CustomIcon';
import sharedStyles from '../../Styles';
import FederationIcon from '../../../containers/Icon/Federation';

const formatUrl = (text: string) => `https://static.appia.cn/logo/${text}.png?v=1`;

interface ICollapsedList {
	title?: string;
	renderItem: ({ item }: { item: any }) => React.ReactElement;
	members: TUserModel[];
	isLocal: boolean;
	logo?: string;
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff'
	},
	titleContainer: {
		alignItems: 'center',
		flexDirection: 'row',
		marginHorizontal: 16,
		padding: 8
	},
	title: {
		...sharedStyles.textMedium,
		fontSize: 16,
		fontWeight: '400',
		lineHeight: 24
	},
	content: {
		flex: 1,
		textAlign: 'right'
	}
});

const CollapsedList = ({ title, renderItem, members, isLocal, logo }: ICollapsedList) => {
	const { colors } = useTheme();
	const [collapsed, setCollapsed] = useState(false);
	const sortMembers = useMemo(
		() =>
			sortBy(members, value => {
				if (value.roles?.length) {
					const set = new Set();
					value?.roles.forEach(role => set.add(role));
					if (set.has('owner')) {
						return 0;
					}

					if (set.has('moderator')) {
						return 1;
					}
				}
				return 2;
			}),
		[members]
	);

	return (
		<View style={styles.container}>
			{title ? (
				<Touchable onPress={() => setCollapsed(!collapsed)}>
					<View style={styles.titleContainer}>
						<CustomIcon name={collapsed ? 'chevron-right' : 'chevron-down'} size={20} color={'rgba(0,0,0,0.8)'} />
						<FastImage
							style={{ width: 30, height: 30, borderRadius: 50 }}
							source={{
								uri: logo ?? formatUrl(title),
								headers: RocketChatSettings.customHeaders,
								priority: FastImage.priority.high
							}}
						/>
						<Text style={styles.title}> {title?.toUpperCase()} </Text>
						{!isLocal ? <FederationIcon /> : null}
						<Text style={styles.content}>{`${members.length}人`}</Text>
					</View>
				</Touchable>
			) : null}
			<Collapsible collapsed={collapsed}>
				<View style={{ backgroundColor: colors.backgroundColor }}>{sortMembers.map(member => renderItem({ item: member }))}</View>
			</Collapsible>
		</View>
	);
};

export default CollapsedList;
