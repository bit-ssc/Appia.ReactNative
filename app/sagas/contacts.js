import { takeLatest, put, select } from 'redux-saga/effects';

import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { CONTACTS } from '../actions/actionsTypes';
import { getContacts } from '../lib/services/restApi';
import log from '../utils/log';
import { setContacts } from '../actions/contacts';
import database from '../lib/database';
import { CONTACTS_MAP_TABLE } from '../lib/database/model';

const version = 2;

const TreeType = {
	root: 'ROOT',
	department: 'DEPARTMENT',
	staff: 'STAFF'
};

export const getDepartment = str => {
	const arr = [];

	str.split(',').forEach(id => {
		if (id.includes('OU=')) {
			arr.push(id.replace('OU=', ''));
		}
	});

	arr.reverse();

	return arr;
};

export const getRoles = str => {
	const arr = [];

	str.split(',').forEach(id => {
		if (id.includes('RO=')) {
			arr.push(id.replace('RO=', ''));
		}
	});

	return arr;
};

const getContactsDatabase = async () => {
	const db = database.active;
	const contacts = db.get(CONTACTS_MAP_TABLE);

	const [userMap, departmentMap] = await Promise.all([contacts.find('userMap'), contacts.find('departmentMap')]);

	if (!userMap || !departmentMap) {
		return Promise.reject('Error');
	}

	return {
		userMap,
		departmentMap
	};
};

const updateContactsDatabase = async ({ userMap, departmentMap }) => {
	const db = database.active;
	const res = await getContactsDatabase();

	await db.write(() =>
		Promise.all([
			res.userMap.update(user => {
				user.body = userMap;
			}),
			res.departmentMap.update(department => {
				department.body = departmentMap;
			})
		])
	);
};

const createContactsDatabase = async ({ userMap, departmentMap }) => {
	try {
		const db = database.active;
		const contacts = db.get(CONTACTS_MAP_TABLE);

		const create = (record, key, data) => {
			record._raw = sanitizedRaw({ id: key }, contacts.schema);
			record._id = key;
			record.body = data;
		};

		await db.write(() =>
			Promise.all([
				contacts.create(record => {
					create(record, 'userMap', userMap);
				}),
				contacts.create(record => {
					create(record, 'departmentMap', departmentMap);
				})
			])
		);
	} catch (e) {
		log(e);
	}
};

const setDatabase = async data => {
	try {
		await updateContactsDatabase(data);
	} catch (e) {
		try {
			await createContactsDatabase(data);
		} catch (e) {
			log(e);
		}
	}
};

const fetchContacts = function* ({ resolve, reject }) {
	try {
		yield put(
			setContacts({
				phase: 'LOADING'
			})
		);

		const res = yield getContacts();
		const { departmentMap, userMap } = res?.data || {};

		yield put(
			setContacts({
				phase: 'LOADED',
				userMap: userMap || {},
				departmentMap: departmentMap || {}
			})
		);

		yield setDatabase({
			userMap: {
				data: userMap,
				version
			},
			departmentMap: {
				data: departmentMap,
				version
			}
		});
		resolve();
	} catch (e) {
		yield put(
			setContacts({
				phase: 'LOAD_ERROR'
			})
		);
		reject();
	}
};

const handleRequest = function* handleRequest({ payload, meta }) {
	const { force } = payload;
	const { resolve } = meta;

	try {
		const { userMap, departmentMap } = yield getContactsDatabase();

		const user = userMap.body;
		const department = departmentMap.body;

		if (
			version > user.version ||
			version > department.version ||
			!Object.keys(user.data).length ||
			!Object.keys(departmentMap.data).length
		) {
			yield fetchContacts(meta);
			return;
		}

		yield put(
			setContacts({
				phase: 'LOADED',
				userMap: user.data,
				departmentMap: departmentMap.data
			})
		);

		if (force) {
			yield fetchContacts(meta);
		} else {
			resolve();
		}
	} catch (e) {
		yield fetchContacts(meta);
	}
};

const root = function* root() {
	yield takeLatest(CONTACTS.REQUEST, handleRequest);
};

export default root;
