import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	style?: ViewStyle[] | ViewStyle;
}

const DeleteIcon: React.FC<IProps> = ({ width = 20, height = 20, color = '#A9A9A9', style }) => (
	<Svg width={width} height={height} viewBox='0 0 13 13' fill='none' style={style}>
		<Path d='M2.33258 2.8501V11.9168H10.3326V2.8501H2.33258Z' stroke={color} strokeLinejoin='round' />
		<Path d='M5.26593 5.5166V8.98328' stroke={color} strokeLinecap='round' strokeLinejoin='round' />
		<Path d='M7.39929 5.5166V8.98328' stroke={color} strokeLinecap='round' strokeLinejoin='round' />
		<Path d='M0.999268 2.8501H11.666' stroke={color} strokeLinecap='round' strokeLinejoin='round' />
		<Path d='M4.19928 2.85L5.07635 1.25H7.60651L8.46596 2.85H4.19928Z' stroke={color} strokeLinejoin='round' />
	</Svg>
);

export default DeleteIcon;
