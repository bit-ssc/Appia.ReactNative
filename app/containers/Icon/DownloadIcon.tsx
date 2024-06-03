import { ViewStyle } from 'react-native';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	opacity?: number;
	style?: ViewStyle[] | ViewStyle;
}

const DownloadIcon: React.FC<IProps> = ({ width = 48, height = 48 }) => (
	<Svg width={width} height={height} viewBox='0 0 48 48' fill='none'>
		<Path
			d='M15.4394 25.8106C14.8536 25.2249 14.8536 24.2751 15.4394 23.6894C16.0251 23.1036 16.9749 23.1036 17.5606 23.6894L22.5 28.6287V9C22.5 8.17158 23.1716 7.5 24 7.5C24.8284 7.5 25.5 8.17158 25.5 9V28.6287L30.4394 23.6894C31.0251 23.1036 31.9749 23.1036 32.5606 23.6894C33.1464 24.2751 33.1464 25.2249 32.5606 25.8106L25.0606 33.3106C24.4749 33.8964 23.5251 33.8964 22.9394 33.3106L15.4394 25.8106ZM5.25 40.5V16.5C5.25 15.6715 5.92158 15 6.75 15H11.25C12.0784 15 12.75 15.6715 12.75 16.5C12.75 17.3285 12.0784 18 11.25 18H8.25V39H41.25V18H38.25C37.4216 18 36.75 17.3285 36.75 16.5C36.75 15.6715 37.4216 15 38.25 15H42.75C43.5784 15 44.25 15.6715 44.25 16.5V40.5C44.25 41.3284 43.5784 42 42.75 42H6.75C5.92158 42 5.25 41.3284 5.25 40.5Z'
			fill='black'
			fill-opacity='0.9'
		/>
	</Svg>
);

export default DownloadIcon;
