import React from 'react';
import { FlatList } from 'react-native';

import { ISubscription } from '../../../../definitions';

export interface IRoomItem extends ISubscription {
	search?: boolean;
	outside?: boolean;
}

export type SearchRenderListProps<ItemT> = React.ComponentProps<typeof FlatList> & {
	data: ItemT[];
	displayMode: string;
	onPress?: (item?: ISubscription) => void;
	showLastMessage: boolean;
	username: string;
	useRealName: boolean;
	showAvatar: boolean;
	getRoomTitle: (room: any) => any;
	getRoomAvatar: (room: any) => any;
	showDot: boolean;
	channelDotColor: string;
	discussionDotColor: string;
	teamDotColor: string;
	borderRadius: any;
	height: number;
	searchText: string;
};

export interface IRoomContainerProps<ItemT>
	extends Omit<SearchRenderListProps<ItemT>, 'data' | 'renderItem' | 'height' | 'searchText'> {
	item: ItemT;
	id: any;
}
