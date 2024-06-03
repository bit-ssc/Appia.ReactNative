import React, { useCallback, useEffect } from 'react';
import FastImage from 'react-native-fast-image';
import { StyleSheet, View, Text, FlatList, ImageBackground, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import I18n from 'i18n-js';

import { ICompany, IApplicationState } from '../../definitions';
import { fetchCompaniesRequest, toggleCompanies } from '../../actions/company';
import { loginWithToken } from '../../actions/login';
import My from './My';
import { DrawerMenu } from '../DrawerMenu';

const styles = StyleSheet.create({
	companies: {
		flex: 1,
		width: '100%',
		backgroundColor: '#fff',
		borderTopRightRadius: 4,
		borderBottomRightRadius: 4
	},
	company: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingLeft: 24
	},
	logo: {
		width: 52,
		height: 52
	},
	name: {
		flex: 1,
		fontWeight: '600',
		marginLeft: 16
	}
});

const serverSelector = (state: IApplicationState) => state.server.server;
const languageSelector = (state: IApplicationState) => state.login?.user?.language;

const Company: React.FC<{ company: ICompany }> = ({ company }) => {
	const server = useSelector(serverSelector);
	const language = useSelector(languageSelector);

	const dispatch = useDispatch();
	const current = server === company.appiaUrl;
	const onPress = useCallback(() => {
		dispatch(loginWithToken(company));
	}, [company, dispatch]);

	const content = (
		<>
			<FastImage source={{ uri: company.companyLogo }} style={styles.logo} />
			<Text style={styles.name}>{language === 'zh-CN' ? company.companyNameCn : company.companyName}</Text>
		</>
	);

	return (
		<>
			{current ? (
				<ImageBackground source={require('./company.png')} resizeMode='stretch' style={styles.company}>
					{content}
				</ImageBackground>
			) : (
				<TouchableOpacity style={styles.company} onPress={onPress}>
					{content}
				</TouchableOpacity>
			)}
		</>
	);
};

const renderItem = ({ item }: { item: ICompany }) => <Company company={item} />;

const companiesSelector = (state: IApplicationState) => state.company;
const Companies: React.FC = () => {
	const { toggle, companies } = useSelector(companiesSelector);
	const dispatch = useDispatch();
	const onClose = useCallback(() => {
		dispatch(toggleCompanies(false));
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchCompaniesRequest());
	}, [toggle, dispatch]);

	// if (toggle) {
	return (
		<DrawerMenu
			visible={toggle}
			hideModal={onClose}
			title={I18n.t('My_Company')}
			menuPosition='left'
			Height={'80%'}
			children={
				<View style={styles.companies}>
					<View style={{ flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E6EB' }}>
						<FlatList data={companies} renderItem={renderItem} />
					</View>
					<My />
				</View>
			}
		/>
	);
};

export default Companies;
