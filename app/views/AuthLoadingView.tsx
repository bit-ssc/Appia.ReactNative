import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import StatusBar from '../containers/StatusBar';
import { useTheme } from '../theme';
import sharedStyles from './Styles';
import { useAppSelector } from '../lib/hooks';
import { appStart } from '../actions/app';
import { RootEnum } from '../definitions';
import { store as reduxStore } from '../lib/store/auxStore';
import { showToast } from '../lib/methods/helpers/showToast';
import I18n from '../i18n';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	text: {
		fontSize: 16,
		paddingTop: 10,
		paddingHorizontal: 16,
		...sharedStyles.textRegular
	},
	singleLineText: {
		// 单行文本样式
		textAlign: 'center'
	},
	multiLineText: {
		// 多行文本样式
		textAlign: 'left'
	}
});

const AuthLoadingView = React.memo((): React.ReactElement => {
	const [isSingleLine, setIsSingleLine] = useState(true);

	useEffect(() => {
		const { user } = reduxStore.getState().login;
		const timeout = setTimeout(() => {
			reduxStore.dispatch(appStart({ root: !user ? RootEnum.ROOT_OUTSIDE : RootEnum.ROOT_INSIDE }));
			showToast(I18n.t('NetworkError'));
		}, 18000);

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, []);

	const onTextLayout = e => {
		setIsSingleLine(e.nativeEvent.lines?.length === 1);
	};

	const text = useAppSelector(state => state.app.text);
	const { colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
			<StatusBar />
			{text ? (
				<>
					<ActivityIndicator color={colors.auxiliaryText} size='large' />
					<Text
						onLayout={onTextLayout}
						style={[styles.text, { color: colors.bodyText }, isSingleLine ? styles.singleLineText : styles.multiLineText]}
					>{`${text}`}</Text>
				</>
			) : null}
		</View>
	);
});

export default AuthLoadingView;
