// import React from 'react';
// import { Text, View } from 'react-native';

// import { themes } from '../../../lib/constants';
// import { CustomIcon } from '../../CustomIcon';
// import { useTheme } from '../../../theme';
// import { TActionSheetOptionsItem } from '../types';
// import styles from '../styles';
// import Touch from '../../Touch';
// import { connect } from 'react-redux';

// export interface IActionSheetItem {
// 	item: TActionSheetOptionsItem;
// 	hide: any;
// }

// const PopoversItem = React.memo(({ item, closeModel }: IActionSheetItem) => {
// 	const { theme } = useTheme();
// 	const onPress = () => {
// 		closeModel()
// 		item?.onPress();
// 	};

// 	return (
// 		<Touch onPress={onPress} style={[styles.item, { backgroundColor: themes[theme].focusedBackground }]} testID={item.testID}>
// 			<View style={styles.iconItem}>

// 				{typeof item.icon === 'string' ? (
// 					<CustomIcon name={item.icon} size={20} color={item.danger ? themes[theme].dangerColor : themes[theme].bodyText} />
// 				) : (
// 					item.icon
// 				)}
// 			</View>
// 			<View style={styles.titleContainer}>
// 				<Text
// 					numberOfLines={1}
// 					style={[
// 						styles.title,
// 						{ color: item.danger ? themes[theme].dangerColor : themes[theme].bodyText }
// 					]}
// 				>
// 					{item.title}
// 				</Text>
// 			</View>
// 			{item.right ? <View style={styles.rightContainer}>{item.right ? item.right() : null}</View> : null}
// 		</Touch>
// 	);
// });

// const mapStateToProps = state => ({
// 	modelShow: state.model.modelShow,
// });

// const mapDispatchToProps = dispatch => ({
// 	closeModel: () => dispatch({ type: "MODEL_CLOSE_MODEL" }),
// 	openModel: () => dispatch({ type: "MODEL_OPEN_MODEL" }),
// });

// export default connect(mapStateToProps, mapDispatchToProps)(PopoversItem);
