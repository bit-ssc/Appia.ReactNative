import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	style?: ViewStyle[] | ViewStyle;
}

const AddIcon: React.FC<IProps> = ({ width = 18, height = 18, color = 'white', style }) => (
	<Svg width={width} height={height} viewBox='0 0 20 20' fill='none' style={style}>
		<Rect x='0.90918' y='8.18164' width='18.1818' height='3.63636' rx='1.81818' fill={color} />
		<Rect
			x='8.18164'
			y='19.0903'
			width='18.1818'
			height='3.63636'
			rx='1.81818'
			transform='rotate(-90 8.18164 19.0903)'
			fill={color}
		/>
	</Svg>
);

export const AddIcon1: React.FC<IProps> = ({ width = 34, height = 34, color = '#D9D9D9', style }) => (
	<Svg width={width} height={height} viewBox='0 0 34 34' fill='none' style={style}>
		<Rect x='0.607178' y='16.0891' width='32.7857' height='2.73214' fill={color} />
		<Rect x='16.0894' y='33.3931' width='32.7857' height='2.73214' transform='rotate(-90 16.0894 33.3931)' fill={color} />
	</Svg>
);

export default AddIcon;
