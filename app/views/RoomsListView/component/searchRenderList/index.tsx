import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, Keyboard, ListRenderItem, ActivityIndicator } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';

import { getUidDirectMessage, isIOS } from '../../../../lib/methods/helpers';
import { spotlightRooms, spotlightUsers } from '../../../../lib/services/restApi';
import RoomItemContainer from './searchListItem';
import SelectTab from './components/selectTab';
import AllList from './allList';
import styles from './styles';
import FindNoItem from './components/findNoItem';
import { SearchRenderListProps } from './type';
import { SubscriptionType } from '../../../../definitions';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { TSearch, localSearchSubscription } from '../../../../lib/methods';
// import { localSearchSubscription } from '../../../../lib/methods';

// 假设 SearchRenderList 是一个函数组件
// 使用 React.ComponentProps<typeof FlatList> 来获取 FlatList 的属性类型

const getItemLayout = (index: number, height: number) => ({
	length: height,
	offset: height * index,
	index
});

const SearchRenderList = <ItemT,>({
	data,
	onEndReached,
	displayMode,
	onPress,
	keyExtractor,
	showLastMessage,
	username,
	useRealName,
	showAvatar,
	getRoomTitle = () => 'title',
	getRoomAvatar = () => '',
	showDot,
	channelDotColor,
	discussionDotColor,
	teamDotColor,
	borderRadius,
	height,
	searchText
}: SearchRenderListProps<ItemT>) => {
	const scrollViewRef = useRef<ScrollView>(null);

	/* 	const toOnePage = useCallback(() => {
		() => {
			// 使用 goToPage 方法跳转到第二个tab（索引从0开始）
			// scrollViewRef.current!.goToPage(1);
		};
	}, []); */
	// useEffect(() => {
	// 	setLastSearchText(searchText);
	// }, [searchText]);

	const [searchResultPerson, setSearchResultPerson] = useState([]);
	const [searchResultRoom, setSearchResultRoom] = useState([]);

	const [searchPersonLoading, setSearchPersonLoading] = useState(false);
	const [searchRoomLoading, setSearchRoomLoading] = useState(false);
	const [searchAllLoading, setSearchAllLoading] = useState(false);

	// const [lastSearchText, setLastSearchText] = useState('');

	// const [currentPage, setCurrentPage] = useState(0);

	const toOnePage = (pageNumber: any) => {
		scrollViewRef.current?.goToPage(pageNumber);
		// loadDataByPageNumber(pageNumber);
	};

	useEffect(() => {
		const listener = EventEmitter.addEventListener('searching', onEventReceived);

		return () => EventEmitter.removeListener('searching', listener);
	}, []);

	const onEventReceived = ({ visible: _visible }) => {
		setSearchAllLoading(_visible);
	};

	useEffect(() => {
		scrollViewRef.current?.goToPage(0);
		setSearchResultRoom([]);
		setSearchResultPerson([]);
	}, [data]);

	const loadDataByPageNumber = (pageNumber: number) => {
		// setCurrentPage(pageNumber);
		if (pageNumber === 1 && searchResultPerson.length === 0) {
			loadSearchPerson();
		} else if (pageNumber === 2 && searchResultRoom.length === 0) {
			loadSearchRoom();
		}
	};

	const loadSearchPerson = async () => {
		setSearchPersonLoading(true);
		// const localSearchData = await localSearchSubscription({ text: searchText, filterUsers: true, filterRooms: true });
		// const usernames = localSearchData.map(sub => sub.name as string);

		try {
			const result = await spotlightUsers(searchText, [], { users: true, rooms: true, includeFederatedRooms: true });
			const res = result.users.map(item => {
				const item1 = item;
				item1.t = SubscriptionType.DIRECT;
				item1.rid = item.username;
				item1.fname = item.name;
				item1.name = item.username;
				item1.search = true;
				return item;
			});
			setSearchResultPerson(res);
			setSearchPersonLoading(false);
		} catch (error) {
			setSearchResultPerson([]);
			setSearchPersonLoading(false);
		}
	};

	const loadSearchRoom = async () => {
		setSearchRoomLoading(true);
		let localSearchData = await localSearchSubscription({ text: searchText, filterUsers: true, filterRooms: true });
		// const usernames = localSearchData.map(sub => sub.name as string);
		localSearchData = localSearchData.filter(item => item.t !== 'd');
		const data: TSearch[] = localSearchData;

		try {
			const result = await spotlightRooms(searchText, [], { users: true, rooms: true, includeFederatedRooms: true });

			const res = [...result.usersInRooms, ...result.rooms];
			res.forEach(item => {
				const index = data.findIndex(subItem => 'rid' in subItem && subItem.rid === item._id);
				if (index === -1) {
					const item1 = item;

					if (item.users) {
						item1.allSearch = true;
						item1.searchKey = searchText;
						item1.perName = item.users[0]?.name;
						item1.per_id = item.users[0]?._id;
					}

					if (item.room) {
						const { room } = item;
						item1.fname = room.fname !== '' ? room.fname : room.dname;
						item1._id = room._id;
						item1.rid = room._id;
						item1.t = room.t;
					}
					data.push(item1);
				}
			});
			/* const res = [...result.usersInRooms, ...result.rooms].map(item => {
				const item1 = item;
				if (item.users) {
					item1.allSearch = true;
					item1.searchKey = searchText;
					item1.perName = item.users[0]?.name;
					item1.per_id = item.users[0]?._id;
				}

				if (item.room) {
					const { room } = item;
					item1.fname = room.fname !== '' ? room.fname : room.dname;
					item1._id = room._id;
					item1.rid = room._id;
					item1.t = room.t;
				}

				return item1;
			}); */
			setSearchResultRoom(data);
			setSearchRoomLoading(false);
		} catch (error) {
			setSearchResultRoom([]);
			setSearchRoomLoading(false);
		}
	};

	const renderItem: ListRenderItem<ItemT> = info => {
		const { item } = info;

		const id = getUidDirectMessage(item);
		return (
			<RoomItemContainer
				id={id}
				item={item}
				username={username}
				showLastMessage={showLastMessage}
				onPress={onPress}
				useRealName={useRealName}
				getRoomTitle={getRoomTitle}
				getRoomAvatar={getRoomAvatar}
				showAvatar={showAvatar}
				showDot={showDot}
				channelDotColor={channelDotColor}
				discussionDotColor={discussionDotColor}
				teamDotColor={teamDotColor}
				borderRadius={borderRadius}
				displayMode={displayMode}
			/>
		);
	};

	const renderAll = () => {
		if (searchAllLoading) {
			return (
				<ActivityIndicator
					style={{
						position: 'absolute',
						top: 60,
						left: 0,
						right: 0,
						paddingHorizontal: 24
					}}
				/>
			);
		}

		return data.length && data[0].length && (data[0][0].length || data[0][1].length) ? (
			<AllList
				data={data[0]}
				style={styles.FlatListStyle}
				renderItem={renderItem}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
				displayMode={displayMode}
				toOnePage={toOnePage}
			/>
		) : (
			<FindNoItem />
		);
	};

	console.log(data, 'data数据', searchText);
	return (
		<>
			<ScrollableTabView
				ref={scrollViewRef}
				onChangeTab={obj => {
					const pageNumber = obj.i;
					loadDataByPageNumber(pageNumber);
				}}
				renderTabBar={value => {
					const { activeTab, goToPage } = value;
					return (
						<SelectTab
							selectNumber={activeTab !== undefined ? activeTab : 0}
							toOnePage={pageNumber => {
								goToPage && goToPage(pageNumber);
							}}
						/>
					);
				}}
			>
				{renderAll()}
				{
					<>
						<FlatList
							data={searchResultPerson}
							onTouchStart={Keyboard.dismiss}
							keyExtractor={keyExtractor}
							style={styles.FlatListStyle}
							renderItem={renderItem}
							keyboardShouldPersistTaps='handled'
							onEndReached={onEndReached}
							removeClippedSubviews={isIOS}
							getItemLayout={(_, index) => getItemLayout(index, height)}
							scrollEventThrottle={40}
							onEndReachedThreshold={0.4}
							contentContainerStyle={{ flex: searchResultPerson.length ? 0 : 1 }}
							ListEmptyComponent={<FindNoItem />}
						/>
						{searchPersonLoading ? (
							<ActivityIndicator
								style={{
									position: 'absolute',
									top: 60,
									left: 0,
									right: 0,
									paddingHorizontal: 24
								}}
							/>
						) : null}
					</>
				}
				{
					<>
						<FlatList
							data={searchResultRoom}
							onTouchStart={Keyboard.dismiss}
							keyExtractor={keyExtractor}
							style={styles.FlatListStyle}
							renderItem={renderItem}
							keyboardShouldPersistTaps='handled'
							onEndReached={onEndReached}
							removeClippedSubviews={isIOS}
							getItemLayout={(_, index) => getItemLayout(index, height)}
							scrollEventThrottle={40}
							onEndReachedThreshold={0.4}
							contentContainerStyle={{ flex: searchResultRoom.length ? 0 : 1 }}
							ListEmptyComponent={<FindNoItem />}
						/>
						{searchRoomLoading ? (
							<ActivityIndicator
								style={{
									position: 'absolute',
									top: 60,
									left: 0,
									right: 0,
									paddingHorizontal: 24
								}}
							/>
						) : null}
					</>
				}
			</ScrollableTabView>
		</>
	);
};

export default SearchRenderList;
