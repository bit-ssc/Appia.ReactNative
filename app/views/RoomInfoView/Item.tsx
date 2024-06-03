import React from 'react';
import { Text, View } from 'react-native';

import Markdown from '../../containers/markdown';
import { themes } from '../../lib/constants';
import { TSupportedThemes, useTheme } from '../../theme';
import styles from './styles';
import { IListItem } from '../../containers/List/ListItem';
import * as List from '../../containers/List';

interface IListItemProps extends IListItem {
	theme: TSupportedThemes;
	rightText?: string | React.ReactElement;
	separator?: boolean;
}

export const ListItem: React.FC<IListItemProps> = ({ rightText, theme, separator = true, ...props }) => {
	const params = {} as { right?: () => React.ReactElement };

	if (rightText) {
		params.right = () => (
			<Text style={[{ fontSize: 14, color: themes[theme].auxiliaryText, textAlign: 'right' }]}>{rightText}</Text>
		);
	}

	return (
		<>
			<List.Item {...props} {...params} />
			{separator ? <List.Separator /> : null}
		</>
	);
};

interface IItem {
	label?: string;
	content?: string;
	testID?: string;
}

const Item = ({ label, content, testID }: IItem) => {
	const { theme } = useTheme();

	if (!content) {
		return null;
	}

	return (
		<View style={styles.item} testID={testID}>
			<Text accessibilityLabel={label} style={[styles.itemLabel, { color: themes[theme].titleText }]}>
				{label}
			</Text>
			<Markdown style={[styles.itemContent, { color: themes[theme].auxiliaryText }]} msg={content} theme={theme} />
		</View>
	);
};

export default Item;
