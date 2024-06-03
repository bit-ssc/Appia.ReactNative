import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, TouchableOpacity, GestureResponderEvent } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSelector } from 'react-redux';

import { IApprove, IMessageInner, IBtn } from '../interfaces';
import styles from './styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import I18n from '../../../i18n';
import { getMaxMessageWidth } from './helper';
import RocketButton from '../../Button';
import { getFanweiHeaderToken, postApproval } from '../../../lib/services/restApi';
import { openWebview } from '../../../utils/openLink';
import { IApplicationState } from '../../../definitions';
import { getUserSelector } from '../../../selectors/login';
import { showToast } from '../../../lib/methods/helpers/showToast';
import UserPreferences from '../../../lib/methods/userPreferences';

interface IBtnProps {
	marginRight: number;
	btn: IBtn;
	onPress: (evt: GestureResponderEvent, btn: IBtn) => void;
}

const colorMap = new Map<string, string>([
	['begin_info', '#2878ff'],
	['create', '#09ca29'],
	['update', '#2878ff'],
	['invite', '#2878ff'],
	['cancel', '#ff4343']
]);

const Button: React.FC<IBtnProps> = ({ marginRight, btn, onPress: propsOnPress }) => {
	const { name, key, bold } = btn;
	const [loading, setLoading] = useState(false);
	const disabled = !key;
	const onPress = useCallback(
		async (evt: GestureResponderEvent) => {
			setLoading(true);
			await propsOnPress(evt, btn);
			setLoading(false);
		},
		[btn, propsOnPress]
	);

	if (disabled) {
		return (
			<RocketButton
				style={[
					styles.btn,
					{
						height: 28,
						backgroundColor: '#EEEEEE'
					}
				]}
				styleText={[
					{
						color: 'rgba(0, 0, 0, 0.26)',
						fontSize: 14
					}
				]}
				title={name}
				disabled
				onPress={() => {}}
				type='default'
			/>
		);
	}

	return (
		<RocketButton
			style={[
				styles.btn,
				{
					marginRight,
					borderWidth: 1,
					borderColor: bold ? '#2878ff' : 'rgba(220, 220, 220, 1)'
				}
			]}
			styleText={[
				{
					fontSize: 14,
					color: bold ? '#2878FF' : 'rgba(0, 0, 0, 0.6);'
				}
			]}
			onPress={onPress}
			loading={loading}
			type='default'
			title={name}
		/>
	);
};

