import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
}

const MoreIcon: React.FC<IProps> = ({ width = 40, height = 40, color = '#999999' }) => (
	<Svg width={width} height={height} viewBox='0 0 40 40' fill='none'>
		<Path
			d='M7.5 22.501C6.11938 22.501 5 21.3817 5 20.001C5 18.6203 6.11938 17.501 7.5 17.501C8.88061 17.501 10 18.6203 10 20.001C10 21.3817 8.88061 22.501 7.5 22.501Z'
			fill={color}
		/>
		<Path
			d='M17.5 20.001C17.5 21.3817 18.6194 22.501 20 22.501C21.3806 22.501 22.5 21.3817 22.5 20.001C22.5 18.6203 21.3806 17.501 20 17.501C18.6194 17.501 17.5 18.6203 17.5 20.001Z'
			fill={color}
		/>
		<Path
			d='M30 20.001C30 21.3817 31.1194 22.501 32.5 22.501C33.8806 22.501 35 21.3817 35 20.001C35 18.6203 33.8806 17.501 32.5 17.501C31.1194 17.501 30 18.6203 30 20.001Z'
			fill={color}
		/>
	</Svg>
);

export default MoreIcon;
