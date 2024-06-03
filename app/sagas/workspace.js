import { takeLatest, put } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { WORKSPACE } from '../actions/actionsTypes';
// import { getWorkspace } from '../lib/services/restApi';
import { getWorkspace } from '../lib/services/common';
import log from '../utils/log';
import { setWorkspace } from '../actions/workspace';
import database from '../lib/database';
import { CONTACTS_MAP_TABLE } from '../lib/database/model';

const getWorkspaceDatabase = async () => {
	const db = database.active;
	const table = db.get(CONTACTS_MAP_TABLE);
	const record = await table.find('workspace');

	if (!record || !Object.keys(record).length) {
		return Promise.reject('Error');
	}

	return record;
};

const updateWorkspaceDatabase = async data => {
	const db = database.active;
	const record = await getWorkspaceDatabase();
	await db.write(() => Promise.all([record.update(row => (row.body = data))]));
};

const createWorkspaceDatabase = async data => {
	try {
		const db = database.active;
		const record = db.get(CONTACTS_MAP_TABLE);

		await db.write(() =>
			Promise.all([
				record.create(row => {
					row._raw = sanitizedRaw({ id: 'workspace' }, record.schema);
					row._id = 'workspace';
					row.body = data;
				})
			])
		);
	} catch (e) {
		log(e);
	}
};

const setDatabase = async data => {
	try {
		await updateWorkspaceDatabase(data);
	} catch (e) {
		try {
			await createWorkspaceDatabase(data);
		} catch (e) {
			log(e);
		}
	}
};

const fetchWorkspace = function* ({ resolve, reject }, server) {
	try {
		yield put(
			setWorkspace({
				phase: 'LOADING'
			})
		);
		const data = yield getWorkspace(server);
		data?.forEach(group => {
			if (group.items) {
				group.items = group.items.filter(a => a.status > 0);
				group.items.forEach(a => {
					if (a.url && !a.url.startsWith('http')) {
						a.url = server + a.url;
					}
					if (a.icon && !a.icon.startsWith('http')) {
						a.icon = server + a.icon;
					}
				});
			}
		});
		yield put(
			setWorkspace({
				phase: 'LOADED',
				groups: data?.filter(a => a.items && a.items.length > 0) || []
			})
		);

		yield setDatabase(data);
		resolve();
	} catch (e) {
		yield put(
			setWorkspace({
				phase: 'LOAD_ERROR'
			})
		);
		reject();
	}
};

const handleRequest = function* handleRequest({ payload, meta }) {
	const { force, server } = payload;
	const { resolve } = meta;
	try {
		const record = yield getWorkspaceDatabase();

		yield put(
			setWorkspace({
				phase: 'LOADED',
				groups: record.body
			})
		);
		if (force) {
			yield fetchWorkspace(meta, server);
		} else {
			resolve();
		}
	} catch (e) {
		yield fetchWorkspace(meta, server);
	}
};

const root = function* root() {
	yield takeLatest(WORKSPACE.REQUEST, handleRequest);
};

export default root;
