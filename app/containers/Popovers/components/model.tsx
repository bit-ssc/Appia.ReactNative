// import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
// import {
//     Alert,
//     Animated,
//     Modal,
//     PanResponder,
//     StyleSheet,
//     TouchableWithoutFeedback,
//     View
// } from "react-native";

// const Model = ({ children, modalVisible }) => {
//     const [fadeAnim] = useState(new Animated.Value(0)); // 初始透明度设置为0
//     const [animationFinished, setAnimationFinished] = useState(false);

//     useEffect(() => {
//         setAnimationFinished(false); // 开始动画
//         Animated.timing(fadeAnim, {
//             toValue: modalVisible ? 1 : 0,
//             duration: 300,
//             useNativeDriver: true,
//         }).start(() => {
//             setAnimationFinished(true); // 动画完成
//         });
//     }, [modalVisible, fadeAnim]);

//     return (
//         <>

//             {
//                 <Animated.View
//                     style={[
//                         styles.modalView,
//                         {
//                             // 将动画值绑定到透明度样式属性上
//                             opacity: fadeAnim,
//                             display: modalVisible || !animationFinished ? 'flex' : 'none',

//                         },
//                     ]}
//                 >

//                     {children}
//                 </Animated.View>
//             }
//         </>

//     );
// };

// export default Model;

// const styles = StyleSheet.create({

//     container: {
//         ...StyleSheet.absoluteFillObject,
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 1000, // 确保模态在其他内容之上
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//     },
//     modalContent: {
//         backgroundColor: 'white',
//         padding: 20,
//         borderRadius: 10,
//         elevation: 5,
//     },

//     centeredView: {

//         width: 270,
//         height: 140,
//         flexDirection: 'row',
//         flexWrap: "wrap",
//         justifyContent: "flex-start",
//         alignItems: "center",
//     },

//     triangleModel: {
//         width: "100%",
//         height: "100%",
//         position: "relative",

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
