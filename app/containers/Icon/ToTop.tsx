import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	opacity?: number;
	style?: ViewStyle[] | ViewStyle;
}

const ToTop: React.FC<IProps> = ({ width = 16, height = 16, style = {} }) => (
	<Svg width={width} height={height} viewBox='0 0 14 14' fill='none' style={style}>
		<Path
			d='M11.5405 13.0403L12.4597 12.1211L8.0001 7.66148L3.54048 12.1211L4.45972 13.0403L8.0001 9.49996L11.5405 13.0403ZM11.5405 8.04041L12.4597 7.12117L8.0001 2.66155L3.54048 7.12117L4.45972 8.04041L8.0001 4.50002L11.5405 8.04041Z'
			fill='#4E5969'
			fillOpacity='0.9'
		/>
	</Svg>
);

export default ToTop;
