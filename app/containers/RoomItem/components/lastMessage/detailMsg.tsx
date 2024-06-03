import React from 'react';
import { View, Text } from 'react-native';

import useMatch from '../hooks/useMatch';
import styles from '../../../markdown/styles';

const DetailMsg = ({ perName, searchKey }: { perName: string; searchKey: string }) => {
	const resFnc = useMatch();

	return (
		<>
			<View style={{ flexDirection: 'row' }}>
				<Text style={[styles.text]}>
					{'包含成员:'}{' '}
					{resFnc(`${perName}`, searchKey).map(({ type, value }) => (
						<Text
							style={[
								styles.text,
								{
									color: type ? 'rgb(57,117,198)' : '#666666'
								}
							]}
						>
							{value}
						</Text>
					))}
				</Text>
			</View>
		</>
	);
};

export default DetailMsg;
