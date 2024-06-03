import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';
import { sanitizer } from '../utils';

export const CONTACTS_MAP_TABLE = 'contacts_map';

export default class ContactsMap extends Model {
	static table = CONTACTS_MAP_TABLE;

	@field('_id') _id;

	@json('body', sanitizer) body;
}
