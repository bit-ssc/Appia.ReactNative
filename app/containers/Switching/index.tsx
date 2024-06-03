import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import I18n from '../../i18n';

const Switching: React.FC = () => (
	<View style={{ height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
		<ActivityIndicator size='large' color='#2878ff' />
		<Text style={{ padding: 10, color: '#666', fontSize: 18 }}>{I18n.t('CompaniesSwitching')}</Text>
	</View>
);

export default Switching;
