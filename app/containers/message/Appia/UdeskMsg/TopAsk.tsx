import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import { themes } from '../../../../lib/constants';
import { useTheme } from '../../../../theme';
import { IMessageInner } from '../../interfaces';
import styles from '../../styles';
import { sendMessage } from '../../../../lib/methods';
import { useDimensions } from '../../../../dimensions';
import { IApplicationState } from '../../../../definitions';
import { getUserSelector } from '../../../../selectors/login';
import { getMaxMessageWidth } from '../helper';

interface Option {
	question: string;
}
interface TopAsk {
	questionType: string;
	optionsList: Option[];
}

export interface IProps extends IMessageInner {
	assignInfo: {
		leadingWord: string;
		topAsk: TopAsk[];
	};
}

const TopAskComponent: React.FC<IProps> = ({ assignInfo, rid }) => {
	const { theme } = useTheme();
	const [tab, setTab] = useState<string>(assignInfo.topAsk?.length ? assignInfo.topAsk[0].questionType || '' : '');
	const topAsk = useMemo(() => {
		const map: Record<string, Option[]> = {};

		assignInfo.topAsk?.forEach(topAsk => {
			map[topAsk.questionType] = topAsk.optionsList;
		});
		return map;
	}, [assignInfo.topAsk]);
	const { width } = useDimensions();
	const user = useSelector((state: IApplicationState) => getUserSelector(state));

	return (
		<View
			style={[
				styles.msgText,
				{
					paddingTop: 10,
					paddingBottom: 10,
					flex: 0,
					width: getMaxMessageWidth(),
					backgroundColor: themes[theme].backgroundColor
				}
			]}
		>
			<Text style={[styles.textInfo, { color: themes[theme].bodyText, fontSize: 18, fontWeight: 'bold' }]}>
				{assignInfo.leadingWord}
			</Text>
			{assignInfo.topAsk?.length ? (
				<>
					<View style={{ marginVertical: 5, height: 30, maxWidth: width - 100, overflow: 'hidden' }}>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<View
								style={{
									flexDirection: 'row',
									borderBottomWidth: 1,
									borderBottomColor: themes[theme].searchboxBackground
								}}
							>
								{assignInfo.topAsk.map(({ questionType }) => (
									<TouchableOpacity
										key={questionType}
										onPress={() => {
											setTab(questionType);
										}}
										style={{ position: 'relative' }}
									>
										<Text
											style={[
												styles.textInfo,
												{
													flex: 1,
													marginRight: 10,
													fontStyle: 'normal',
													color: questionType === tab ? themes[theme].actionTintColor : themes[theme].headerTitleColor
												}
											]}
										>
											{questionType}
										</Text>

										{questionType === tab ? (
											<View
												style={{
													position: 'absolute',
													bottom: -1,
													right: 10,
													left: 0,
													borderBottomWidth: 1,
													borderBottomColor: themes[theme].actionTintColor
												}}
											/>
										) : null}
									</TouchableOpacity>
								))}
							</View>
						</ScrollView>
					</View>
					{topAsk[tab]?.length ? (
						<View>
							{topAsk[tab].map(({ question }, index) => (
								<TouchableOpacity
									key={question}
									onPress={() => {
										sendMessage(rid, question, undefined, user);
									}}
									style={{ position: 'relative' }}
								>
									<View style={{ marginVertical: 3 }}>
										<Text style={[styles.textInfo, { color: themes[theme].actionTintColor, fontStyle: 'normal' }]}>
											{index + 1}.{question}
										</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					) : null}
				</>
			) : null}
		</View>
	);
};

export default TopAskComponent;
