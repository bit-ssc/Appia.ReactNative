// ACTIONS
import { TActionInquiry } from '../../ee/omnichannel/actions/inquiry';
import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionApp } from '../../actions/app';
import { TActionCreateChannel } from '../../actions/createChannel';
import { TActionCreateDiscussion } from '../../actions/createDiscussion';
import { TActionCustomEmojis } from '../../actions/customEmojis';
import { TActionEncryption } from '../../actions/encryption';
import { TActionInviteLinks } from '../../actions/inviteLinks';
import { IActionRoles } from '../../actions/roles';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { TActionServer } from '../../actions/server';
import { IActionSettings } from '../../actions/settings';
import { TActionsShare } from '../../actions/share';
import { TActionSortPreferences } from '../../actions/sortPreferences';
import { TActionUserTyping } from '../../actions/usersTyping';
import { TActionPermissions } from '../../actions/permissions';
import { TActionEnterpriseModules } from '../../actions/enterpriseModules';
import { TActionCompany } from '../../actions/company';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IApp } from '../../reducers/app';
import { IConnect } from '../../reducers/connect';
import { ICreateChannel } from '../../reducers/createChannel';
import { ICreateDiscussion } from '../../reducers/createDiscussion';
import { IEncryption } from '../../reducers/encryption';
import { IInviteLinks } from '../../reducers/inviteLinks';
import { ILogin } from '../../reducers/login';
import { IRoles } from '../../reducers/roles';
import { IRoom } from '../../reducers/room';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { IServer } from '../../reducers/server';
import { TSettingsState } from '../../reducers/settings';
import { IShare } from '../../reducers/share';
import { IInquiry } from '../../ee/omnichannel/reducers/inquiry';
import { IPermissionsState } from '../../reducers/permissions';
import { IEnterpriseModules } from '../../reducers/enterpriseModules';
import { IContacts } from '../../reducers/contacts';
import { IWorkspace } from '../../reducers/workspace';
import { ICompanyStore } from '../../reducers/company';
import { ISchedule } from '../../reducers/schedule';
import { ITab } from '../../reducers/tab';
import { TActionTab } from '../../actions/tab';
import { ICloudDiskStore } from '../../reducers/cloudDisk';
import { TActionCloudDisk } from '../../actions/cloudDisk';
import { IChat } from '../../reducers/chat';
import { TActionChat } from '../../actions/chat';
import { TActionSelectedDepartment } from '../../actions/selectedDepartment';
import { ISelectedDepartments } from '../../reducers/selectedDepartments';

export interface IApplicationState {
	settings: TSettingsState;
	login: ILogin;
	meteor: IConnect;
	server: IServer;
	selectedUsers: ISelectedUsers;
	app: IApp;
	createChannel: ICreateChannel;
	room: IRoom;
	rooms: any;
	sortPreferences: any;
	share: IShare;
	customEmojis: any;
	activeUsers: IActiveUsers;
	usersTyping: any;
	inviteLinks: IInviteLinks;
	createDiscussion: ICreateDiscussion;
	inquiry: IInquiry;
	enterpriseModules: IEnterpriseModules;
	encryption: IEncryption;
	permissions: IPermissionsState;
	roles: IRoles;
	contacts: IContacts;
	workspace: IWorkspace;
	company: ICompanyStore;
	schedule: ISchedule;
	tab: ITab;
	selectedDepartments: ISelectedDepartments;
	cloudDisk: ICloudDiskStore;
	chat: IChat;
}

export type TApplicationActions = TActionActiveUsers &
	TActionSelectedUsers &
	TActionCustomEmojis &
	TActionInviteLinks &
	IActionRoles &
	IActionSettings &
	TActionEncryption &
	TActionSortPreferences &
	TActionUserTyping &
	TActionCreateDiscussion &
	TActionCreateChannel &
	TActionsShare &
	TActionServer &
	TActionApp &
	TActionInquiry &
	TActionPermissions &
	TActionEnterpriseModules &
	TActionCompany &
	TActionTab &
	TActionCloudDisk &
	TActionChat &
	TActionSelectedDepartment &
	TActionCloudDisk;