const Approval: React.FC<IMessageInner> = props => {
	const { msgData, id, msgType } = props;
	const { theme } = useTheme();
	const data = useMemo(() => JSON.parse(msgData as string) as IApprove, [msgData]);
	const isLink = !!(data.linkInfo && data.linkInfo.appUrl);
	const [btnList, setBtnList] = useState<IBtn[]>(data?.btnList || []);
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const server = useSelector((state: IApplicationState) => state.server.server);
	const enterpriseId = useSelector((state: IApplicationState) => state.settings.Enterprise_ID);

	useEffect(() => {
		setBtnList(data?.btnList || []);
	}, [data?.btnList]);

	const directUrl = async ({ linkInfo, source }: IApprove) => {
		if (linkInfo.appUrl && linkInfo.appUrl.includes('/contract-system/convert')) {
			openWebview(
				appendQueryStringV2(linkInfo.appUrl, `account=${user.username}`),
				{ title: linkInfo.title || 'BITMAIN', needAuth: linkInfo.needAuth, source },
				theme
			);
			return;
		}

		if (linkInfo.url.includes('oa.bitmain.vip')) {
			let company = 1;
			if (enterpriseId === 'POWERMAIN') {
				company = 3;
			} else if (enterpriseId === 'SOPHGO') {
				company = 2;
			}
			await requestFanweiHeaderToken();

			fetch(`${server}/hrm-api/v1/get-weaver-app-token?account=${user.username}&company=${company}`, {
				method: 'GET',
				headers: { 'x-auth-token': user.token, 'x-user-id': user.id }
			})
				.then(response => response.json())
				.then(data => {
					if (data.success && data.code === 1) {
						openWebview(
							`${appendQueryString(linkInfo.appUrl || '', `ssoToken=${data.data}`)}`,
							{ title: linkInfo.title || 'BITMAIN', needAuth: linkInfo.needAuth, source },
							theme
						);
					}
				})
				.catch(error => {
					showToast(`服务器发生错误，请稍后重试,${error}`);
				});
			return;
		}
		if (linkInfo.appUrl) {
			openWebview(linkInfo.appUrl, { title: linkInfo.title || 'BITMAIN', needAuth: linkInfo.needAuth, source }, theme);
		}
	};

	const requestFanweiHeaderToken = async () => {
		const preTime = UserPreferences.getString('fwTokenTime');

		if (new Date().getTime() - Number(preTime) > 1500000 || !UserPreferences.getString('fwToken')) {
			try {
				const token = await getFanweiHeaderToken();
				UserPreferences.setString('fwToken', token);
				UserPreferences.setString('fwTokenTime', `${new Date().getTime()}`);
			} catch (error) {
				console.info('error', error);
				showToast('获取流程信息报错，请点击重试');
			}
		}
	};

	// 用下面的函数进行拼接
	const appendQueryString = (url: string, queryString: string) => {
		const index = url.indexOf('?');

		if (index === -1) {
			// 如果字符串中没有问号，则直接拼接
			return `${url}?${queryString}`;
		}
		// 如果字符串中已经存在问号，则在第一个问号后面拼接
		return `${url.substring(0, index + 1)}${queryString}${url.substring(index + 1)}`;
	};

	// 用这个函数进行拼接，上面对泛微特殊处理
	const appendQueryStringV2 = (url: string, queryString: string) => {
		const index = url.indexOf('?');

		if (index === -1) {
			// 如果字符串中没有问号，则直接拼接
			return `${url}?${queryString}`;
		}
		// 如果字符串中已经存在问号，则在第一个问号后面拼接
		return `${url.substring(0, index + 1)}${queryString}&${url.substring(index + 1)}`;
	};

	const approval = useCallback(
		async (evt: GestureResponderEvent, btn: IBtn) => {
			evt.preventDefault();
			evt.stopPropagation();

			if (btn.type === 'copy') {
				if (btn.key) {
					Clipboard.setString(btn.key as string);
					showToast(I18n.t('Copied_to_clipboard'));
				}

				return;
			}

			if (btn.type === 'open') {
				if (btn.key) {
					openWebview(btn.key, { title: btn.name || ' ', needAuth: btn.needAuth }, theme);
				}

				return;
			}

			if (btn.type === 'request' || msgType === 'approval') {
				try {
					const { name } = await postApproval({
						messageId: id || '',
						key: btn.key as string
					});

					setBtnList([
						{
							name
						}
					]);

					showToast('操作成功');
				} catch (e) {
					console.log(e);
					showToast('操作失败');
				}
			}
		},
		[id, msgType, theme]
	);
	let footer = null;

	if (btnList?.length) {
		footer = (
			<View style={[styles.btnList, { borderColor: themes[theme].borderColor }]}>
				{btnList?.map((btn, index) => (
					<Button marginRight={index === btnList.length - 1 ? 0 : 12} btn={btn} onPress={approval} />
				))}
			</View>
		);
	} else if (isLink) {
		footer = (
			<View style={[styles.footerWrapper, { borderColor: themes[theme].borderColor }]}>
				<Text style={[styles.footer, { color: themes[theme].auxiliaryText }]}>
					{isLink ? data.linkInfo?.name : I18n.t('Not_Support')}
				</Text>
			</View>
		);
	}

	const renderTag = () => {
		const { title, tag, extraData, titleTagAlign } = data;

		return titleTagAlign === 'start' ? (
			<Text style={[styles.header, { color: themes[theme].headerTitleColor }]}>
				{title}
				{'   '}
				{tag ? (
					<Text style={[styles.tagWrapperMeeting, { color: `${colorMap.get(extraData?.action ?? 'begin_info')}` }]}>{tag}</Text>
				) : null}
			</Text>
		) : (
			<Text style={[styles.header, { color: themes[theme].headerTitleColor }]}>
				{tag ? (
					<View style={{ borderRadius: 4, backgroundColor: 'rgba(40, 120, 255, 0.12)' }}>
						<Text style={[styles.tagWrapper]}>{tag}</Text>
					</View>
				) : null}
				{'  '}
				{title}
			</Text>
		);
	};

	const content = (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor, width: getMaxMessageWidth() }]}>
			<View style={[styles.headerWrapper]}>{renderTag()}</View>
			<View style={[styles.body]}>
				{data.textList?.map(({ label, value, tags }) => {
					if (value || tags) {
						return (
							<View nativeID={value.toString()} style={[styles.row]}>
								<Text style={[styles.label, { color: themes[theme].auxiliaryText }]}>{label}</Text>
								<Text style={[styles.value, { color: themes[theme].headerTitleColor }]}>{value}</Text>
								{tags?.map(tag => (
									<Text
										style={[
											styles.valueTag,
											{
												borderColor: tag.borderColor || '#E8F2FF',
												backgroundColor: tag.backgroundColor || '#E8F2FF',
												color: tag.color || '#1B5BFF'
											}
										]}
									>
										{tag.text}
									</Text>
								))}
							</View>
						);
					}

					return null;
				})}
			</View>
			{footer}
		</View>
	);
	return isLink ? <TouchableOpacity onPress={() => directUrl(data)}>{content}</TouchableOpacity> : content;
};

export default Approval;
