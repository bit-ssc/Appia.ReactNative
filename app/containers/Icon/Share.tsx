import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	style?: ViewStyle[] | ViewStyle;
}

const ShareIcon: React.FC<IProps> = ({ width = 21, height = 20, color = '#A9A9A9', style }) => (
	<Svg width={width} height={height} viewBox='0 0 20 20' fill='none' style={style}>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M18.1497 5.82666C18.9718 5.0045 18.9718 3.67152 18.1497 2.84937L16.661 1.36072C16.2499 0.949643 15.5834 0.949643 15.1724 1.36072C14.7613 1.7718 14.7613 2.43829 15.1724 2.84937L16.661 4.33801L15.1724 5.82666C14.7613 6.23774 14.7613 6.90423 15.1724 7.3153C15.5834 7.72638 16.2499 7.72638 16.661 7.3153L18.1497 5.82666Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M14.2105 5.2631C12.1758 5.2631 10.5263 6.91258 10.5263 8.94731V12.6315C10.5263 13.2129 10.055 13.6842 9.47368 13.6842C8.89233 13.6842 8.42105 13.2129 8.42105 12.6315V8.94731C8.42105 5.74987 11.0131 3.15784 14.2105 3.15784H17.3684C17.9498 3.15784 18.4211 3.62912 18.4211 4.21047C18.4211 4.79182 17.9498 5.2631 17.3684 5.2631H14.2105Z'
			fill={color}
		/>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M10 2.10526C5.63986 2.10526 2.10526 5.63986 2.10526 10C2.10526 14.3601 5.63986 17.8947 10 17.8947C14.3601 17.8947 17.8947 14.3601 17.8947 10C17.8947 9.41865 18.366 8.94737 18.9474 8.94737C19.5287 8.94737 20 9.41865 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C10.5814 0 11.0526 0.471279 11.0526 1.05263C11.0526 1.63398 10.5814 2.10526 10 2.10526Z'
			fill={color}
		/>
	</Svg>
);

export default ShareIcon;
