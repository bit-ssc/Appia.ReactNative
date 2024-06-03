import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
}

const ChatIcon: React.FC<IProps> = ({ width = 21, height = 20, color = '#333333' }) => (
	<Svg width={width} height={height} viewBox='0 0 20 20' fill='none'>
		<Path
			d='M18.3333 2.5H1.66666V15H5.41666V17.0833L9.58332 15H18.3333V2.5Z'
			fill={color}
			stroke={color}
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<Path d='M5.83334 8.125V9.375' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
		<Path d='M10 8.125V9.375' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
		<Path d='M14.1667 8.125V9.375' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
	</Svg>
);

export default ChatIcon;
