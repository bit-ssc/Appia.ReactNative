import React from 'react';
import { StyleProp, Text, TextStyle, TouchableOpacity, View } from 'react-native';

import * as List from './List';
import { TSupportedThemes } from '../theme';

interface ICustomTabBarProps {
	goToPage?: (page: number) => void;
	activeTab?: number;
	tabs?: string[];
	tabStyle?: StyleProp<TextStyle>;
	theme: TSupportedThemes;
}

export default class CustomTabBar extends React.Component<ICustomTabBarProps> {
	shouldComponentUpdate(nextProps: ICustomTabBarProps) {
		const { activeTab, theme } = this.props;
		if (nextProps.activeTab !== activeTab) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	render() {
		const { tabs, goToPage, tabStyle, activeTab } = this.props;

		return (
			<View>
				<View style={{ height: 45, flexDirection: 'row', backgroundColor: 'white' }}>
					{tabs?.map((tab, i) => (
						<TouchableOpacity
							activeOpacity={0.7}
							key={tab}
							onPress={() => {
								if (goToPage) {
									goToPage(i);
								}
							}}
							style={[
								tabStyle,
								{
									paddingHorizontal: 16,
									height: 45,
									flexDirection: 'column'
								}
							]}
							testID={`reaction-picker-${tab}`}
						>
							<Text
								style={[
									tabStyle,
									{
										fontSize: 16,
										height: 43,
										textAlign: 'center',
										lineHeight: 43,
										color: activeTab === i ? '#2878FF' : 'black',
										fontWeight: activeTab === i ? '500' : '400'
									}
								]}
							>
								{tab}
							</Text>
							{activeTab === i ? (
								<View style={{ height: 2, backgroundColor: '#2878FF' }} />
							) : (
								<View style={{ height: 2, backgroundColor: 'rgba(0,0,0,0.0)' }} />
							)}
						</TouchableOpacity>
					))}
				</View>
				<List.Separator />
			</View>
		);
	}
}
