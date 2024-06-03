// import React, { useCallback, Dispatch, RefObject } from 'react';
// import { Dimensions, ScrollView } from 'react-native';

// const { width: DimensionsWidth } = Dimensions.get('window');

// type UseToPageType = (
// 	selectNumber: Dispatch<React.SetStateAction<number>>,
// 	setIsScrollingFnc: Dispatch<React.SetStateAction<boolean>>,
// 	scrollViewRef: RefObject<ScrollView>
// ) => {
// 	toOnePage: (number: number) => void;
// };

// const UseToPage: UseToPageType = (selectNumber, setIsScrollingFnc, scrollViewRef) => {
// 	const toOnePage = useCallback((number: number) => {
// 		// 获取设备宽度 并且计算跳转位置
// 		// const childWidth = DimensionsWidth;
// 		// const x = number * childWidth;

// 		// console.log(number, 'number');
// 		// selectNumber(number);
// 		// // 设置false 代表 为手动跳转 并非滑动
// 		// setIsScrollingFnc(true);
// 		// // 通过实例跳转
// 		// scrollViewRef.current?.scrollTo({ x, animated: true });
// 		console.info();
// 		// scrollViewRef.current?.goToPage(number)

// 	}, []);

// 	return { toOnePage };
// };

// export default UseToPage;
