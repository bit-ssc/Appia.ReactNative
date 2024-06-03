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

const DeleteFileIcon: React.FC<IProps> = ({ width = 48, height = 48 }) => (
	<Svg width={width} height={height} viewBox='0 0 48 48' fill='none'>
		<Path d='M18 36V18H21V36H18Z' fill='black' fill-opacity='0.9' />
		<Path d='M27 18V36H30V18H27Z' fill='black' fill-opacity='0.9' />
		<Path
			d='M31.5 9H42V12H39V42C39 43.6569 37.6569 45 36 45H12C10.3431 45 9 43.6569 9 42V12H6V9H16.5L16.5 5.4C16.5 4.07452 17.5745 3 18.9 3H29.1C30.4255 3 31.5 4.07452 31.5 5.4V9ZM19.5 9H28.5L28.5 6L19.5 6V9ZM12 12V42H36V12H12Z'
			fill='black'
			fill-opacity='0.9'
		/>
	</Svg>
);

export default DeleteFileIcon;
