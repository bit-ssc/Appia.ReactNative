import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface Props {
	width?: string;
	height?: string;
	color?: string;
	style?: ViewStyle | ViewStyle[];
}

const RobotIcon: React.FC<Props> = ({ width = '24', height = '24', color = '#2878FF', style = {} }) => (
	<Svg width={width} height={height} style={style} viewBox='0 0 24 24' fill='none'>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M3.5 10C3.5 8.89543 4.39543 8 5.5 8H18.5C19.6046 8 20.5 8.89543 20.5 10V20C20.5 21.1046 19.6046 22 18.5 22H5.5C4.39543 22 3.5 21.1046 3.5 20V10ZM18.5 10H5.5V20H18.5V10Z'
			fill={color}
		/>
		<Path
			d='M8.5 14C9.05228 14 9.5 13.5523 9.5 13C9.5 12.4477 9.05228 12 8.5 12C7.94772 12 7.5 12.4477 7.5 13C7.5 13.5523 7.94772 14 8.5 14Z'
			fill={color}
		/>
		<Path
			d='M15.5 14C16.0523 14 16.5 13.5523 16.5 13C16.5 12.4477 16.0523 12 15.5 12C14.9477 12 14.5 12.4477 14.5 13C14.5 13.5523 14.9477 14 15.5 14Z'
			fill={color}
		/>
		<Path
			d='M10 16C9.4477 16 9 16.4477 9 17C9 17.5523 9.4477 18 10 18V16ZM14 18C14.5523 18 15 17.5523 15 17C15 16.4477 14.5523 16 14 16V18ZM10 18H14V16H10V18Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M12 4C12.5523 4 13 4.44772 13 5V9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9V5C11 4.44772 11.4477 4 12 4Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M2 12C2.55228 12 3 12.4477 3 13V17C3 17.5523 2.55228 18 2 18C1.44772 18 1 17.5523 1 17V13C1 12.4477 1.44772 12 2 12Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M22 12C22.5523 12 23 12.4477 23 13V17C23 17.5523 22.5523 18 22 18C21.4477 18 21 17.5523 21 17V13C21 12.4477 21.4477 12 22 12Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M10 4C10 2.89543 10.8954 2 12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C10.8954 6 10 5.10457 10 4Z'
			fill={color}
		/>
	</Svg>
);

export default RobotIcon;
