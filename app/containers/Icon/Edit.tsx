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

const EditIcon: React.FC<IProps> = ({ width = 24, height = 24, color = 'black', opacity = 0.26, style }) => (
	<Svg width={width} height={height} viewBox='0 0 20 20' style={style} fill='none'>
		<Path d='M15.3847 4.77103L19.1739 8.30759L20 7.53656L16.2108 4L15.3847 4.77103Z' fill={color} fillOpacity={opacity} />
		<Path
			d='M5.41942 17.9935L9.64041 17.2056L18.1661 9.24829L14.3769 5.71172L5.8512 13.669L5.007 17.6085C4.95795 17.8374 5.17418 18.0392 5.41942 17.9935ZM14.3769 7.25377L16.5139 9.24829L9.06443 16.2011L6.39318 16.6997L6.92743 14.2066L14.3769 7.25377Z'
			fill={color}
			fillOpacity={opacity}
		/>
	</Svg>
);

export default EditIcon;
