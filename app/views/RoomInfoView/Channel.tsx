import React from 'react';
import { View } from 'react-native';

import I18n from '../../i18n';
import { ISubscription } from '../../definitions';
import Item from './Item';
import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';

const Channel = ({ room, theme }: { room: ISubscription; theme: TSupportedThemes }) => {
	const { description } = room;
	const { t } = I18n;

	return (
		<View style={{ backgroundColor: themes[theme].backgroundColor }}>
			<Item
				label={t('Description')}
				content={description || `__${t('No_label_provided', { label: t('description') })}__`}
				testID='room-info-view-description'
			/>
			{/* <Item*/}
			{/*	label={t('Topic')}*/}
			{/*	content={topic || `__${t('No_label_provided', { label: t('topic') })}__`}*/}
			{/*	testID='room-info-view-topic'*/}
			{/* />*/}
			{/* <Item
				label={t('Announcement')}
				content={(announcement && announcement.message) || `__${t('No_label_provided', { label: t('announcement') })}__`}
				testID='room-info-view-announcement'
			/> */}
			{/* <Item
				label={t('Broadcast_Channel')}
				content={room.broadcast ? t('Broadcast_channel_Description') : ''}
				testID='room-info-view-broadcast'
			/> */}
		</View>
	);
};

export default Channel;
