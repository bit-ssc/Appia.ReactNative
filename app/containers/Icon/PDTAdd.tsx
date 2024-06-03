import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const PDTAddIcon: React.FC = () => (
	<Svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
		<Rect width='24' height='24' rx='4' fill='#F3F3F3' />
		<Path
			d='M11.025 12.975V18.75H12.975V12.975H18.75V11.025H12.975V5.25H11.025V11.025H5.25V12.975H11.025Z'
			fill='black'
			fillOpacity='0.4'
		/>
	</Svg>
);

export default PDTAddIcon;
