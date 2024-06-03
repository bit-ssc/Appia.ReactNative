import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native';

import { themes } from '../../../../lib/constants';
import { useTheme } from '../../../../theme';
import Button from '../../../Button';
import { postStaffServiceSurvey } from '../../../../lib/services/restApi';
import { IPostStaffServiceSurveyData } from '../../../../definitions/rest/v1/udesk';
import { LISTENER } from '../../../Toast';
import EventEmitter from '../../../../utils/events';
import RadioGroup from '../../../RadioGroup';
import { IMessageInner } from '../../interfaces';
import { getMaxMessageWidth } from '../helper';
import { TextInput } from '../../../TextInput';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 8
	},
	title: {
		lineHeight: 28,
		fontSize: 16
	},
	resolvedWrapper: {
		flexDirection: 'column',
		justifyContent: 'space-between',
		marginTop: 8
	},
	resolvedItem: {
		flexDirection: 'row',
		borderWidth: 1,
		alignContent: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 4,
		marginBottom: 10,
		borderRadius: 8
	},
	resolvedIcon: {
		width: 32,
		height: 32,
		marginRight: 10
	},
	resolvedText: {
		fontSize: 16
	},
	textArea: {
		marginBottom: 16,
		paddingVertical: 6,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1
	},
	btn: {
		height: 40,
		borderRadius: 8
	}
});

const images = {
	happyGray: require('../../../../static/images/survey/happy-gray.png'),
	happy: require('../../../../static/images/survey/happy.png'),
	sadGray: require('../../../../static/images/survey/sad-gray.png'),
	sad: require('../../../../static/images/survey/sad.png')
};

interface IState {
	remark: string;
	resolved?: number;
	optionId: number;
	loading: boolean;
}

const options = [
	{
		label: '满意',
		value: 2012
	},
	{
		label: '不满意',
		value: 2014
	}
];

export interface IProps extends IMessageInner {
	messageData: {
		im_sub_session_id: number;
	};
}

const Survey: React.FC<IProps> = ({ messageData, id }) => {
	const { theme } = useTheme();
	const [state, setState] = useState<IState>({
		loading: false,
		remark: '',
		optionId: 2012
	});

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor, width: getMaxMessageWidth() }]}>
			<View>
				<Text style={[styles.title, { color: themes[theme].bodyText }]}>你对本服务的评价是？</Text>
			</View>

			<View>
				<Text style={[styles.title, { color: themes[theme].auxiliaryText }]}>你的问题是否已经解决？</Text>
			</View>

			<View style={styles.resolvedWrapper}>
				<TouchableOpacity
					style={[styles.resolvedItem, { borderColor: state.resolved === 1 ? '#00A870' : themes[theme].headerBorder }]}
					onPress={useCallback(
						() =>
							setState(prevState => ({
								...prevState,
								resolved: 1
							})),
						[]
					)}
				>
					<Image
						source={state.resolved === 1 ? images.happy : images.happyGray}
						resizeMode='contain'
						style={styles.resolvedIcon}
					/>
					<Text style={[styles.resolvedText, { color: state.resolved === 1 ? '#00A870' : themes[theme].headerBorder }]}>
						已解决
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.resolvedItem, { borderColor: state.resolved === 2 ? '#E34D59' : themes[theme].headerBorder }]}
					onPress={useCallback(
						() =>
							setState(prevState => ({
								...prevState,
								resolved: 2
							})),
						[]
					)}
				>
					<Image source={state.resolved === 2 ? images.sad : images.sadGray} resizeMode='contain' style={styles.resolvedIcon} />
					<Text style={[styles.resolvedText, { color: state.resolved === 2 ? '#E34D59' : themes[theme].headerBorder }]}>
						未解决
					</Text>
				</TouchableOpacity>
			</View>

			<View style={{ marginTop: 10, marginBottom: 20 }}>
				<RadioGroup<number>
					options={options}
					initValue={state.optionId}
					onChange={useCallback(
						value =>
							setState(prevState => ({
								...prevState,
								option_id: value
							})),
						[]
					)}
				/>
			</View>

			<View style={[styles.textArea, { borderColor: themes[theme].headerBorder }]}>
				<TextInput
					multiline
					numberOfLines={3}
					style={{ fontSize: 16 }}
					placeholder='您可填写评价备注'
					onChangeText={text => {
						setState(prevState => ({
							...prevState,
							remark: text
						}));
					}}
				/>
			</View>

			<Button
				title='提交'
				style={styles.btn}
				loading={state.loading}
				onPress={async () => {
					const data: IPostStaffServiceSurveyData = {
						im_sub_session_id: messageData.im_sub_session_id,
						option_id: state.optionId
					};

					if (state.resolved) {
						data.resolved_state_v2 = state.resolved;
					}

					if (state.remark) {
						data.remark = state.remark;
					}

					try {
						setState(prevState => ({
							...prevState,
							loading: true
						}));

						await postStaffServiceSurvey({
							message_id: id,
							assign_type: 'agent',
							data
						});

						EventEmitter.emit(LISTENER, { message: '评价成功' });
					} finally {
						setState(prevState => ({
							...prevState,
							loading: false
						}));
					}
				}}
			/>
		</View>
	);
};

export default Survey;
