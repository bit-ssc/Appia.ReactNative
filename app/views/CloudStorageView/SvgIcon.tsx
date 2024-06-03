import Svg, { G, Mask, Path } from 'react-native-svg';
import React from 'react';

import { IProps } from '../../containers/Icon/List';

export const UploadIcon = () => (
	<Svg width='24' height='24' viewBox='0 0 48 48' fill='none'>
		<Path
			d='M14.1927 18.7877L12.0555 19.037C8.68839 19.4296 6 22.3586 6 26C6 29.6283 8.67114 32.5439 12 32.9513V35.967C6.96877 35.5504 3 31.2395 3 26C3 20.8571 6.808 16.6286 11.708 16.0571C12.94 10.2857 17.98 6 24 6C30.02 6 35.06 10.2857 36.292 16.0571C41.192 16.6286 45 20.8571 45 26C45 31.2395 41.0312 35.5504 36 35.967V32.9513C39.3289 32.5439 42 29.6283 42 26C42 22.3586 39.3116 19.4296 35.9445 19.037L33.8073 18.7877L33.3581 16.6834C32.4096 12.2403 28.548 9 24 9C19.452 9 15.5904 12.2403 14.6419 16.6834L14.1927 18.7877Z'
			fill='black'
			fill-opacity='0.9'
		/>
		<Path
			d='M18.4219 32.1606L22.4947 28.1629L22.5949 43.5208L25.6274 43.5L25.5276 28.1965L29.6459 32.213L31.7869 30.1116L24.6829 23.1831C24.2936 22.8035 23.6723 22.8045 23.2842 23.1854L16.2742 30.0659L18.4219 32.1606Z'
			fill='black'
			fill-opacity='0.9'
		/>
	</Svg>
);

export const BackIcon: React.FC<IProps> = ({ width = 24, height = 24, style }) => (
	<Svg width={width} height={height} viewBox='0 0 49 49' fill='none' style={style}>
		<Path
			fill-rule='evenodd'
			clip-rule='evenodd'
			d='M32.0314 38.9023L29.9404 41.0273L14.5932 25.4301C13.8273 24.6517 13.8273 23.403 14.5932 22.6246L29.9404 7.02734L32.0314 9.15234L17.3948 24.0273L32.0314 38.9023Z'
			fill='black'
			fill-opacity='0.9'
		/>
	</Svg>
);

export const DrawerItemRightIcon: React.FC<IProps> = ({ width = 24, height = 24, style }) => (
	<Svg width={width} height={height} viewBox='0 0 49 49' fill='none' style={style}>
		<Svg width={width} height={height} viewBox='0 0 16 26' fill='none'>
			<Path
				fill-rule='evenodd'
				clip-rule='evenodd'
				d='M0.908392 2.16066L3.02971 0.0393429L14.5861 11.5957C15.3671 12.3767 15.3671 13.6431 14.5861 14.4241L3.02971 25.9805L0.908392 23.8591L11.7576 13.0099L0.908392 2.16066Z'
				fill='#CCCCCC'
			/>
			<Mask
				id='mask0_1295_10255'
				style='mask-type:luminance'
				maskUnits='userSpaceOnUse'
				x='0'
				y='0'
				width={width}
				height={height}
			>
				<Path
					fill-rule='evenodd'
					clip-rule='evenodd'
					d='M0.908392 2.16066L3.02971 0.0393429L14.5861 11.5957C15.3671 12.3767 15.3671 13.6431 14.5861 14.4241L3.02971 25.9805L0.908392 23.8591L11.7576 13.0099L0.908392 2.16066Z'
					fill='white'
				/>
			</Mask>
			<G mask='url(#mask0_1295_10255)'></G>
		</Svg>
	</Svg>
);
