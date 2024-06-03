import { Q } from '@nozbe/watermelondb';

import { sanitizeLikeString } from '../database/utils';
import database from '../database/index';
import { store as reduxStore } from '../store/auxStore';
import { getRoomMembers, spotlight, spotlightV2 } from '../services/restApi';
import {
	IExternalMember,
	ISearch,
	ISearchLocal,
	IUserMessage,
	SubscriptionType,
	SearchWithRoomAndUsers
} from '../../definitions';
import { isGroupChat } from './helpers';
import EventEmitter from './helpers/events';

export type TSearch = ISearchLocal | IUserMessage | ISearch | IExternalMember | SearchWithRoomAndUsers;

let debounce: null | ((reason: string) => void) = null;

export const localSearchSubscription = async ({ text = '', filterUsers = true, filterRooms = true }): Promise<ISearchLocal[]> => {
	const searchText = text.trim();
	const db = database.active;
	const likeString = sanitizeLikeString(searchText);
	let subscriptions = await db
		.get('subscriptions')
		.query(
			Q.or(Q.where('name', Q.like(`%${likeString}%`)), Q.where('fname', Q.like(`%${likeString}%`))),
			Q.experimentalSortBy('room_updated_at', Q.desc),
			Q.where('bot', Q.notEq(true))
		)
		.fetch();

	if (filterUsers && !filterRooms) {
		subscriptions = subscriptions.filter(item => item.t === 'd' && !isGroupChat(item));
	} else if (!filterUsers && filterRooms) {
		subscriptions = subscriptions.filter(item => item.t !== 'd' || isGroupChat(item));
	}

	const search = subscriptions.slice(0, 7).map(item => ({
		_id: item._id,
		rid: item.rid,
		name: item.name,
		fname: item.fname,
		avatarETag: item.avatarETag,
		t: item.t,
		encrypted: item.encrypted,
		lastMessage: item.lastMessage,
		status: item.status,
		teamMain: item.teamMain
	})) as ISearchLocal[];

	return search;
};

export const localSearchUsersMessageByRid = async ({ text = '', rid = '' }): Promise<IUserMessage[]> => {
	const userId = reduxStore.getState().login.user.id;
	const numberOfSuggestions = reduxStore.getState().settings.Number_of_users_autocomplete_suggestions as number;
	const searchText = text.trim();
	const db = database.active;
	const likeString = sanitizeLikeString(searchText);
	const messages = await db
		.get('messages')
		.query(
			Q.and(Q.where('rid', rid), Q.where('u', Q.notLike(`%${userId}%`)), Q.where('t', null)),
			Q.experimentalSortBy('ts', Q.desc),
			Q.experimentalTake(50)
		)
		.fetch();

	const regExp = new RegExp(`${likeString}`, 'i');
	const users = messages.map(message => message.u);

	const usersFromLocal = users
		.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index) // Remove duplicated data from response
		.filter(user => user?.name?.match(regExp) || user?.username?.match(regExp))
		.slice(0, text ? 2 : numberOfSuggestions);

	return usersFromLocal;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const search = async ({ text = '', filterUsers = true, filterRooms = true, rid = '' }): Promise<TSearch[]> => {
	const searchText = text.trim();

	if (debounce) {
		debounce('cancel');
	}

	let localSearchData = [];
	if (rid) {
		localSearchData = await localSearchUsersMessageByRid({ text, rid });
	} else {
		localSearchData = await localSearchSubscription({ text, filterUsers, filterRooms });
	}
	const usernames = localSearchData.map(sub => sub.name as string);

	const data: TSearch[] = localSearchData;

	try {
		if (searchText && localSearchData.length < 7) {
			const { users, rooms } = (await Promise.race([
				spotlight(searchText, usernames, { users: filterUsers, rooms: filterRooms, includeFederatedRooms: true }, rid),
				new Promise((resolve, reject) => (debounce = reject))
			])) as { users: ISearch[]; rooms: ISearch[] };

			if (filterUsers) {
				users
					.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index) // Remove duplicated data from response
					.filter(user => !data.some(sub => user.username === sub.name)) // Make sure to remove users already on local database
					.forEach(user => {
						data.push({
							...user,
							rid: user.username,
							name: user.username,
							fname: user.name,
							t: SubscriptionType.DIRECT,
							search: true
						});
					});
			}
			if (filterRooms) {
				rooms.forEach(room => {
					// Check if it exists on local database
					const index = data.findIndex(item => 'rid' in item && item.rid === room._id);
					if (index === -1) {
						data.push({
							...room,
							rid: room._id,
							search: true
						});
					}
				});
			}
		}

		debounce = null;
		return data;
	} catch (e) {
		console.warn(e);
		return data;
	}
};

