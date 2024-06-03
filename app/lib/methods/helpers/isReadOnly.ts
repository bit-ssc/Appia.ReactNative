import { store as reduxStore } from '../../store/auxStore';
import { ISubscription } from '../../../definitions';
import { hasPermission } from './helpers';
import { Services } from '../../services';

const canPostReadOnly = async ({ rid }: { rid: string }) => {
	// TODO: this is not reactive. If this permission changes, the component won't be updated
	const postReadOnlyPermission = reduxStore.getState().permissions['post-readonly'];
	const permission = await hasPermission([postReadOnlyPermission], rid);
	return permission[0];
};

const isMuted = (room: Partial<ISubscription>, username: string) =>
	room && room.muted && room.muted.find && !!room.muted.find(m => m === username);

export const isReadOnly = async (room: Partial<ISubscription>, username: string): Promise<boolean> => {
	if (room.archived) {
		return true;
	}
	if (isMuted(room, username)) {
		return true;
	}
	// fixme 外部频道退出再进入会出现 ro 同步错乱的问题
	let ro;
	if (room.federated) {
		try {
			const res = await Services.getFederationInfo(room?.rid || '');
			ro = res.data?.ro;
		} catch (e) {
			console.info(e);
		}
	} else {
		ro = room.ro;
	}
	if (ro) {
		const allowPost = await canPostReadOnly({ rid: room.rid as string });
		if (allowPost) {
			return false;
		}
		return true;
	}
	return false;
};
