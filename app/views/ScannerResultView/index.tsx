import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import { ChatsStackParamList } from '../../stacks/types';
import * as HeaderButton from '../../containers/HeaderButton';
import { Services } from '../../lib/services';
import { IApplicationState } from '../../definitions';
import { IJoinFederation } from './interface';
import { ApplyFederation } from './ScannerResult/ApplyFederation';
import Loading from '../../containers/Loading';
import { ScannerResult } from '../ScannerView';
import { Http } from './ScannerResult/Http';
import log from '../../utils/log';
import I18n from '../../i18n';

interface IRoomInvitedViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'ScannerResultView'>;
	route: RouteProp<ChatsStackParamList, 'ScannerResultView'>;
}

enum result {
	LOADING = 'loading',
	SUCCESS = 'success',
	FAIL = 'fail'
}

const ScannerTitle: Record<string, string> = {
	join_federation: `申请加入`,
	http: '扫描结果'
};

const ScannerResultView = ({ navigation, route }: IRoomInvitedViewProps): React.ReactElement => {
	const { data, type } = route.params;
	const [scannerResult, setScannerResult] = useState(result.LOADING);
	const user = useSelector((state: IApplicationState) => state.login.user.username || state.login.user.name || '');
	const [joinInfo, setJoinInfo] = useState<IJoinFederation>();
	const { setOptions } = useNavigation();

	useLayoutEffect(() => {
		setOptions({
			headerLeft: () => <HeaderButton.BackButton onPress={() => navigation.pop()} />,
			headerTitleAlign: 'center',
			title: `${ScannerTitle[type]}${joinInfo?.roomType === 'p' ? I18n.t('Channel') : I18n.t('Team')}`
		});
	}, []);

	useEffect(() => {
		(async () => {
			try {
				switch (type) {
					case ScannerResult.JOIN_FEDERATION:
						await joinFederationResult();
						break;
					case ScannerResult.HTTP:
						httpResult();
						break;
				}
			} catch (e) {
				console.info('ScanResult', e);
				setScannerResult(result.FAIL);
			}
		})();
	}, []);

	const httpResult = () => {
		setScannerResult(result.SUCCESS);
		navigation.pop();
	};
	const joinFederationResult = async () => {
		try {
			console.info('data-user', data, user);
			const res = await Services.getJoinRoomInfo(data, user);
			console.info('res', res);
			setJoinInfo(res.success ? res.data : ({} as IJoinFederation));
			setScannerResult(result.SUCCESS);
		} catch (e) {
			setScannerResult(result.FAIL);
			log(e);
		}
	};

	const renderSuccess = () => {
		switch (type) {
			case ScannerResult.JOIN_FEDERATION:
				// @ts-ignore
				return <ApplyFederation joinInfo={joinInfo} navigation={navigation} inviteId={data} />;
			case ScannerResult.HTTP:
				return <Http data={data} />;
		}
	};

	const renderFail = () => <Text> 加载失败... </Text>;

	const renderLoading = () => <Loading></Loading>;

	const renderScannerResult = () => {
		switch (scannerResult) {
			case result.FAIL:
				return renderFail();
			case result.SUCCESS:
				return renderSuccess();
			case result.LOADING:
				return renderLoading();
		}
	};

	return (
		<SafeAreaView style={{ backgroundColor: '#FAFAFA' }}>
			<StatusBar />
			<View style={[{ alignItems: 'center', justifyContent: 'center', flex: 1 }]}>{renderScannerResult()}</View>
		</SafeAreaView>
	);
};

export default ScannerResultView;
