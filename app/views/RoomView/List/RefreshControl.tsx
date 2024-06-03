import React from 'react';
import { RefreshControl as RNRefreshControl, RefreshControlProps, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../theme';
import { isAndroid } from '../../../lib/methods/helpers';

const style = StyleSheet.create({
	container: {
		flex: 1
	},
	inverted: {
		scaleY: -1
	}
});

interface IRefreshControl extends RefreshControlProps {
	children: React.ReactElement;
}

const ProgressViewOffset = 100;

const RefreshControl = ({ children, onRefresh, refreshing }: IRefreshControl): React.ReactElement => {
	const { colors } = useTheme();
	if (isAndroid) {
		return <View style={[style.container, style.inverted]}>{children}</View>;
	}

	const refreshControl = (
		<RNRefreshControl
			progressViewOffset={ProgressViewOffset}
			onRefresh={onRefresh}
			refreshing={refreshing}
			tintColor={colors.auxiliaryText}
		/>
	);

	return React.cloneElement(children, { refreshControl });
};

export default RefreshControl;
