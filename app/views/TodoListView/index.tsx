import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Text, View, Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import Touchable from 'react-native-platform-touchable';

import I18n from '../../i18n';
import Button from '../../containers/Button';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import CalendarIcon from '../../containers/Icon/Calendar';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import log from '../../utils/log';
import { Services } from '../../lib/services';
import { ITodo } from './types';
import TodoItems from './components/todoItems';
import InputModel from '../RoomView/InputModel';
import { showToast } from '../../lib/methods/helpers/showToast';
import * as HeaderButton from '../../containers/HeaderButton';

interface IProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'TodoListView'>;
	route: RouteProp<ChatsStackParamList, 'TodoListView'>;
}

const DEFAULT_COUNT = 10;

const TodoListView = ({ navigation, route }: IProps): React.ReactElement => {
	const [todoList, setTodoList] = useState<ITodo[]>([]);
	const { rid, onRefreshData } = route.params;
	const { setOptions } = useNavigation();
	const [inputModalVisible, setInputModalVisible] = useState(false);
	const [editItem, setEditItem] = useState<ITodo>({});

	const toggleTodo = async (item: ITodo, status: number) => {
		await Services.ToggleTodoStatus(item.id, status);
		let newArray: ITodo[] = [];
		if (status === -1) {
			newArray = todoList.filter(todo => todo.id !== item.id);
		}
		if (status === 1) {
			newArray = todoList.map(todo => {
				if (todo.id === item.id) todo.status = status;
				return todo;
			});
		}
		setTodoList(newArray);
		onRefreshData && onRefreshData();
	};

	useLayoutEffect(() => {
		setOptions({
			headerTitleAlign: 'center',
			title: I18n.t('Todo_List'),
			headerLeft: () => (
				<HeaderButton.BackButton
					onPress={() => {
						navigation?.pop();
					}}
				/>
			)
		});
	}, []);

	useEffect(() => {
		getData();
	}, []);

	const getData = async () => {
		try {
			const newData: ITodo[] = [...todoList];
			const res = await Services.getTodoList(todoList.length, DEFAULT_COUNT, rid);
			const set = new Set(todoList.map(item => item.id));
			const data = res.data.list as unknown as ITodo[];
			data.forEach(item => {
				if (!set.has(item.id)) {
					newData.push(item);
				}
			});
			setTodoList(newData);
		} catch (e) {
			log(e);
		}
	};

	const renderItemBottom = (item: ITodo) => {
		const todoList = () => (
			<View style={styles.itemButtonContainer}>
				<Button
					style={styles.itemButton}
					styleText={{ color: '#1B5BFF' }}
					title={I18n.t('Finish_Todo')}
					onPress={() => toggleTodo(item, -1)}
				/>
			</View>
		);
		return (
			<>
				{item.status === 0 ? (
					todoList()
				) : (
					<Button
						onPress={() => toggleTodo(item, 1)}
						title={I18n.t('Todo_Finished')}
						styleText={[styles.content, { color: '#86909C' }]}
						style={[styles.itemButton, { marginHorizontal: 12 }]}
					></Button>
				)}
			</>
		);
	};

	const renderItem = ({ item }: { item: ITodo }) => (
		<TodoItems<ITodo>
			item={item}
			renderItemBottom={renderItemBottom}
			editPress={item => {
				setEditItem(item);
				setInputModalVisible(true);
			}}
			updateToDo={updateItem => {
				// updateToDoItem(updateItem);
				setEditItem(updateItem);
				setInputModalVisible(true);
			}}
		/>
	);

	const goToAllTodoList = () => {
		navigation.push('TodoListView', {
			onRefreshData: async () => {
				const res = await Services.getTodoList(todoList.length, DEFAULT_COUNT, rid);
				const data = res.data.list as unknown as ITodo[];
				setTodoList(data);
			}
		});
	};

	const renderBottom = () => (
		<View style={styles.touch}>
			<Touchable style={styles.buttonContainer} onPress={goToAllTodoList}>
				<View style={styles.container}>
					<CalendarIcon />
					<Text style={styles.buttonText}>{I18n.t('All_Todo')}</Text>
				</View>
			</Touchable>
		</View>
	);

	const todoInputView = () => (
		<Modal animationType='fade' transparent={true} visible={inputModalVisible}>
			<InputModel
				title={I18n.t('To_Do_Reminder')}
				placeholder={I18n.t('To_Do_Placeholder')}
				message={editItem.tips}
				closePress={() => {
					setInputModalVisible(false);
				}}
				okPress={text => {
					try {
						setInputModalVisible(false);
						Services.updateTodoMessage(editItem.id, editItem.title, text, 'h')
							.then(res => {
								if (res.success) {
									const updatedItems = todoList.map(item => {
										if (item.id === editItem.id) {
											return { ...item, tips: text, type: 'h' };
										}
										return item;
									});
									const highToDos = updatedItems.filter(item => item.type && item.type === 'h');
									const defaultToDos = updatedItems.filter(item => !(item.type && item.type === 'h'));
									setTodoList([...highToDos, ...defaultToDos]);
									onRefreshData && onRefreshData();
								} else {
									showToast('操作失败');
								}
							})
							.catch(err => {
								console.info('添加提醒失败 = ', err);
								showToast('操作失败');
							});
					} catch (e) {
						log(e);
					}
				}}
			/>
		</Modal>
	);

	return (
		<SafeAreaView style={{ backgroundColor: '#F3F3F3' }}>
			<StatusBar />
			{todoInputView()}
			<FlatList data={todoList} renderItem={renderItem} style={{ marginTop: 12 }} />
			{rid ? renderBottom() : null}
		</SafeAreaView>
	);
};

export default TodoListView;
