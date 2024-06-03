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

const ErrorCircleIcon: React.FC<IProps> = ({ width = 24, height = 24 }) => (
	<Svg width={width} height={height} viewBox='0 0 48 48' fill='none'>
		<Path d='M25.5 12.0011V28.5H22.5V12.0011H25.5Z' fill='black' fill-opacity='0.9' />
		<Path d='M25.7827 31.5H22.1829V35.0999H25.7827V31.5Z' fill='black' fill-opacity='0.9' />
		<Path
			d='M45 24C45 12.4021 35.5979 3 24 3C12.4021 3 3 12.4021 3 24C3 35.5979 12.4021 45 24 45C35.5979 45 45 35.5979 45 24ZM42 24C42 33.9412 33.9412 42 24 42C14.0588 42 6 33.9412 6 24C6 14.0588 14.0588 6 24 6C33.9412 6 42 14.0588 42 24Z'
			fill='black'
			fill-opacity='0.9'
		/>
	</Svg>
);

export default ErrorCircleIcon;
