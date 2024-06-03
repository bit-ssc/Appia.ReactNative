// import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
// import {
//     Alert,
//     Animated,
//     PanResponder,
//     StyleSheet,
//     Text, StatusBar,
//     TouchableHighlight,
//     TouchableWithoutFeedback,
//     View,
//     Modal
// } from "react-native";
// import { themes } from '../../lib/constants';
// import { useTheme } from '../../theme';

// import PopoversItem from "./components/PopoversItem";
// import Model from "./components/model";
// import { connect } from "react-redux";
// import { Dimensions } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useHeaderHeight } from '@react-navigation/elements';

// // 获取屏幕的宽度和高度
// const { width, height: dimensionsHeight } = Dimensions.get('window');

// // 60
// // 653.0000114440918
// // 276.3333435058594
// // 101.99998474121094 6
// // 在左边： 58.16667175292969
// // 551.0000267028809
// // 在上边：
// // 411.00002670288086

// const Popovers = React.memo(forwardRef(({ name, list, modelShow, closeModel, openModel }, ref) => {
//     const [modalVisible, setModalVisible] = useState(false);
//     const [{ left, top, pointer }, setCoordinate] = useState({ left: 0, top: 0, pointer: 0 });
//     const [options, setOptions] = useState([]);
//     const insets = useSafeAreaInsets();
//     const headerHeight = useHeaderHeight();

//     // 控制遮罩层的透明度
//     const [modalOpacity, setModalOpacity] = useState(1);

//     const { theme } = useTheme();

//     useImperativeHandle(ref, () => {
//         return {
//             showModel({ options, measureInWindow }) {
//                 // 传入 model的数据1. 是否显示 2.有哪些操作  3.位置与距离
//                 openModel()
//                 console.info("measureInWindow", headerHeight)
//                 measureInWindow((x, y, width, height) => {
//                     console.info(x, y, width, height, options.length,
//                         "在左边：", (x + width / 2) - 140, y - height, "在上边：", y - height - 140
//                     )

//                     let left = (x + width / 2) - 140 <= 0 ? 20 : (x + width / 2) - 140
//                     setCoordinate({ left: left, top: y - 140 - headerHeight, pointer: x - 30 + width / 2 })

//                 })

//                 setOptions(options)
//             },
//             closeModel() {
//                 setModalVisible(false)
//             },
//         };
//     }, []);

//     useEffect(() => { }, [modalVisible])

//     const handlePressIn = () => {
//         // 只是使模态框透明，但不改变其可见性状态
//         setModalOpacity(0);
//     };

//     const handlePressOut = () => {
//         // 使模态框重新可见
//         setModalOpacity(1);
//     };

//     return (
//         <>
//             <Model modalVisible={modelShow} >
//                 <View
//                     style={[styles.modalView, {
//                         backgroundColor: themes[theme].focusedBackground,
//                         left: left, top: top
//                     }]}>
//                     <View style={[styles.triangleModel]} >
//                         <View style={[styles.centeredView]}>
//                             {options.map((item, index) => {
//                                 return <PopoversItem key={index} hide={setModalVisible} item={item} ></PopoversItem>
//                             })}
//                         </View>
//                     </View>
//                     <View style={[styles.triangle, left === 20 ? { left: pointer } : {}, {
//                         borderTopColor: themes[theme].focusedBackground,
//                     }
//                     ]} />
//                 </View>
//             </Model >
//         </>
//     );
// }))

// const styles = StyleSheet.create({
//     centeredView: {

//         width: 270,
//         height: 140,
//         flexDirection: 'row',
//         flexWrap: "wrap",
//         justifyContent: "flex-start",
//         alignItems: "center",
//     },
//     modalView: {
//         width: 280,
//         position: "absolute",

//         flexDirection: 'row',
//         justifyContent: "center",
//         alignItems: "center",
//         borderRadius: 15,
//         shadowColor: "#000",
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 3.84,
//         elevation: 5
//     },

//     triangleModel: {
//         width: "100%",
//         height: "100%",
//         position: "relative",

//     },

//     openButton: {
//         backgroundColor: "#F194FF",
//         borderRadius: 20,
//         padding: 10,
//         elevation: 2
//     },
//     textStyle: {
//         color: "white",
//         fontWeight: "bold",
//         textAlign: "center"
//     },
//     modalText: {
//         marginBottom: 15,
//         textAlign: "center"
//     },

//     // 小三角样式

//     triangle: {
//         width: 0,
//         height: 0,
//         position: "absolute",
//         bottom: -10,

//         backgroundColor: 'transparent',
//         borderStyle: 'solid',
//         borderLeftWidth: 10,
//         borderRightWidth: 10,
//         borderTopWidth: 20,
//         borderLeftColor: 'transparent',
//         borderRightColor: 'transparent',
//         borderTopColor: 'rgba(60, 60, 60, 0.9)',
//         // 调整三角形的位置
//         transform: [{ translateY: -1 }],
//     },

//     // 遮罩层
//     modalOverlay: {
//         position: 'absolute',
//         top: 0,
//         bottom: 0,
//         left: 0,
//         right: 0,
//         pointerEvents: "none",
//         backgroundColor: 'rgba(0,0,0,0.5)',
//     },
// });

// const mapStateToProps = state => ({
//     modelShow: state.model.modelShow,
// });

// const mapDispatchToProps = dispatch => ({
//     closeModel: () => dispatch({ type: "MODEL_CLOSE_MODEL" }),
//     openModel: () => dispatch({ type: "MODEL_OPEN_MODEL" }),
// });

// export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Popovers);
