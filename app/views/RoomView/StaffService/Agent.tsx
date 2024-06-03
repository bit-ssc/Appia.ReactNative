import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface Props {
	width?: string;
	height?: string;
	color?: string;
	style?: ViewStyle | ViewStyle[];
}

const AgentIcon: React.FC<Props> = ({ width = '24', height = '24', color = '#2878FF', style = {} }) => (
	<Svg width={width} height={height} style={style} viewBox='0 0 24 24' fill='none'>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M18 7C20.7614 7 23 9.23857 23 12C23 14.7614 20.7614 17 18 17V15C19.6569 15 21 13.6569 21 12C21 10.3431 19.6569 9 18 9V7Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M1 12C1 9.23856 3.23858 7 6 7V9C4.34314 9 3 10.3431 3 12C3 13.6569 4.34314 15 6 15V17C3.23858 17 1 14.7614 1 12Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M12 3C9.23858 3 7 5.23858 7 8V16C7 16.5523 6.55228 17 6 17C5.44772 17 5 16.5523 5 16V8C5 4.134 8.13402 1 12 1C15.866 1 19 4.134 19 8V16C19 19.866 15.866 23 12 23C11.4477 23 11 22.5523 11 22C11 21.4477 11.4477 21 12 21C14.7614 21 17 18.7614 17 16V8C17 5.23858 14.7614 3 12 3Z'
			fill={color}
		/>
	</Svg>
);

export default AgentIcon;