export const allSearch = async ({ text = '', filterUsers = true, filterRooms = true, rid = '' }): Promise<TSearch[]> => {
	const searchText = text.trim();

	// 防抖
	if (debounce) debounce('cancel');

	// 获取本地缓存 和用户名
	let localSearchData = [];
	if (rid) localSearchData = await localSearchUsersMessageByRid({ text, rid });
	else localSearchData = await localSearchSubscription({ text, filterUsers, filterRooms });
	// const usernames = localSearchData.map(sub => sub.name as string);

	let data: TSearch[] = localSearchData;

	try {
		if (searchText) {
			console.info(
				'reduxStore.getState().settings.Appia_Search_Person_Limit',
				reduxStore.getState().settings.Appia_Search_Person_Limit
			);

			const Appia_Search_Person_Limit = (reduxStore.getState().settings.Appia_Search_Person_Limit as number) || 3;
			const Appia_Search_PersonInRoom_Limit = (reduxStore.getState().settings.Appia_Search_PersonInRoom_Limit as number) || 3;
			const Appia_Search_Room_Limit = (reduxStore.getState().settings.Appia_Search_Room_Limit as number) || 50;

			EventEmitter.emit('searching', { visible: true });
			const { users, rooms, usersInRooms } = (await Promise.race([
				spotlightV2(
					searchText,
					[],
					{ users: filterUsers, rooms: filterRooms, includeFederatedRooms: true },
					rid,
					Appia_Search_Person_Limit,
					Appia_Search_Room_Limit,
					Appia_Search_PersonInRoom_Limit
				),
				new Promise((resolve, reject) => (debounce = reject))
			])) as { users: ISearch[]; rooms: ISearch[]; usersInRooms: ISearch[] };

			if (filterUsers) {
				users
					.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index) // Remove duplicated data from response
					.filter(user => !data.some(sub => user.username === sub.name)) // Make sure to remove users already on local database
					.forEach(user => {
						data.push({
							...user,
							rid: user.username,
							name: user.username,
							fname: user.name,
							t: SubscriptionType.DIRECT,
							search: true
						});
					});
			}
			if (filterRooms) {
				rooms.forEach(room => {
					// Check if it exists on local database
					const index = data.findIndex(item => 'rid' in item && item.rid === room._id);
					if (index === -1) {
						data.push({
							...room,
							rid: room._id
						});
					}
				});
			}

			if (usersInRooms.length) {
				usersInRooms.forEach(({ room, users }) => {
					const index = data.findIndex(item => 'rid' in item && item.rid === room._id);

					if (index === -1) {
						data.push({
							...room,
							fname: room.fname !== '' ? room.fname : room.dname,
							perName: users[0].name,
							per_id: users[0]._id,
							rid: room._id,
							allSearch: true,
							searchKey: searchText
						});
					}
				});
			}
		}

		data.sort((a, b) => a.t > b.t);

		// const newData = [];
		let reduceObj = [[[], []], [], []];
		reduceObj = data.reduce(
			(pre, next) => {
				next.t === 'd' ? (pre[1].push(next), pre[0][0].push(next)) : (pre[2].push(next), pre[0][1].push(next));
				return pre;
			},
			[[[], []], [], []]
		);

		data = reduceObj;
		debounce = null;
		EventEmitter.emit('searching', { visible: false });
		return data;
	} catch (e) {
		EventEmitter.emit('searching', { visible: false });
		console.warn(e);
		return data;
	}
};

