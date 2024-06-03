import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import I18n from 'i18n-js';

import px2dp from './Utils';
import { ChannelIcon, RemoveUnread, Scan, UserGroup } from '../../../containers/Icon/Scaner';

const { width, height } = Dimensions.get('window');

const mTop = px2dp(64);
let mWidth = 132;
let mHeight = 184;
const marginTop = mTop;

interface IMorePopWidowsStatus {
	isVisible: boolean;
}

interface IMorePopWidowsProps {
	show: boolean;
	width: number;
	height: number;
	closeModal: Function;
	goPageView: Function;
	goToNewMessage: Function;
	removeUnreads: Function;
}

export default class MorePopWidows extends React.Component<IMorePopWidowsProps, IMorePopWidowsStatus> {
	constructor(props: IMorePopWidowsProps) {
		super(props);
		this.state = {
			isVisible: this.props.show
		};
		mWidth = this.props.width;
		mHeight = this.props.height;
	}

	componentWillReceiveProps(nextProps: IMorePopWidowsProps) {
		this.setState({ isVisible: nextProps.show });
	}

	closeModal() {
		this.setState({
			isVisible: false
		});
		this.props.closeModal(false);
	}

	render() {
		const { goPageView, goToNewMessage, removeUnreads } = this.props;
		return (
			<View style={styles.container}>
				<Modal transparent={true} visible={this.state.isVisible} animationType={'fade'} onRequestClose={() => this.closeModal()}>
					<TouchableOpacity style={styles.container} activeOpacity={1} onPress={() => this.closeModal()}>
						<Shadow containerStyle={[styles.modal]} distance={5}>
							<View style={styles.viewStyle}>
								<TouchableOpacity
									activeOpacity={1}
									onPress={() => {
										goPageView();
										this.closeModal();
									}}
									style={styles.itemView}
								>
									<View style={styles.imgStyle}>
										<Scan />
									</View>
									<Text style={styles.textStyle}>{I18n.t('Scan')}</Text>
								</TouchableOpacity>
								<TouchableOpacity
									activeOpacity={1}
									onPress={() => {
										goToNewMessage(false);
										this.closeModal();
									}}
									style={styles.itemView}
								>
									<View style={styles.imgStyle}>
										<UserGroup />
									</View>
									<Text style={styles.textStyle}>{`${I18n.t('Creat_New')}${I18n.t('Team')}`}</Text>
								</TouchableOpacity>
								<TouchableOpacity
									activeOpacity={1}
									onPress={() => {
										goToNewMessage(true);
										this.closeModal();
									}}
									style={styles.itemView}
								>
									<View style={styles.imgStyle}>
										<ChannelIcon />
									</View>
									<Text style={styles.textStyle}>{`${I18n.t('Creat_New')}${I18n.t('Channel')}`}</Text>
								</TouchableOpacity>
								<TouchableOpacity
									activeOpacity={1}
									onPress={() => {
										removeUnreads();
										this.closeModal();
									}}
									style={styles.itemView}
								>
									<View style={styles.imgStyle}>
										<RemoveUnread />
									</View>
									<Text style={styles.textStyle}>{I18n.t('Remove_Unread')}</Text>
								</TouchableOpacity>
							</View>
						</Shadow>
					</TouchableOpacity>
				</Modal>
			</View>
		);
	}
}
const styles = StyleSheet.create({
	container: {
		width,
		height,
		position: 'absolute'
	},
	viewStyle: {
		width: mWidth,
		height: mHeight,
		borderRadius: 8
	},
	modal: {
		backgroundColor: '#fff',
		position: 'absolute',
		left: width - mWidth - 10,
		top: marginTop
	},
	itemView: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		paddingVertical: 12,
		paddingLeft: 8,
		paddingRight: 12
	},
	textStyle: {
		color: '#000',
		fontSize: 16,
		marginLeft: 2,
		fontWeight: '400'
	},
	imgStyle: {
		marginHorizontal: 10,
		width: 24,
		height: 24
	}
});
