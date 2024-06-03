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

const SettingIcon: React.FC<IProps> = ({ width = 16, height = 16, color = 'black', opacity = 0.4, style }) => (
	<Svg width={width} height={height} viewBox='0 0 20 20' style={style} fill='none'>
		<Path
			d='M13.7501 10C13.7501 12.0711 12.0712 13.75 10.0001 13.75C7.92902 13.75 6.25009 12.0711 6.25009 10C6.25009 7.92893 7.92902 6.25 10.0001 6.25C12.0712 6.25 13.7501 7.92893 13.7501 10ZM12.5001 10C12.5001 8.61929 11.3808 7.5 10.0001 7.5C8.61937 7.5 7.50009 8.61929 7.50009 10C7.50009 11.3807 8.61937 12.5 10.0001 12.5C11.3808 12.5 12.5001 11.3807 12.5001 10Z'
			fill={color}
			fillOpacity={opacity}
		/>
		<Path
			d='M10.0001 1.5625L17.5778 5.78125V14.2188L10.0001 18.4375L2.42236 14.2188V5.78125L10.0001 1.5625ZM3.67236 6.516V13.484L10.0001 17.0068L16.3278 13.484V6.516L10.0001 2.99316L3.67236 6.516Z'
			fill={color}
			fillOpacity={opacity}
		/>
	</Svg>
);

export default SettingIcon;
