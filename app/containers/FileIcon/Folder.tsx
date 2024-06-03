import React from 'react';
import Svg, { Path } from 'react-native-svg';

const FolderIcon = ({ fontSize = 40 }) => (
	<Svg width={fontSize} height={fontSize} viewBox='0 0 92 92' fill='none'>
		<Path
			d='M66.4681 26.0691H5.7688V21.0324C5.7688 15.7685 10.0364 11.5009 15.3003 11.5009H50.6233C54.5629 11.5009 58.2366 13.4874 60.3938 16.7846L66.4681 26.0691Z'
			fill='#FFBA53'
		/>
		<Path
			d='M86.267 35.6518V67.77C86.267 74.7832 80.5817 80.4676 73.5694 80.4676H18.4664C11.4532 80.4676 5.7688 74.7823 5.7688 67.77V22.9542H73.5685C80.5817 22.9542 86.267 28.6395 86.267 35.6518Z'
			fill='#FFDC53'
		/>
	</Svg>
);

export default FolderIcon;
