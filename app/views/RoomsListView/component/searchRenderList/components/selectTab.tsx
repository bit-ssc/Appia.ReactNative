import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import I18n from 'i18n-js';

import styles from '../styles';

const selectMpa = [I18n.t('Search_All'), I18n.t('Search_Contacts'), `${I18n.t('Teams')}&${I18n.t('Channels')}`];

const SelectTab = React.memo(
	({ selectNumber, toOnePage }: { selectNumber: number; toOnePage?: (pageNumber: number) => void }) => (
		<>
			<View style={styles.tabBarSearch}>
				{selectMpa.map((item, index) => (
					<TouchableHighlight
						style={styles.searchTypeTitle}
						activeOpacity={0.6}
						underlayColor='#DDDDDD'
						onPress={() => {
							toOnePage && toOnePage(index);
						}}
					>
						<View
							style={{
								...styles.searchTypeTitleText,
								borderBottomColor: index === selectNumber ? '#1b5bff' : 'rgba(0,0,0,0)'
							}}
						>
							<Text
								style={{
									fontWeight: index === selectNumber ? '800' : '400',
									color: index === selectNumber ? '#1b5bff' : 'black'
								}}
							>
								{item}
							</Text>
						</View>
					</TouchableHighlight>
				))}
			</View>
		</>
	)
);

export default SelectTab;
