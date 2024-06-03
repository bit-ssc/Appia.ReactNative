import React from "react";
import Touchable from "react-native-platform-touchable";
import {View} from "react-native";

import I18n from "../../../i18n";
import {DrawerMenu} from "../../../containers/DrawerMenu";
import * as List from "../../../containers/List";
import Button from "../../../containers/Button";
import {CustomIcon} from "../../../containers/CustomIcon";
import {useTheme} from "../../../theme";


export const validTimeArr = [
	{
		label: I18n.t('Forever_Valid'),
		value: -1
	},
	{
		label: I18n.t('30_Days_Valid'),
		value: 30
	},
	{
		label: I18n.t('7_Days_Valid'),
		value: 7
	},
	{
		label: I18n.t('3_Days_Valid'),
		value: 3
	},
	{
		label: I18n.t('1_Days_Valid'),
		value: 1
	}
];

interface ITimeDrawer {
	isShowBottom: boolean;
	closeDrawer: (state: boolean) => void;
	handleExpire: (value: number) => void;
	handleTimeString: (lable: string) => void;
	expire: number;
}

const TimeDrawer = ({isShowBottom, closeDrawer, handleTimeString, handleExpire, expire }: ITimeDrawer): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<DrawerMenu
			visible={isShowBottom}
			hideModal={closeDrawer}
			Height={262}
			children={
				<List.Container>
					<List.Section>
						{validTimeArr.map((item, index) => (
							<Touchable
								onPress={() => {
									handleExpire(item.value);
									handleTimeString(item.label);
									closeDrawer(false);
								}}
							>
								<View>
									<View style={[{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
										<Button
											title={item.label}
											style={[{ backgroundColor: 'transparent', marginBottom: 0 }]}
											styleText={[{ color: '#000', fontSize: 18 }]}
											disabled={true}
											onPress={() => {}}
										/>
										{item.value === expire ? <CustomIcon name={'check'} size={24} color={colors.tintColor} /> : null}
									</View>
									{index !== validTimeArr.length - 1 ? <List.Separator /> : null}
								</View>
							</Touchable>
						))}
					</List.Section>
					<List.Separator style={{ height: 5 }} />
					<List.Section>
						<Button
							title={I18n.t('Cancel')}
							style={[{ backgroundColor: '#fff' }]}
							styleText={[{ color: '#000', fontSize: 18 }]}
							onPress={() => {
								closeDrawer(false)
							}}
						/>
					</List.Section>
				</List.Container>
			}
		/>
	)
}

export default TimeDrawer
