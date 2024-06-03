import React, { useCallback, useMemo, useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

import { IMessageInner } from '../interfaces';
import styles from './styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import { getMaxMessageWidth } from './helper';
import ArrowIcon, { TopArrowIcon } from '../../Icon/Arrow';

interface IField {
	label: string;
	value: string;
	show: boolean;
}

const FeedbackMsg: React.FC<IMessageInner> = props => {
	const { msgData, msg } = props;
	const { theme } = useTheme();
	const fields = useMemo(() => JSON.parse(msgData as string) as IField[], [msgData]);

	const showToggle = useMemo(() => fields.find(field => !field.show), [fields]);
	const [toggle, setToggle] = useState(false);
	const onToggle = useCallback(() => {
		setToggle(prevState => !prevState);
	}, []);

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor, width: getMaxMessageWidth() }]}>
			<View style={[styles.headerWrapper]}>
				<Text style={[styles.header, { color: themes[theme].headerTitleColor }]}>{msg}</Text>
			</View>

			<View style={[styles.body]}>
				{fields
					?.filter(({ show }) => toggle || show)
					.map(({ label, value }) => (
						<View nativeID={label} style={[styles.row]}>
							<Text style={[styles.label, { color: themes[theme].auxiliaryText }]}>{label}</Text>
							<Text style={[styles.value, { color: themes[theme].headerTitleColor }]}>{`${
								value === undefined ? '--' : value
							}`}</Text>
						</View>
					))}
			</View>

			{showToggle ? (
				<TouchableOpacity onPress={onToggle}>
					<View
						style={[
							styles.footerWrapper,
							{
								borderColor: themes[theme].borderColor,
								display: 'flex',
								flexDirection: 'row',
								alignContent: 'center',
								justifyContent: 'center'
							}
						]}
					>
						{toggle ? <TopArrowIcon /> : <ArrowIcon />}

						<Text style={{ color: 'rgba(0, 0, 0, 0.6)', lineHeight: 18 }}>{toggle ? ' 收起' : ' 展开'}</Text>
					</View>
				</TouchableOpacity>
			) : null}
		</View>
	);
};

export default FeedbackMsg;
