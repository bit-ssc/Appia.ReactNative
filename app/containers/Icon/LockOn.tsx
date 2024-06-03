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

const LockOnIcon: React.FC<IProps> = ({ width = 48, height = 48 }) => (
	<Svg width={width} height={height} viewBox='0 0 48 48' fill='none'>
		<Path d='M18 30.0001V33.0001H30V30.0001H18Z' fill='black' fill-opacity='0.9' />
		<Path
			d='M13.5 14.9727V18.0001H9C8.17157 18.0001 7.5 18.6716 7.5 19.5001V40.5001C7.5 41.3285 8.17157 42.0001 9 42.0001H39C39.8284 42.0001 40.5 41.3285 40.5 40.5001V19.5001C40.5 18.6716 39.8284 18.0001 39 18.0001H34.5V14.9727C34.5 9.17367 29.799 4.47266 24 4.47266C18.201 4.47266 13.5 9.17367 13.5 14.9727ZM31.5 18.0001H16.5V14.9727C16.5 10.8305 19.8579 7.47266 24 7.47266C28.1421 7.47266 31.5 10.8305 31.5 14.9727V18.0001ZM10.5 21.0001H37.5V39.0001H10.5V21.0001Z'
			fill='black'
			fill-opacity='0.9'
		/>
	</Svg>
);

export default LockOnIcon;
