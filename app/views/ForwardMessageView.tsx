import React from 'react';
import { FlatList, Keyboard, NativeModules } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';

import { IMessageInner } from '../containers/message/interfaces';
import Message from '../containers/message';
import I18n from '../i18n';
import { isIOS } from '../lib/methods';
import RoomClass from '../lib/methods/subscriptions/room';
import { getUserSelector } from '../selectors/login';
import SafeAreaView from '../containers/SafeAreaView';
import { attachmentToPhoto, IApplicationState, IAttachment, TAnyMessageModel } from '../definitions';
import * as HeaderButton from '../containers/HeaderButton';
import Separator from './RoomView/Separator';

class ForwardMessageView extends React.Component<any> {
	private title?: string;
	private list: IMessageInner[];
	// Type of InteractionManager.runAfterInteractions
	private didMountInteraction?: {
		then: (onfulfilled?: (() => any) | undefined, onrejected?: (() => any) | undefined) => Promise<any>;
		done: (...args: any[]) => any;
		cancel: () => void;
	};
	private sub?: RoomClass;

	constructor(props: any) {
		super(props);
		this.title = props.route.params?.title;
		this.list = props.route.params?.list;
		this.setHeader();
	}

	setHeader = () => {
		const { navigation } = this.props;
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: this.title || I18n.t('Chat_record'),
			headerLeft: () => <HeaderButton.BackButton navigation={navigation} />
		});
	};

	showAttachment = (attachment: IAttachment) => {
		// const { navigation } = this.props;
		// // @ts-ignore
		// navigation.navigate('AttachmentView', { attachment });
		if (isIOS) {
			Keyboard.dismiss();
		}
		const photo = attachmentToPhoto(attachment);
		const JSToNativeManager = NativeModules?.JSToNativeManager;
		JSToNativeManager.showPhoto(photo);
	};

	// @ts-ignore
	renderItem = ({ item, index }) => {
		const { user, baseUrl, useRealName, Message_GroupingPeriod, Message_TimeFormat } = this.props;
		const previousItem = index > 0 ? (this.list[index - 1] as unknown as TAnyMessageModel) : undefined;
		let dateSeparator = null;
		if (!previousItem) {
			dateSeparator = item.ts;
		} else if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
			dateSeparator = item.ts;
		}

		const content = (
			// @ts-ignore
			<Message
				item={item}
				user={user as any}
				baseUrl={baseUrl}
				status={item.status}
				useRealName={useRealName}
				previousItem={previousItem}
				timeFormat={Message_TimeFormat}
				Message_GroupingPeriod={Message_GroupingPeriod}
				showAttachment={this.showAttachment}
			/>
		);

		if (dateSeparator) {
			return (
				<>
					<Separator ts={dateSeparator} unread={false} />
					{content}
				</>
			);
		}

		return content;
	};

	render() {
		return (
			<SafeAreaView>
				<FlatList data={this.list} renderItem={this.renderItem} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	baseUrl: state.server.server,
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod as number,
	Message_TimeFormat: state.settings.Message_TimeFormat as string
});

export default connect(mapStateToProps)(ForwardMessageView);
