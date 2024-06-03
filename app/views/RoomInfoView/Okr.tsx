import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { TSupportedThemes } from '../../theme';
import styles from './styles';
import { themes } from '../../lib/constants';
import Empty from '../../containers/Empty';
import { fetchOtkrDate, fetchOtkrQuery, getOtkrCanQuery } from '../../lib/services/restApi';
import { ITab } from '../../definitions/rest/v1/otkr';
import { useAppSelector } from '../../lib/hooks';

enum EType {
	object = 'object',
	kr = 'kr',
	t = 't'
}

interface IObject {
	index: string;
	data: string;
	challenge?: string;
	items?: IObject[];
}

const challengeMap = {
	2: 'Very Challenge(VC)',
	1: 'Challenge(C)',
	0: 'Normal(N)'
};

const Item: React.FC<{ title: string; value: React.ReactElement; type: EType }> = ({ title, value, type }) => (
	<View
		style={[styles.okrItemWrapper, type === EType.object && styles.objectItemWrapper, type === EType.t && styles.tItemWrapper]}
	>
		<View style={styles[type]}>
			<Text style={styles[`${type}Text`]}>{title}</Text>
		</View>
		<View style={styles.okrItemValue}>{value}</View>
	</View>
);

interface IState {
	list: ITab[];
	loading: boolean;
	active: string | null;
}
const Okr: React.FC<{ username: string; theme: TSupportedThemes }> = ({ theme, username }) => {
	const me = useAppSelector(state => state.login.user.username);
	const [tabs, setTabs] = useState<IState>({
		list: [],
		loading: true,
		active: null
	});
	const [otkr, setOtkr] = useState(null);
	const [canViewOtkr, setCanViewOtkr] = useState(false);

	const self = useMemo(() => {
		const res: IObject[] = [];

		// @ts-ignore
		(otkr?.self?.data as unknown as IObject[])?.forEach(oValue => {
			if (oValue) {
				const tItems: IObject[] = [];

				oValue?.items?.forEach(tValue => {
					if (tValue) {
						const krItems: IObject[] = [];

						tValue?.items?.forEach(krItem => {
							if (krItem?.data) {
								krItems.push({
									index: krItem.index,
									data: krItem.data
								});
							}
						});

						tItems.push({
							index: tValue.index,
							data: tValue.data,
							items: krItems
						});
					}
				});

				const data = {
					index: oValue.index,
					data: oValue.data,
					challenge: oValue.challenge ? challengeMap[oValue.challenge as unknown as keyof typeof challengeMap] : undefined,
					items: tItems
				};

				res.push(data);
			}
		});

		return res;
	}, [otkr]);

	useEffect(() => {
		if (me) {
			getOtkrCanQuery(me, username).then(res => {
				if (res?.success && res?.data) {
					setCanViewOtkr(true);
				}
			});
		}
	}, [username]);

	useEffect(() => {
		fetchOtkrDate({ username }).then(res => {
			// @ts-ignore
			const list = (res?.data || []) as ITab[];

			setTabs({
				list,
				loading: true,
				active: list[0].key
			});
		});
	}, [username]);

	useEffect(() => {
		if (tabs.active && canViewOtkr) {
			fetchOtkrQuery({
				username,
				time: tabs.active
			})
				.then(res => {
					setOtkr(res?.data as any);
				})
				.catch(() => {
					setOtkr(null);
				});
		}
	}, [tabs.active, canViewOtkr, username]);

	return (
		<View style={[styles.box, styles.directAvatar, { backgroundColor: themes[theme].backgroundColor }]}>
			<View style={styles.listInfo}>
				<View style={styles.cardTitle}>
					<Text style={styles.cardTitleText}>POTA</Text>
				</View>
				<ScrollView style={styles.tabs} horizontal showsHorizontalScrollIndicator={false}>
					{tabs.list.map(({ key, label }) => (
						<TouchableOpacity
							style={[styles.tab, tabs.active === key && styles.activeTab]}
							key={key}
							onPress={() =>
								setTabs(prevState => ({
									...prevState,
									active: key
								}))
							}
						>
							<View>
								<Text
									style={[
										styles.tabText,
										tabs.active === key && {
											color: '#2878FF'
										}
									]}
								>
									{label}
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</ScrollView>
				{self.length && canViewOtkr ? (
					self.map(oValue => {
						let tIndex = 0;
						return (
							<View key={oValue.index}>
								{oValue.data ? (
									<Item
										title={'KO'}
										value={
											<>
												<Text style={styles.objectContent}>{oValue.data}</Text>
												{/* {oValue.challenge ? <Text style={styles.okrContent1}>挑战度：{oValue.challenge}</Text> : null} */}
											</>
										}
										type={EType.object}
									/>
								) : null}
								{oValue.items?.map(tValue => {
									if (tValue.data) {
										tIndex++;
									}

									return (
										<View key={tValue.index}>
											{tValue.data ? (
												<Item title={`KT${tIndex}`} value={<Text style={styles.tContent}> {tValue.data} </Text>} type={EType.t} />
											) : null}

											{tValue.items?.map((krValue, krIndex) => (
												<Item
													key={krValue.index}
													title={`KR${krIndex + 1}`}
													value={<Text style={styles.tContent}> {krValue.data} </Text>}
													type={EType.kr}
												/>
											))}
										</View>
									);
								})}
							</View>
						);
					})
				) : (
					<Empty
						noPermission={!canViewOtkr}
						style={{ paddingBottom: 30 }}
						icon={canViewOtkr ? { width: 200, height: 160 } : { width: 238, height: 1155 }}
						description={canViewOtkr ? '当前暂无POTA' : '您无权限查看他人POTA'}
					/>
				)}
			</View>
		</View>
	);
};

export default Okr;