export const searchRoomMembers = ({ keyword, roomType, rid }: { keyword: string; roomType: string; rid: string }) => {
	const searchText = keyword.trim();

	if (debounce) {
		debounce('cancel');
	}

	return Promise.race([
		getRoomMembers({
			rid,
			roomType: roomType as unknown as SubscriptionType,
			type: 'all',
			filter: searchText || '',
			skip: 0,
			limit: 7,
			allUsers: true
		}),
		new Promise((resolve, reject) => (debounce = reject))
	]);
};

export const localSubscriptions = async ({ text = '', filterUsers, filterRooms }): Promise<IUserMessage[]> => {
	const searchText = text.trim();
	const db = database.active;
	const likeString = sanitizeLikeString(searchText);
	let subscriptions = await db
		.get('subscriptions')
		.query(
			Q.or(
				Q.and(
					Q.where('t', Q.notEq('d')),
					Q.where('fname', Q.notEq(null)),
					Q.where('fname', Q.notEq('')),
					Q.where('fname', Q.like(`%${likeString}%`))
				),
				Q.and(Q.where('t', Q.notEq('d')), Q.where('fname', Q.eq('')), Q.where('dname', Q.like(`%${likeString}%`)))
			),
			Q.experimentalSortBy('room_updated_at', Q.desc),
			Q.where('bot', Q.notEq(true))
		)
		.fetch();
	// DWJxF3WL8c9sX5hnZfN42gnP

	if (filterUsers && !filterRooms) {
		subscriptions = subscriptions.filter(item => item.t === 'd' && !isGroupChat(item));
	} else if (!filterUsers && filterRooms) {
		subscriptions = subscriptions.filter(item => item.t !== 'd' || isGroupChat(item));
	}

	const search = subscriptions.slice(0, 20).map(item => ({
		_id: item._id,
		rid: item.rid,
		name: item.name,
		fname: item.fname,
		dname: item.dname,
		avatarETag: item.avatarETag,
		t: item.t,
		encrypted: item.encrypted,
		lastMessage: item.lastMessage,
		status: item.status,
		teamMain: item.teamMain
	}));

	return search;
};

export const addSearch = async ({
	text = '',
	filterUsers = true,
	filterRooms = true,
	rid = '',
	orgType = 1
}): Promise<TSearch[]> => {
	const searchText = text.trim();

	let localSearchData = [];

	localSearchData = await localSubscriptions({ text: searchText, filterUsers, filterRooms });

	const data: TSearch[] = localSearchData;

	// console.log(filterRooms, 'filterRoomsfilterRoomsfilterRoomsfilterRoomsfilterRooms');
	const { users, rooms } = (await Promise.race([
		spotlight(searchText, [], { users: filterUsers, rooms: filterRooms, includeFederatedRooms: true, orgType }, rid)
	])) as { users: ISearch[]; rooms: ISearch[] };

	if (filterUsers) {
		users
			.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index) // Remove duplicated data from response
			.filter(user => !data.some(sub => user.username === sub.name)) // Make sure to remove users already on local database
			.forEach(user => {
				data.push({
					...user,
					name: user.username,
					fname: user.name,
					t: SubscriptionType.DIRECT,
					search: true
				});
			});
	}

	// console.log(data, "wtf")
	if (filterRooms) {
		rooms.forEach(room => {
			// Check if it exists on local database
			const index = data.findIndex(item => 'rid' in item && item.rid === room._id);
			if (index === -1) {
				data.push({
					...room,
					rid: room._id,
					search: true
				});
			}
		});
	}

	// 人物在前面排序
	const orderMap = { d: 1, p: 2, c: 3 };

	return data.sort((a, b) => orderMap[a.t] - orderMap[b.t]);
};

// 防抖函数
const debounceFnc = (func: (...args: any[]) => Promise<any>, wait: number) => {
	let timeout: ReturnType<typeof setTimeout> | undefined;

	return function fnc(...args: any[]) {
		return new Promise(resolve => {
			const later = () => {
				timeout = undefined;
				resolve(func(...args));
			};
			if (!timeout) later();
			clearTimeout(timeout as ReturnType<typeof setTimeout>);
			timeout = setTimeout(later, wait);
		});
	};
};

export const searchDebounce = debounceFnc(addSearch, 200);
