import { Model } from '@nozbe/watermelondb';
import { date, field } from '@nozbe/watermelondb/decorators';

export const RECALL_MESSAGES_TABLE = 'recall_messages';

export default class RecallMessage extends Model {
	static table = RECALL_MESSAGES_TABLE;

	@field('_id') _id;

	@field('msg') msg;

	@field('recall_time') rt;

	@field('msg_type') msgType;

	@field('recall_id') recallId;
}
