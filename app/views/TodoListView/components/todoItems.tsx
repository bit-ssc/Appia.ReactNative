import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { rgba } from 'color2k';
import Svg, { Path } from 'react-native-svg';

import styles from '../styles';
import I18n from '../../../i18n';
import FileItem from './fileType';
import MessageType from './msgType';
import { ITodo } from '../types';
import useMoment from '../../../lib/hooks/useMoment';
import { isIOS } from '../../../lib/methods/helpers';

type TodoItemProps<T extends ITodo> = {
	item: T;
	renderItemBottom: (item: T) => JSX.Element;
	editPress: (item: T) => void;
	updateToDo: (item: T) => void;
};

const TodoItem = <T extends ITodo>({ item, renderItemBottom, editPress, updateToDo }: TodoItemProps<T>): React.ReactElement => {
	const renderContent = (item: T) => {
		if (!item.title && 'attachments' in item && Array.isArray(item.attachments)) {
			if ('image_preview' in item.attachments[0]) {
				const des = item.attachments[0].description;
				return (
					<>
						{des && (
							<Text style={[styles.title, { flexWrap: 'wrap', color: rgba(0, 0, 0, 0.9), marginTop: 5, marginBottom: 5 }]}>
								{des}
							</Text>
						)}
						<MessageType attachment={item.attachments[0]} />
					</>
				);
			}
			return (
				<>
					<FileItem attachments={item.attachments[0]} />
				</>
			);
		}
		return (
			<>
				<Text style={[styles.title, { flexWrap: 'wrap', color: rgba(0, 0, 0, item.status === 0 ? 0.9 : 0.4), marginTop: 5 }]}>
					{item.title}
				</Text>
			</>
		);
	};
	const moment = useMoment(item.createdAt, 'todo');

	const editIcon = () => (
		<Svg viewBox='0 0 1024 1024' width='16' height='16'>
			<Path
				d='M733.273081 320.585459 615.393323 202.714911l58.96188-58.934251c19.540032-19.513426 51.173496-19.513426 70.709435 0l47.14474 47.1386c19.540032 19.541055 19.540032 51.223638 0 70.758554L733.273081 320.585459 733.273081 320.585459zM390.826731 663.019529l-117.874641-117.872594 320.450383-317.937143 117.879758 117.871571L390.826731 663.019529 390.826731 663.019529zM178.255335 759.686149l71.718415-191.564967 116.887151 116.916826L178.255335 759.686149 178.255335 759.686149zM845.742619 799.971667l0 59.69559L179.644985 859.667258l0-59.69559L845.742619 799.971667 845.742619 799.971667zM845.742619 799.971667'
				fill='#86909C'
			></Path>
		</Svg>
	);

	const updateIcon = () => (
		<Svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
			<Path
				d='M11.5405 13.0403L12.4597 12.121L8.0001 7.66142L3.54048 12.121L4.45972 13.0403L8.0001 9.4999L11.5405 13.0403ZM11.5405 8.04035L12.4597 7.12111L8.0001 2.66149L3.54048 7.12111L4.45972 8.04035L8.0001 4.49997L11.5405 8.04035Z'
				fill='#86909C'
			/>
		</Svg>
	);

	const editInAndroid = () => (
		<TouchableOpacity
			style={{
				position: 'absolute',
				right: 0,
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				height: 30,
				marginTop: 0
			}}
			onPress={() => {
				editPress && editPress(item);
			}}
		>
			{editIcon()}
			<Text style={{ color: '#86909C', fontSize: 14 }}>{I18n.t('Edit')}</Text>
		</TouchableOpacity>
	);

	const editInIOS = () => (
		<TouchableOpacity
			style={{
				flexDirection: 'row',
				paddingLeft: 5,
				paddingRight: 5,
				height: 18,
				alignItems: 'center',
				justifyContent: 'center',

				...Platform.select({
					ios: {
						marginBottom: -1
					},
					android: {
						paddingTop: 2
					}
				})
			}}
			onPress={() => {
				editPress && editPress(item);
			}}
		>
			{editIcon()}
			<Text style={{ color: '#86909C', fontSize: 14 }}>{I18n.t('Edit')}</Text>
		</TouchableOpacity>
	);

	const todoTips = () => {
		if (item.tips) {
			return (
				<View
					style={{
						flexDirection: 'column',
						marginTop: 7,
						paddingTop: 3,
						paddingBottom: 5
					}}
				>
					<Text style={[styles.content, { color: 'black' }]}>{I18n.t('Reminder')}</Text>
					<Text style={[styles.content, { color: rgba(0, 0, 0, item.status === 0 ? 0.9 : 0.4), marginTop: 5 }]}>
						{item.tips}
						{isIOS && item.type && item.type === 'h' && editInIOS()}
					</Text>
					{!isIOS && item.type && item.type === 'h' && editInAndroid()}
				</View>
			);
		}

		if (item.type && item.type === 'h') {
			return (
				<TouchableOpacity
					style={{
						marginHorizontal: 0,
						height: 26,
						borderColor: '#E5E6EB',
						borderWidth: 2,
						borderRadius: 3,
						marginTop: 10,
						alignItems: 'center',
						justifyContent: 'center'
					}}
					onPress={() => {
						editPress && editPress(item);
					}}
				>
					<Text style={{ color: '#86909C', fontSize: 14 }}>{I18n.t('Add_Reminder')}</Text>
				</TouchableOpacity>
			);
		}

		return null;
	};

	const isHighTodo = item.type && item.type === 'h';

	return (
		<View>
			<View style={styles.itemContainer}>
				<View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
					<View style={{ borderRadius: 4, backgroundColor: isHighTodo ? '#FDECEE' : '#F0F8FF' }}>
						<Text
							style={[
								styles.title,
								{
									color: isHighTodo ? '#E34D59' : '#2878FF',
									paddingHorizontal: 8,
									paddingVertical: 2,
									fontSize: 12
								}
							]}
							numberOfLines={1}
						>
							{isHighTodo ? I18n.t('High_Todo') : I18n.t('Default_Todo')}
						</Text>
					</View>
					{!isHighTodo && (
						<TouchableOpacity
							onPress={() => {
								updateToDo && updateToDo(item);
							}}
							style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
						>
							{updateIcon()}
							<Text style={{ color: '#86909C', fontSize: 14 }}>升级高优</Text>
						</TouchableOpacity>
					)}
				</View>
				{renderContent(item)}
				{todoTips()}
				<View style={{ flexDirection: 'row', marginTop: 8 }}>
					<Text style={[styles.content, { color: rgba(0, 0, 0, 0.4) }]}>{I18n.t('Create_Time')}</Text>
					<Text style={[styles.content, { color: rgba(0, 0, 0, item.status === 0 ? 0.9 : 0.4), marginStart: 12 }]}>{moment}</Text>
				</View>
			</View>

			{renderItemBottom(item)}
		</View>
	);
};

export default TodoItem;
