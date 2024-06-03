import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	opacity?: number;
	style?: ViewStyle[] | ViewStyle;
}

const FederationIcon: React.FC<IProps> = () => (
	<Svg width='22' height='22' viewBox='0 0 22 22' fill='none'>
		<Rect x='0.5' y='0.5' width='21' height='21' rx='2.78125' fill='#E8F2FF' />
		<Path
			d='M12.904 4.59H13.94V8.818C15.0787 9.64867 16.2593 10.6147 17.482 11.716L16.866 12.64C15.634 11.408 14.6587 10.5073 13.94 9.938V17.386H12.904V4.59ZM7.248 10.148C8.032 10.568 8.746 11.058 9.39 11.618C10.0433 10.3767 10.4727 9.00933 10.678 7.516H7.906C7.24333 9.084 6.34267 10.3953 5.204 11.45L4.518 10.596C6.12333 9.10267 7.206 7.096 7.766 4.576L8.774 4.744C8.634 5.36933 8.466 5.97133 8.27 6.55H11.672V7.432C11.196 11.6787 9.14267 14.8847 5.512 17.05L4.826 16.196C6.58067 15.188 7.948 13.928 8.928 12.416C8.18133 11.7813 7.444 11.2867 6.716 10.932L7.248 10.148Z'
			fill='#1B5BFF'
		/>
		<Rect x='0.5' y='0.5' width='21' height='21' rx='2.78125' stroke='#1B5BFF' />
	</Svg>
);

export default FederationIcon;
