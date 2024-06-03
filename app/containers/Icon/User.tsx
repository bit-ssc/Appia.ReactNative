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

const UserIcon: React.FC<IProps> = ({ width = 16, height = 16, color = 'black', opacity = 0.4, style }) => (
	<Svg width={width} height={height} viewBox='0 0 16 16' fill='none' style={style}>
		<Path
			d='M11.5 5C11.5 6.933 9.933 8.5 8 8.5C6.067 8.5 4.5 6.933 4.5 5C4.5 3.067 6.067 1.5 8 1.5C9.933 1.5 11.5 3.067 11.5 5ZM10.5 5C10.5 3.61929 9.38071 2.5 8 2.5C6.61929 2.5 5.5 3.61929 5.5 5C5.5 6.38071 6.61929 7.5 8 7.5C9.38071 7.5 10.5 6.38071 10.5 5Z'
			fill={color}
			fillOpacity={opacity}
		/>
		<Path
			d='M13.9631 10.8528C14.297 11.0122 14.5 11.3547 14.5 11.7246V14C14.5 14.2761 14.2761 14.5 14 14.5H2C1.72386 14.5 1.5 14.2761 1.5 14V11.7246C1.5 11.3547 1.70302 11.0122 2.03686 10.8528C3.8494 9.98708 5.86651 9.5 8 9.5C10.1335 9.5 12.1506 9.98708 13.9631 10.8528ZM8 10.5C6.0334 10.5 4.17435 10.9457 2.5 11.7398V13.5H13.5V11.7398C11.8257 10.9457 9.9666 10.5 8 10.5Z'
			fill={color}
			fillOpacity={opacity}
		/>
	</Svg>
);

export default UserIcon;
