import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const MembersDeleteIcon: React.FC = () => (
	<Svg width='40' height='40' viewBox='0 0 40 40' fill='none'>
		<Path d='M11.5 21V19H28.5V21H11.5Z' fill='#CCCCCC' />
		<Rect x='2.75' y='2.75' width='34.5' height='34.5' rx='1.25' stroke='#CCCCCC' stroke-width='1.5' stroke-dasharray='4 4' />
	</Svg>
);

export default MembersDeleteIcon;
