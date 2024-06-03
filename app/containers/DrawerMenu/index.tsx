import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Animated, Dimensions, Modal, View, StyleProp, ViewStyle, TouchableWithoutFeedback, Text } from 'react-native';

import { styles } from './styles';

const WINDOW = Dimensions.get('window');

export type DrawerMenuProps = {
	visible: boolean;
	duration?: number;
	menuPosition?: 'left' | 'right' | 'top' | 'bottom';
	Height?: number | string;
	hideModal: Function;
	children?: JSX.Element;
	isCircle?: boolean;
	CircleNum?: number;
	isShadowHideModal?: boolean;
	title?: string;
};

/**
 * 抽屉组件Api
 * @param  visible 是否显示抽屉
 * @param  Height 抽屉高度，默认50%
 * @param  hideModal  关闭抽屉函数
 * @param  duration 抽屉展示动画时间 默认300
 * @param  isCircle 是否圆角 默认true
 * @param  menuPosition 抽屉打开位置 默认bottom "left" | "right" | "top" | "bottom";
 * @param  children 插入元素
 * @param  CircleNum 圆角数值 默认20
 * @param isShadowHideModal 是否点击阴影关闭弹窗
 * @param title 文本头部标题
 */

export const DrawerMenu = ({
	visible,
	Height,
	hideModal,
	duration,
	isCircle,
	menuPosition,
	children,
	CircleNum,
	isShadowHideModal,
	title
}: DrawerMenuProps) => {
	const [menuPositionStyle, setMenuPositionStyle] = useState<StyleProp<ViewStyle>>();
	const [drawerMenuBox, setDrawerMenuBox] = useState<StyleProp<ViewStyle>>();
	const DrawerAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		isOpen(Number(visible));
		switch (menuPosition) {
			case 'left':
				setMenuPositionStyle({
					flex: 1,
					backgroundColor: '#fff',
					borderTopRightRadius: isCircle ? CircleNum : 0,
					borderBottomRightRadius: isCircle ? CircleNum : 0
				});
				setDrawerMenuBox({
					width: Height,
					height: WINDOW.height,
					position: 'absolute',
					left: 0,
					top: 0
				});
				break;
			case 'right':
				setMenuPositionStyle({
					flex: 1,
					backgroundColor: '#fff',
					borderTopLeftRadius: isCircle ? CircleNum : 0,
					borderBottomLeftRadius: isCircle ? CircleNum : 0
				});
				setDrawerMenuBox({
					width: Height,
					height: WINDOW.height,
					position: 'absolute',
					right: 0,
					top: 0
				});
				break;
			case 'top':
				setMenuPositionStyle({
					flex: 1,
					backgroundColor: '#fff',
					borderBottomLeftRadius: isCircle ? CircleNum : 0,
					borderBottomRightRadius: isCircle ? CircleNum : 0
				});
				setDrawerMenuBox({
					width: WINDOW.width,
					height: Height,
					position: 'absolute',
					right: 0,
					top: 0
				});
				break;
			case 'bottom':
				setMenuPositionStyle({
					flex: 1,
					backgroundColor: '#fff',
					borderTopLeftRadius: isCircle ? CircleNum : 0,
					borderTopRightRadius: isCircle ? CircleNum : 0
				});
				setDrawerMenuBox({
					width: WINDOW.width,
					height: Height,
					position: 'absolute',
					right: 0,
					bottom: 0
				});
				break;
		}
	}, [visible]);

	const isOpen = (toValue: number) => {
		Animated.timing(DrawerAnim, {
			toValue,
			duration,
			useNativeDriver: true
		}).start();
	};

	const handleHideModal = () => {
		setTimeout(() => {
			hideModal();
		}, 200);
		isOpen(0);
	};

	// 判断position从不同位置唤出抽屉
	const getPosition = useCallback(() => {
		switch (menuPosition) {
			case 'left':
				return {
					translateX: DrawerAnim.interpolate({
						inputRange: [0, 1],
						outputRange: [-WINDOW.width, 0]
					})
				};
			case 'right':
				return {
					translateX: DrawerAnim.interpolate({
						inputRange: [0, 1],
						outputRange: [WINDOW.width, 0]
					})
				};
			case 'top':
				return {
					translateY: DrawerAnim.interpolate({
						inputRange: [0, 1],
						outputRange: [-WINDOW.height, 0]
					})
				};
			case 'bottom':
				return {
					translateY: DrawerAnim.interpolate({
						inputRange: [0, 1],
						outputRange: [WINDOW.height, 0]
					})
				};
			default:
				return {
					translateX: DrawerAnim.interpolate({
						inputRange: [0, 1],
						outputRange: [-WINDOW.width, 0]
					})
				};
		}
	}, [DrawerAnim, menuPosition]);

	return (
		<Modal visible={visible} transparent animationType={'fade'}>
			<TouchableWithoutFeedback onPress={() => isShadowHideModal && handleHideModal()}>
				<View
					style={{
						backgroundColor: 'rgba(0, 0, 0, .5)',
						height: '100%',
						width: '100%',
						position: 'absolute',
						top: 0,
						left: 0
					}}
				></View>
			</TouchableWithoutFeedback>
			<View style={drawerMenuBox}>
				<Animated.View
					style={[
						styles.container,
						{
							transform: [getPosition()],
							opacity: DrawerAnim
						}
					]}
				>
					<View style={menuPositionStyle}>
						{
							// 底部不需要ios刘海适配
							menuPosition !== 'bottom' && <View style={styles.iosTop} />
						}
						{title ? (
							<View style={styles.headTitle}>
								<Text style={styles.title}>{title}</Text>
							</View>
						) : null}

						{children}
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
};

DrawerMenu.defaultProps = {
	visible: false,
	duration: 200,
	menuPosition: 'bottom',
	isCircle: true,
	CircleNum: 20,
	isShadowHideModal: true,
	title: ''
};
