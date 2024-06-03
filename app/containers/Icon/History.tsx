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

const HistoryIcon: React.FC<IProps> = () => (
	<Svg width='48' height='48' viewBox='0 0 48 48' fill='none'>
		<Path
			d='M23.7175 8.37993C32.5496 8.37993 39.6284 15.4199 39.6284 24.0049C39.6284 32.5899 32.5496 39.6298 23.7174 39.6298C16.3328 39.6298 10.1738 34.7083 8.35342 28.0772L5.25293 28.5831C7.3273 36.7255 14.8075 42.7549 23.7174 42.7549C34.2308 42.7549 42.7535 34.3602 42.7535 24.0049C42.7535 13.6495 34.2308 5.25488 23.7175 5.25488C17.4187 5.25488 11.8344 8.26816 8.36942 12.911L8.36942 7.93434H5.25293V17.3738C5.25293 18.2022 5.9245 18.8738 6.75293 18.8738L16.1328 18.8738V15.7402H10.2136C13.0169 11.3303 17.9998 8.37993 23.7175 8.37993Z'
			fill='black'
			fill-opacity='0.9'
		/>
		<Path
			d='M20.9985 16.4998V25.1665L28.9379 33.1059L31.0592 30.9845L23.9985 23.9239V16.4998H20.9985Z'
			fill='black'
			fill-opacity='0.9'
		/>
	</Svg>
);

export default HistoryIcon;
