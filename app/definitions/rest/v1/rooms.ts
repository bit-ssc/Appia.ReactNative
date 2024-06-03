import type { IMessage } from '../../IMessage';
import type { IRoomNotifications, IServerRoom } from '../../IRoom';
import type { IEnterprise, IUser } from '../../IUser';
import { IJoinFederation } from '../../../views/ScannerResultView/interface';

export type RoomsEndpoints = {
	'rooms.autocomplete.channelAndPrivate': {
		GET: (params: { selector: string }) => {
			items: IServerRoom[];
		};
	};
	'rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: { selector: string; offset?: number; count?: number; sort?: string }) => {
			items: IServerRoom[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'rooms.autocomplete.availableForTeams': {
		GET: (params: { name: string }) => {
			items: IServerRoom[];
		};
	};
	'rooms.info': {
		GET: (params: { roomId: string } | { roomName: string }) => {
			room: IServerRoom;
		};
	};
	'rooms.createDiscussion': {
		POST: (params: {
			prid: IServerRoom['_id'];
			pmid?: IMessage['_id'];
			t_name: IServerRoom['fname'];
			users?: IUser['username'][];
			encrypted?: boolean;
			reply?: string;
			all?: boolean;
		}) => {
			discussion: IServerRoom;
		};
	};
	'rooms.favorite': {
		POST: (params: { roomId: string; favorite: boolean }) => {};
	};
	'rooms.saveNotification': {
		POST: (params: { roomId: string; notifications: IRoomNotifications }) => {};
	};
	'rooms.roomAnnouncementRead': {
		POST: (params: { rid: string; announcementId: string }) => {};
	};
	'room/join/info': {
		GET: (params: { inviteId: string; username: string }) => {
			data: IJoinFederation;
		};
	};
	'exist/external.member': {
		GET: (params: { rid: string }) => {
			data: {
				exit: boolean;
			};
		};
	};
	'apply/rooms.join': {
		POST: (params: {
			mri: string;
			managerInfos: { name: string; username: string; roles: string[] }[];
			roomName: string;
			roomType: string;
			inviterUsername: string;
			inviterOrg: string;
			rt: string;
			inviteId?: string;
			users?: string[];
			departments?: string[];
		}) => {};
	};
	'federation/web/local/bridged.room': {
		GET: (params: { mri: string }) => {
			data: {
				_id: string;
				rt: string;
				t: string;
				fname: string;
			};
		};
	};
	'external/bridged.room': {
		GET: (params: { rid: string }) => {
			data: {
				mri: string;
				t: string;
				rt: string;
				fname: string;
			};
		};
	};
	'appia/room/changeMemberName': {
		POST: (params: { rid: string; name: string }) => {};
	};
	'appia/room/members': {
		GET: (params: { rid: string }) => {
			data: IEnterprise[];
		};
	};
	'room.role.add': {
		POST: (params: { rid: string; role: string; username: string; single?: boolean }) => {};
	};
	'room.role.remove': {
		POST: (params: { rid: string; role: string; username: string }) => {};
	};
	'room.firsUnread': {
		GET: (params: { rid: string }) => { message: IMessage; unread: number };
	};
};
