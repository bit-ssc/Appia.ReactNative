import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import * as List from '../List';

type highlightType = 'plain' | 'highlight';

type contentType = 'text' | 'citation';

const styles = StyleSheet.create({
	message: {
		backgroundColor: '#ffffff',
		borderRadius: 4,
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginTop: 6
	},
	content: {
		padding: 8,
		fontSize: 16,
		...sharedStyles.textRegular,
		lineHeight: 28,
		flexShrink: 1,
		textAlign: 'left'
	},

	docContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: 5
	},
	docTitle: {
		fontSize: 16,
		...sharedStyles.textRegular,
		maxWidth: '80%'
	},
	line: {
		marginBottom: 8
	}
});

export interface IRefs {
	content: IContent[];
	snippets?: ISnippet[];
	docs: IDoc[];
	showRefer?: (doc: IDoc) => void;
}

export interface IContent {
	type: contentType;
	content?: string;
	displayNum?: string;
	snippetIndex?: number;
	highlights?: IHighlight[];
}

export interface IHighlight {
	type: highlightType;
	start: number;
	end: number;
}

export interface ISnippet {
	text: string;
	docIndex: number;
}

type docType = 'UUID' | 'URL';

export interface IDoc {
	title: string;
	uuid: string;
	displayNums: string[];
	type: string;
	url: docType;
}
const FastModelMsg = ({ content, docs, showRefer }: IRefs): React.ReactElement => {
	const { colors } = useTheme();

	const renderContentText = (content: IContent) => (
		<Text accessibilityLabel={content.content} style={{ color: colors.bodyText }}>
			{content.content?.replace(/\\n/g, '\n')}
		</Text>
	);

	const renderCitation = (content: IContent) => <Text style={{ color: colors.bodyText }}>{`[${content.displayNum}]`}</Text>;

	const contentShow = {
		text: renderContentText,
		citation: renderCitation
	};

	const renderAnswer = () => <Text style={styles.content}>{content.map(item => contentShow[item.type](item))}</Text>;

	const renderDoc = (doc: IDoc) => (
		<Touchable onPress={() => showRefer && showRefer(doc)}>
			<View style={styles.docContainer}>
				{doc.displayNums.map(item => (
					<Text style={[styles.docTitle, { color: colors.actionTintColor }]}>{`[${item}].`}</Text>
				))}
				<Text numberOfLines={1} style={[styles.docTitle, { color: colors.actionTintColor, marginStart: 5 }]}>
					{doc.title}
				</Text>
			</View>
		</Touchable>
	);

	const renderDocs = () =>
		docs && docs.length > 0 ? (
			<View>
				<List.Separator style={styles.line} />
				<Text style={[styles.docTitle, { color: colors.bodyText, marginStart: 5 }]}>{`${I18n.t('Refs')}`}</Text>
				{docs.map(item => renderDoc(item))}
			</View>
		) : null;

	return (
		<View style={styles.message}>
			{renderAnswer()}
			{renderDocs()}
		</View>
	);
};

export default FastModelMsg;
