import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { themes } from '../../../../lib/constants';
import { useTheme } from '../../../../theme';
import { IMessageInner } from '../../interfaces';
import styles from '../../styles';
import { sendMessage } from '../../../../lib/methods';
import { IApplicationState } from '../../../../definitions';
import { getUserSelector } from '../../../../selectors/login';
import { getMaxMessageWidth } from '../helper';

export interface IProps extends IMessageInner {
	messageData: {
		ansContent: string;
		suggestQuestionList: { content: string }[];
	};
}

const Faq: React.FC<IProps> = ({ messageData, rid }) => {
	const { theme } = useTheme();
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
			<Text style={[styles.textInfo, { color: themes[theme].bodyText, fontWeight: 'bold' }]}>{messageData.ansContent}</Text>
			{messageData.suggestQuestionList?.length ? (
				<>
					{messageData.suggestQuestionList.map(({ content }) => (
						<TouchableOpacity
							key={content}
							onPress={() => {
								sendMessage(rid, content, undefined, user);
							}}
						>
							<View style={{ flexDirection: 'row', marginVertical: 3 }}>
								<View style={styles.dot} />
								<Text style={[styles.textInfo, { flex: 1, color: themes[theme].actionTintColor }]}>{content}</Text>
							</View>
						</TouchableOpacity>
					))}
				</>
			) : null}
		</View>
	);
};

export default Faq;
