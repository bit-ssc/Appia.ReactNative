import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	style?: ViewStyle[] | ViewStyle;
}

const ArrowIcon: React.FC<IProps> = ({ width = 18, height = 18, color = 'rgba(0, 0, 0, 0.4)', style }) => (
	<Svg width={width} height={height} viewBox='0 0 16 16' fill='none' style={style}>
		<Path
			d='M3.54028 6.45964L4.45952 5.54041L7.9999 9.08079L11.5403 5.54041L12.4595 6.45964L7.9999 10.9193L3.54028 6.45964Z'
			fill={color}
		/>
	</Svg>
);

export const TopArrowIcon: React.FC<IProps> = ({ width = 18, height = 18, color = 'rgba(0, 0, 0, 0.4)', style }) => (
	<Svg width={width} height={height} viewBox='0 0 16 16' fill='none' style={style}>
		<Path
			d='M12.4595 9.54074L11.5403 10.46L7.9999 6.91959L4.45952 10.46L3.54028 9.54073L7.9999 5.08112L12.4595 9.54074Z'
			fill={color}
		/>
	</Svg>
);

export default ArrowIcon;
