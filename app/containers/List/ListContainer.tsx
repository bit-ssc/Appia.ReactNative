import React from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { withTheme } from '../../theme';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';

const styles = StyleSheet.create({
	container: {}
});

interface IListContainer {
	children: (React.ReactElement | null)[] | React.ReactElement | null;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}
const ListContainer = ({ children, style, ...props }: IListContainer) => (
	<ScrollView
		contentContainerStyle={[styles.container, style]}
		scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
		{...scrollPersistTaps}
		{...props}
	>
		{children}
	</ScrollView>
);

ListContainer.displayName = 'List.Container';

export default withTheme(ListContainer);
