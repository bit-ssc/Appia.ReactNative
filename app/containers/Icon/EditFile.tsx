import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export interface IProps {
	width?: number;
	height?: number;
	color?: string;
	opacity?: number;
	style?: ViewStyle[] | ViewStyle;
}

const EditFileIcon: React.FC<IProps> = ({ width = 24, height = 24 }) => (
	<Svg width={width} height={height} viewBox='0 0 48 48' fill='none'>
		<G opacity='0.9'>
			<Path d='M42.3964 14.8515L32.6663 5.12132L34.7876 3L44.5178 12.7301L42.3964 14.8515Z' fill='black' fill-opacity='0.9' />
			<Path
				d='M17.9159 39.3324L7.07701 41.5002C6.44726 41.6261 5.89203 41.0709 6.01798 40.4411L8.18575 29.6023L30.0786 7.70945L39.8087 17.4396L17.9159 39.3324ZM35.5661 17.4396L30.0786 11.9521L10.9494 31.0813L9.57748 37.9407L16.4369 36.5688L35.5661 17.4396Z'
				fill='black'
				fill-opacity='0.9'
			/>
			<Path d='M45 33H33V36H45V33Z' fill='black' fill-opacity='0.9' />
			<Path d='M45 39H25.5V42H45V39Z' fill='black' fill-opacity='0.9' />
		</G>
	</Svg>
);

export default EditFileIcon;
