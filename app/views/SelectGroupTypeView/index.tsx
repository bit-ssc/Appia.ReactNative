import * as React from 'react';
import { Text, ImageBackground, TouchableOpacity } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import SafeAreaView from '../../containers/SafeAreaView';
import { NewMessageStackParamList } from '../../stacks/types';
import { IBaseScreen } from '../../definitions';

export type ISelectGroupTypeViewProps = IBaseScreen<NewMessageStackParamList, 'SelectGroupTypeView'>;

export interface ISelectGroupTypeViewState {
	selectedType: number;
}

export default class SelectGroupTypeView extends React.Component<ISelectGroupTypeViewProps, ISelectGroupTypeViewState> {
	private dataSource = [
		{ title: I18n.t('Group_Chat'), detail: I18n.t('Select_Group_Type_Group_Chat') },
		{ title: I18n.t('Channels'), detail: I18n.t('Select_Group_Type_Channel') }
	];

	constructor(props: ISelectGroupTypeViewProps) {
		super(props);
		this.state = {
			selectedType: this.props?.route?.params?.selectedType || 0
		};
		this.setHeader();
	}

	setHeader = () => {
		const { navigation } = this.props;
		const options = {
			title: I18n.t('Group_Type'),
			headerLeft: () => <HeaderButton.BackButton onPress={this.onBackPress} />
		};
		navigation.setOptions(options);
	};

	onBackPress = () => {
		const { navigation } = this.props;
		navigation.goBack();
	};

	itemClick = (index: number) => {
		this.setState({ selectedType: index });
		const nextAction = this.props.route.params?.nextAction;
		if (nextAction) {
			nextAction(index);
		}
		this.onBackPress();
	};

	renderItem = ({ item, index }: { item: { title: string; detail: string }; index: number }) => {
		const { selectedType } = this.state;
		return (
			<TouchableOpacity
				onPress={() => {
					this.itemClick(index);
				}}
			>
				<ImageBackground
					resizeMethod='scale'
					style={{ marginTop: 20, minHeight: 170 }}
					source={index === selectedType ? require('./image/select_group_sel.png') : require('./image/select_group_unsel.png')}
				>
					<Text style={{ marginTop: 20, marginLeft: 20, fontSize: 20 }}>{item.title}</Text>
					<Text style={{ marginHorizontal: 20, marginTop: 10, fontSize: 16 }}>{item.detail}</Text>
				</ImageBackground>
			</TouchableOpacity>
		);
	};

	render = () => (
		<SafeAreaView>
			<FlatList data={this.dataSource} renderItem={this.renderItem} style={{ marginHorizontal: 20 }}></FlatList>
		</SafeAreaView>
	);
}
