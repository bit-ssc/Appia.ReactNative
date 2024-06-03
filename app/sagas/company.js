import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import { getCompany } from '../lib/services/company';
import { fetchCompaniesFailure, fetchCompaniesSuccess } from '../actions/company';

const handleLoginRequest = function* handleLoginRequest() {
	try {
		const { data } = yield getCompany();
		yield put(fetchCompaniesSuccess(data));
	} catch (e) {
		yield put(fetchCompaniesFailure());
	}
};

const root = function* root() {
	yield takeLatest(types.COMPANY.REQUEST, handleLoginRequest);
};

export default root;
