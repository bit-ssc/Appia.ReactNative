import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';
import { Q } from '@nozbe/watermelondb';

import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { MessageTypeLoad } from '../constants';
import sdk from '../services/sdk';
import { IMessage } from '../../definitions';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';
import database from '../database';

const COUNT = 50;

export function loadSurroundingMessages({
	messageId,
	rid,
	fromSearch
}: {
	messageId: string;
	rid: string;
	fromSearch?: boolean;
}) {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await sdk.methodCallWrapper('loadSurroundingMessages', { _id: messageId, rid }, COUNT);
			let messages: IMessage[] = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');
			messages = messages.map(item => {
				item.id = item._id;
				return item;
			});

			if (messages?.length) {
				if (data?.moreBefore) {
					const firstMessage = messages[0];
					if (fromSearch) {
						const loadMoreItem = {
							_id: generateLoadMoreId(firstMessage._id),
							rid: firstMessage.rid,
							ts: moment(firstMessage.ts).subtract(1, 'millisecond').toDate(),
							t: MessageTypeLoad.PREVIOUS_CHUNK,
							msg: firstMessage.msg
						} as IMessage;
						messages.unshift(loadMoreItem);
					} else {
						const firstMessageRecord = await getMessageById(firstMessage._id);
						if (!firstMessageRecord) {
							const loadMoreItem = {
								_id: generateLoadMoreId(firstMessage._id),
								rid: firstMessage.rid,
								ts: moment(firstMessage.ts).subtract(1, 'millisecond').toDate(),
								t: MessageTypeLoad.PREVIOUS_CHUNK,
								msg: firstMessage.msg
							} as IMessage;
							messages.unshift(loadMoreItem);
						}
					}
				}

				if (data?.moreAfter) {
					const lastMessage = messages[messages.length - 1];
					if (fromSearch) {
						const loadMoreItem = {
							_id: generateLoadMoreId(lastMessage._id),
							rid: lastMessage.rid,
							ts: moment(lastMessage.ts).add(1, 'millisecond').toDate(),
							t: MessageTypeLoad.NEXT_CHUNK,
							msg: lastMessage.msg
						} as IMessage;
						messages.push(loadMoreItem);
					} else {
						const lastMessageRecord = await getMessageById(lastMessage._id);
						if (!lastMessageRecord) {
							const loadMoreItem = {
								_id: generateLoadMoreId(lastMessage._id),
								rid: lastMessage.rid,
								ts: moment(lastMessage.ts).add(1, 'millisecond').toDate(),
								t: MessageTypeLoad.NEXT_CHUNK,
								msg: lastMessage.msg
							} as IMessage;
							messages.push(loadMoreItem);
						}
					}
				}

				if (!fromSearch) {
					await updateMessages({ rid, update: messages });
				}

				return resolve(messages);
			}
			return resolve([]);
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

export const deleteMarkedPosts = async (rid: string) => {
	const db = database.active;

	const msgCollection = db.get('messages');
	const postsToDelete = await msgCollection.query(Q.where('rid', rid)).fetch();

	await db.write(async () => {
		await db.batch(
			// ...postsToDelete.map((post) => post.markAsDeleted()), // 标记为删除状态
			...postsToDelete.map(post => post.prepareDestroyPermanently()) // 永久删除
		);
	});
};
