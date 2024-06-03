import { CommonActions } from '@react-navigation/native';

import Navigation from '../../navigation/appNavigation';
import { IOmnichannelRoom, SubscriptionType, IVisitor, TSubscriptionModel, ISubscription } from '../../../definitions';
import { getRoomTitle, getUidDirectMessage } from './helpers';
import { Services } from '../../services';
import { store } from '../../store/auxStore';
import { logInfo } from '../../../utils/log';

interface IGoRoomItem {
	search?: boolean; // comes from spotlight
	username?: string;
	t?: SubscriptionType;
	rid?: string;
	name?: string;
	prid?: string;
	visitor?: IVisitor;
	bot?: boolean;
	welcomeMsg?: string;
	_id?: string;
	robotName?: string;
}

export type TGoRoomItem = IGoRoomItem | TSubscriptionModel | ISubscription | IOmnichannelRoomVisitor;

const navigate = ({
	item,
	isMasterDetail,
	popToRoot,
	...props
}: {
	item: TGoRoomItem;
	isMasterDetail: boolean;
	popToRoot: boolean;
	toDiscussion?: boolean;
}) => {
	const routeParams = {
		rid: item.rid,
		name: getRoomTitle(item),
		t: item.t,
		prid: item.prid,
		room: item,
		visitor: item.visitor,
		roomUserId: getUidDirectMessage(item),
		bot: item.bot,
		...props
	};

	if (isMasterDetail) {
		if (popToRoot) {
			Navigation.navigate('DrawerNavigator');
		}
		return Navigation.dispatch((state: any) => {
			const routesRoomView = state.routes.filter((r: any) => r.name !== 'RoomView');
			return CommonActions.reset({
				...state,
				routes: [
					...routesRoomView,
					{
						name: 'RoomView',
						params: routeParams
					}
				],
				index: routesRoomView.length
			});
		});
	}

	if (popToRoot) {
		Navigation.navigate('RoomsListView');
	}

	// FIXME:dxd 一键全员
	Navigation.navigate('RoomView', {
		rid: item.rid,
		name: getRoomTitle(item),
		t: item.t,
		prid: item.prid,
		room: item,
		visitor: item.visitor,
		roomUserId: getUidDirectMessage(item),
		// all: (item as IGoRoomItem).all,
		...props
	});

	/* return Navigation.dispatch((state: any) => {
		const routesRoomsListView = state.routes.filter((r: any) => r.name === 'RoomsListView');
		return CommonActions.reset({
			...state,
			routes: [
				...routesRoomsListView,
				{
					name: 'RoomView',
					params: routeParams,
					key: ''
				}
			],
			index: routesRoomsListView.length
		});
	}); */
};

interface IOmnichannelRoomVisitor extends IOmnichannelRoom {
	// this visitor came from ee/omnichannel/views/QueueListView
	visitor: IVisitor;
}

export const goRoom = async ({
	item,
	isMasterDetail = false,
	popToRoot = false,
	isDeepLink = false,
	...props
}: {
	item: TGoRoomItem;
	isMasterDetail: boolean;
	jumpToMessageId?: string;
	usedCannedResponse?: string;
	popToRoot?: boolean;
	isDeepLink?: boolean;
}): Promise<void> => {
	if (!('id' in item) && item.t === SubscriptionType.DIRECT && item?.search) {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await Services.createDirectMessage(username as string);
			if (result.success && result?.room?._id) {
				return navigate({
					item: {
						rid: result.room._id,
						name: username || '',
						t: SubscriptionType.DIRECT,
						bot: item.bot,
						welcomeMsg: item.welcomeMsg,
						_id: item?._id,
						robotName: item?.robotName
					},
					isMasterDetail,
					popToRoot,
					...props
				});
			}
			if (isDeepLink) {
				const userInfo = store.getState().login.user;
				const { server } = store.getState();
				logInfo(
					server.server ? server.server : '',
					'deep_link_open',
					'info',
					`result=${result}`,
					'goRoom-1',
					userInfo?.id,
					userInfo?.username
				);
			}
		} catch (e) {
			if (isDeepLink) {
				const userInfo = store.getState().login.user;
				const { server } = store.getState();
				logInfo(
					server.server ? server.server : '',
					'deep_link_open',
					'error',
					`e=${e}`,
					'goRoom-2',
					userInfo?.id,
					userInfo?.username
				);
			}
		}
	}

	return navigate({ item, isMasterDetail, popToRoot, ...props });
};
