import { forwardRef, useImperativeHandle } from 'react';
import { Alert } from 'react-native';

import protectedFunction from '../lib/methods/helpers/protectedFunction';
import I18n from '../i18n';
import { TMessageModel } from '../definitions';
import { resendMessage } from '../lib/methods';

export interface IMessageErrorActions {
	showMessageErrorActions: (message: TMessageModel) => void;
}

const MessageErrorActions = forwardRef<IMessageErrorActions, { tmid?: string }>(({ tmid }, ref) => {
	const handleResend = protectedFunction(async (message: TMessageModel) => {
		await resendMessage(message, tmid);
	});

	const showMessageErrorActions = (message: TMessageModel) => {
		Alert.alert(
			`${I18n.t('Resend')}?`, // 弹窗标题
			'',
			[
				{
					text: I18n.t('Cancel'),
					onPress: () => console.log('确认操作')
				},
				{
					text: I18n.t('Upload_File_Resend'),
					onPress: () => {
						handleResend(message);
					}
				}
			],
			{ cancelable: true }
		);
	};

	useImperativeHandle(ref, () => ({
		showMessageErrorActions
	}));

	return null;
});

export default MessageErrorActions;
