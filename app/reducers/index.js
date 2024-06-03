import { combineReducers } from 'redux';

import inquiry from '../ee/omnichannel/reducers/inquiry';
import contacts from './contacts';
import settings from './settings';
import login from './login';
import meteor from './connect';
import room from './room';
import rooms from './rooms';
import server from './server';
import selectedUsers from './selectedUsers';
import createChannel from './createChannel';
import app from './app';
import sortPreferences from './sortPreferences';
import share from './share';
import customEmojis from './customEmojis';
import activeUsers from './activeUsers';
import usersTyping from './usersTyping';
import inviteLinks from './inviteLinks';
import createDiscussion from './createDiscussion';
import enterpriseModules from './enterpriseModules';
import encryption from './encryption';
import permissions from './permissions';
import roles from './roles';
import company from './company';
import workspace from './workspace';
import schedule from './schedule';
import tab from './tab';
import selectedDepartments from './selectedDepartments';
import cloudDisk from './cloudDisk';
import chat from './chat';

export default combineReducers({
	settings,
	login,
	meteor,
	server,
	selectedUsers,
	createChannel,
	app,
	room,
	rooms,
	sortPreferences,
	share,
	customEmojis,
	activeUsers,
	usersTyping,
	inviteLinks,
	createDiscussion,
	inquiry,
	enterpriseModules,
	encryption,
	permissions,
	roles,
	contacts,
	workspace,
	company,
	tab,
	schedule,
	cloudDisk,
	chat,
	selectedDepartments
});
