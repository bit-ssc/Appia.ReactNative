import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	style?: ViewStyle[] | ViewStyle;
}

const CalendarIcon: React.FC<IProps> = ({ width = 21, height = 20, color = '#2878FF', style }) => (
	<Svg width={width} height={height} style={style} viewBox='0 0 21 20' fill='none'>
		<Path
			d='M13 3.75H8L8 1.875H6.75L6.75 3.75H4.25C3.55964 3.75 3 4.30964 3 5V16.25C3 16.9404 3.55964 17.5 4.25 17.5H16.75C17.4404 17.5 18 16.9404 18 16.25V5C18 4.30964 17.4404 3.75 16.75 3.75H14.25V1.875H13V3.75ZM6.75 6.25L8 6.25L8 5H13L13 6.25L14.25 6.25V5H16.75V7.5H4.25V5H6.75L6.75 6.25ZM4.25 8.75H16.75V16.25H4.25L4.25 8.75Z'
			fill={color}
		/>
	</Svg>
);

export default CalendarIcon;
