import React, { useContext } from 'react';
import Svg, { Path } from 'react-native-svg';

import Touchable from '../../Touchable';
import styles from '../../styles';
import { BUTTON_HIT_SLOP } from '../../utils';
import MessageContext from '../../Context';

const MessageError = React.memo(
	({ hasError }: { hasError: boolean }) => {
		const { onErrorPress } = useContext(MessageContext);

		if (!hasError) {
			return null;
		}

		const FailIcon = () => (
			<Svg viewBox='0 0 1024 1024' width='18' height='18'>
				<Path
					d='M512 1024C229.23 1024 0 794.77 0 512S229.23 0 512 0s512 229.23 512 512-229.23 512-512 512z m-54.422-832l20.027 458.936h68.79L566.422 192H457.578z m53.987 511.82c-17.415 0-32.218 5.379-44.409 17.928C454.096 733.4 448 748.638 448 767.462c0 17.927 6.095 33.165 19.156 45.714C479.346 825.726 494.15 832 511.565 832s33.088-6.275 46.15-17.927c12.19-12.55 18.285-27.787 18.285-46.61 0-18.824-6.095-34.062-18.286-45.715-12.19-12.55-27.864-17.927-46.15-17.927z'
					fill='#FF0000'
					p-id='2538'
				></Path>
			</Svg>
		);

		return (
			<Touchable onPress={onErrorPress} style={[styles.rightIcons]} hitSlop={BUTTON_HIT_SLOP}>
				<FailIcon />
			</Touchable>
		);
	},
	(prevProps, nextProps) => prevProps.hasError === nextProps.hasError
);

MessageError.displayName = 'MessageError';

export default MessageError;
