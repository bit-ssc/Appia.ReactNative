import React from 'react';
import { PanResponder, Animated, TouchableOpacity, PanResponderInstance, Dimensions, Modal } from 'react-native';
import { connect } from 'react-redux';
// import Orientation from 'react-native-orientation-locker';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import { getUserSelector } from '../../selectors/login';
import { IApplicationState, IUser } from '../../definitions';
import { FeedbackIcon, CollapseIcon, LeftCollapseIcon } from '../Icon/Feedback';
import { isAndroid } from '../../utils/deviceInfo';
import Feedback from './Feedback';
import styles from './styles';

interface IState {
	pan: Animated.ValueXY;
	panResponder: null | PanResponderInstance;
	left: number;
	bottom: number;
	modalVisible: boolean;
	expand: boolean;
}

interface IProps {
	allowCenter?: boolean;
	user: IUser;
	insets: { left: number; bottom: number; right: number; top: number };
}
class Draggle extends React.Component<IProps, IState> {
	boxWidth = 20;
	boxHeight = 52;
	startX = 0;
	startY = 0;
	timer: any = null;

	constructor(props: IProps) {
		super(props);
		const screen = Dimensions.get('window');
		this.state = {
			pan: new Animated.ValueXY(),
			panResponder: null,
			left: screen.width - this.boxWidth,
			bottom: 80,
			modalVisible: false,
			expand: false
		};
	}

	componentDidMount(): void {
		const panResponder = this.createPanResponder();
		this.setState({ panResponder });
		// Orientation.addOrientationListener(this.onScreenChange);
		Dimensions.addEventListener('change', this.onScreenChange);
	}

	componentWillUnmount() {
		// Orientation.removeOrientationListener(this.onScreenChange);
		Dimensions.removeEventListener('change', this.onScreenChange);
	}

	onScreenChange = (): void => {
		const screen = Dimensions.get('window');
		const { insets } = this.props;
		let { left, bottom } = this.state;
		if (left > 100) {
			left = screen.width - this.boxWidth;
		}
		if (bottom <= insets.bottom) {
			bottom = insets.bottom;
		}
		const insetsTop = isAndroid ? insets.top + 30 : insets.top;
		if (bottom >= screen.height - insetsTop - this.boxHeight) {
			bottom = screen.height - insetsTop - this.boxHeight;
		}
		this.setState({ left, bottom });
	};

	createPanResponder = () =>
		PanResponder.create({
			// 在onMoveShouldSetPanResponder修改一下，以此来判断用户是点击 还是 拖拽
			onMoveShouldSetPanResponder: (_, gestureState) => {
				this.startX = this.state.left; // 起始位置
				this.startY = this.state.bottom;
				// 解决PanResponder中的onPress无作用, 当大于5时才进入移动事件，有的情况下需要将onStartShouldSetPanResponderCapture设为false
				if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
					return true;
				}
				// if (Math.abs(gestureState.dx) <= 5 || Math.abs(gestureState.dy) <= 5) {
				// 	return false;
				// }
				return false;
			},
			// 开始手势操作
			onPanResponderGrant: () => {
				// @ts-ignore
				this.state.pan.setOffset({ x: this.state.pan.x._value, y: this.state.pan.y._value });
			},
			// 用户开始移动
			onPanResponderMove: (_, g) => {
				const { insets } = this.props;
				const screen = Dimensions.get('window');
				let left = this.startX + g.dx; // 距离左侧距离
				let bottom = this.startY - g.dy; // 距离底部距离

				// 边界处理
				if (left <= 0) {
					left = 0;
				}
				if (left >= screen.width - this.boxWidth) {
					left = screen.width - this.boxWidth;
				}
				if (bottom <= insets.bottom) {
					bottom = insets.bottom;
				}
				const insetsTop = isAndroid ? insets.top + 30 : insets.top;
				if (bottom >= screen.height - insetsTop - this.boxHeight) {
					bottom = screen.height - insetsTop - this.boxHeight;
				}

				this.setState({
					left,
					bottom
				});
			},
			// 用户放开了所有的触摸点
			onPanResponderRelease: () => {
				const screen = Dimensions.get('window');
				this.startX = this.state.left > screen.width / 2 ? screen.width - this.boxWidth : 0;
				this.startY = this.state.bottom;
				this.state.pan.flattenOffset();
				this.setState({ left: this.startX });
				this.setCollapseTimer();
			}
		});

	handlePress = (): void => {
		const { expand } = this.state;
		if (expand) {
			this.setState({ modalVisible: true });
		} else {
			this.toggleIcon();
		}
	};

	closeModal = (): void => {
		this.setState({ modalVisible: false });
	};

	toggleIcon = (): void => {
		const { expand, left } = this.state;
		const screen = Dimensions.get('window');
		this.boxWidth = expand ? 20 : 52;
		this.setState({ expand: !expand, left: left > 100 ? screen.width - this.boxWidth : left }, this.setCollapseTimer);
	};

	setCollapseTimer = (): void => {
		if (this.timer) {
			clearTimeout(this.timer);
		}

		const { expand } = this.state;
		if (expand) {
			this.timer = setTimeout(this.toggleIcon, 5000);
		}
	};

	render(): React.ReactElement | null {
		const { user, insets } = this.props;
		const { pan, panResponder, modalVisible, expand, left, bottom } = this.state;
		if (!user?.username) {
			return null;
		}
		const collapseIcon = left === 0 ? <LeftCollapseIcon /> : <CollapseIcon />;
		return (
			<>
				<Animated.View
					style={[
						styles.btnFeedback,
						{
							left: left === 0 ? insets.left : left - insets.right,
							bottom,
							transform: [{ translateX: pan.x }, { translateY: pan.y }]
						}
					]}
					{...panResponder?.panHandlers}
				>
					<TouchableOpacity onPress={() => this.handlePress()}>{expand ? <FeedbackIcon /> : collapseIcon}</TouchableOpacity>
				</Animated.View>
				<Modal animationType='slide' transparent={true} visible={modalVisible}>
					<Feedback closeModal={this.closeModal} />
				</Modal>
			</>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withSafeAreaInsets(Draggle));
