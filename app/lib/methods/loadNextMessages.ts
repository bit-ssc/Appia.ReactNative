import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { MessageTypeLoad } from '../constants';
import updateMessages from './updateMessages';
import { TAnyMessageModel, TMessageModel } from '../../definitions';
import sdk from '../services/sdk';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

export const NEXTCOUNT = 10;

interface ILoadNextMessages {
	rid: string;
	ts: Date;
	loaderItem: TMessageModel;
	fromSearch?: boolean;
}

export function loadNextMessages(args: ILoadNextMessages): Promise<TAnyMessageModel[]> {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await sdk.methodCallWrapper('loadNextMessages', args.rid, args.ts, NEXTCOUNT);
			let messages = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');
			if (messages?.length) {
				const lastMessage = messages[messages.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id);
				if ((!lastMessageRecord || args.fromSearch) && messages.length === NEXTCOUNT) {
					const loadMoreItem = {
						_id: generateLoadMoreId(lastMessage._id),
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).add(1, 'millisecond').toDate(),
						t: MessageTypeLoad.NEXT_CHUNK
					};
					messages.push(loadMoreItem);
				}
				if (!args.fromSearch) {
					await updateMessages({ rid: args.rid, update: messages, loaderItem: args.loaderItem });
				}
				return resolve(messages);
			}
			return resolve(messages);
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
