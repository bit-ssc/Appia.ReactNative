import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Header } from '.';

const styles = StyleSheet.create({
	container: {
		marginBottom: 12
	}
});

interface IListSection {
	children: (React.ReactElement | null)[] | React.ReactElement | null;
	title?: string;
	translateTitle?: boolean;
	style?: StyleProp<ViewStyle>;
}

const ListSection = React.memo(({ children, title, translateTitle, style }: IListSection) => (
	<View style={[styles.container, style]}>
		{title ? <Header {...{ title, translateTitle }} /> : null}
		{children}
	</View>
));

ListSection.displayName = 'List.Section';

export default ListSection;
