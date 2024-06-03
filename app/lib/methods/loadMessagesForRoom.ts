import moment from 'moment';

import { MessageTypeLoad } from '../constants';
import { IMessage, TAnyMessageModel, TMessageModel } from '../../definitions';
import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { RoomTypes, roomTypeToApiType } from './roomTypeToApiType';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

const COUNT = 50;

async function load({ rid: roomId, latest, t }: { rid: string; latest?: Date; t: RoomTypes }) {
	let params = { roomId, count: COUNT } as { roomId: string; count: number; latest?: string };
	if (latest) {
		params = { ...params, latest: new Date(latest).toISOString() };
	}

	const apiType = roomTypeToApiType(t);
	if (!apiType) {
		return [];
	}

	// RC 0.48.0
	const data = await sdk.get(`${apiType}.history`, params);
	if (!data.success) {
		return [];
	}
	return data.messages;
}

export function loadMessagesForRoom(args: {
	rid: string;
	t: RoomTypes;
	latest?: Date;
	loaderItem?: TMessageModel;
	fromSearch?: boolean;
}): Promise<TAnyMessageModel[]> {
	return new Promise(async (resolve, reject) => {
		try {
			const data: Partial<IMessage>[] = await load(args);
			if (data?.length) {
				const lastMessage = data[data.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id as string);
				if ((!lastMessageRecord || args.fromSearch) && data.length === COUNT) {
					const loadMoreMessage = {
						_id: generateLoadMoreId(lastMessage._id as string),
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).subtract(1, 'millisecond').toString(),
						t: MessageTypeLoad.MORE,
						msg: lastMessage.msg
					};
					data.push(loadMoreMessage);
				}
				if (!args.fromSearch) {
					await updateMessages({ rid: args.rid, update: data, loaderItem: args.loaderItem });
				}
				return resolve(data);
			}
			return resolve([]);
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
