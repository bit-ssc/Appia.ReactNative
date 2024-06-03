import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	style?: ViewStyle[] | ViewStyle;
}

const ListIcon: React.FC<IProps> = ({ width = 24, height = 24, color = 'rgba(0, 0, 0, 0.9)', style }) => (
	<Svg width={width} height={height} viewBox='0 0 24 24' fill='none' style={style}>
		<Path d='M21 6.75H3V5.25H21V6.75Z' fill={color} />
		<Path d='M21 12.75H3V11.25H21V12.75Z' fill={color} />
		<Path d='M3 18.75H21V17.25H3V18.75Z' fill={color} />
	</Svg>
);

export default ListIcon;
