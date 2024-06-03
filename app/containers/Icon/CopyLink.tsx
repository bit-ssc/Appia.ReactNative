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

const CopyLinkIcon: React.FC<IProps> = ({ width = 48, height = 48 }) => (
	<Svg width={width} height={height} viewBox='0 0 48 48' fill='none'>
		<Path
			d='M18.6966 35.6672L25.0606 29.3032L27.1819 31.4246L20.818 37.7885C17.889 40.7174 13.1403 40.7174 10.2113 37.7885C7.28242 34.8596 7.28242 30.1108 10.2113 27.1819L16.5753 20.818L18.6966 22.9393L12.3327 29.3032C10.5753 31.0606 10.5753 33.9098 12.3327 35.6672C14.09 37.4246 16.9393 37.4246 18.6966 35.6672Z'
			fill='black'
			fill-opacity='0.9'
		/>
		<Path
			d='M31.4246 27.1819L29.3032 25.0606L35.6672 18.6966C37.4246 16.9393 37.4246 14.09 35.6672 12.3327C33.9098 10.5753 31.0606 10.5753 29.3032 12.3327L22.9393 18.6966L20.8179 16.5753L27.1819 10.2113C30.1108 7.28242 34.8596 7.28242 37.7885 10.2113C40.7174 13.1403 40.7174 17.889 37.7885 20.818L31.4246 27.1819Z'
			fill='black'
			fill-opacity='0.9'
		/>
		<Path d='M27.1824 18.6967L18.6971 27.182L20.8184 29.3033L29.3037 20.818L27.1824 18.6967Z' fill='black' fill-opacity='0.9' />
	</Svg>
);

export default CopyLinkIcon;
