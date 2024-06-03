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

const QRCodeIcon: React.FC<IProps> = ({ width = 24, height = 24, color = 'black', opacity = 0.6, style }) => (
	<Svg width={width} height={height} viewBox='0 0 20 20' style={style} fill='none'>
		<Path d='M7.5 5H5V7.5H7.5V5Z' fill={color} fillOpacity={opacity} />
		<Path
			d='M3.125 2.5C2.77982 2.5 2.5 2.77982 2.5 3.125V9.375C2.5 9.72018 2.77982 10 3.125 10H9.375C9.72018 10 10 9.72018 10 9.375V3.125C10 2.77982 9.72018 2.5 9.375 2.5H3.125ZM3.75 3.75H8.75V8.75H3.75V3.75Z'
			fill={color}
			fillOpacity={opacity}
		/>
		<Path
			d='M13.125 2.5C12.7798 2.5 12.5 2.77982 12.5 3.125V6.875C12.5 7.22018 12.7798 7.5 13.125 7.5H16.875C17.2202 7.5 17.5 7.22018 17.5 6.875V3.125C17.5 2.77982 17.2202 2.5 16.875 2.5H13.125ZM13.75 6.25V3.75H16.25V6.25H13.75Z'
			fill={color}
			fillOpacity={opacity}
		/>
		<Path
			d='M12.5 13.125C12.5 12.7798 12.7798 12.5 13.125 12.5H16.875C17.2202 12.5 17.5 12.7798 17.5 13.125V16.875C17.5 17.2202 17.2202 17.5 16.875 17.5H13.125C12.7798 17.5 12.5 17.2202 12.5 16.875V13.125ZM13.75 16.25H16.25V13.75H13.75V16.25Z'
			fill={color}
			fillOpacity={opacity}
		/>
		<Path
			d='M3.125 12.5C2.77982 12.5 2.5 12.7798 2.5 13.125V16.875C2.5 17.2202 2.77982 17.5 3.125 17.5H6.875C7.22018 17.5 7.5 17.2202 7.5 16.875V13.125C7.5 12.7798 7.22018 12.5 6.875 12.5H3.125ZM3.75 13.75H6.25V16.25H3.75V13.75Z'
			fill={color}
			fillOpacity={opacity}
		/>
		<Path d='M17.5 9.375L12.5 9.375V10.625L17.5 10.625V9.375Z' fill={color} fillOpacity={opacity} />
		<Path d='M10.625 13.75V17.5H9.375V13.75H10.625Z' fill={color} fillOpacity={opacity} />
		<Path d='M10.625 12.5V11.25H9.375V12.5H10.625Z' fill={color} fillOpacity={opacity} />
	</Svg>
);

export default QRCodeIcon;
