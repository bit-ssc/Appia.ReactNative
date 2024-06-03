import React, { useMemo } from 'react';
import { ScrollView, Keyboard } from 'react-native';
import I18n from 'i18n-js';

import OtherItem from './components/OtherItem';
import MoreItem from './components/MoreItem';
import { store as reduxStore } from '../../../../lib/store/auxStore';

const AllList = ({ displayMode, data, renderItem, toOnePage }: any) => {
	const renderMore = useMemo(() => {
		const Appia_Search_Person_Limit = (reduxStore.getState().settings.Appia_Search_Person_Limit as number) || 3;
		if ('length' in data[0] && data[0].length >= Appia_Search_Person_Limit)
			return (
				<MoreItem
					displayMode={displayMode}
					toOnePage={() => {
						toOnePage(1);
					}}
				/>
			);
	}, [data]);

	const renderMoreRoom = useMemo(() => {
		const Appia_Search_PersonInRoom_Limit = (reduxStore.getState().settings.Appia_Search_PersonInRoom_Limit as number) || 3;
		if ('length' in data[1] && data[1].length >= Appia_Search_PersonInRoom_Limit)
			return (
				<MoreItem
					displayMode={displayMode}
					toOnePage={() => {
						toOnePage(2);
					}}
				/>
			);
	}, [data]);

	const renderPerson = () => (
		<>
			{data[0]?.map((value, index) => {
				if (index > 2) {
					return;
				}
				return renderItem({
					item: value
				});
			})}
		</>
	);

	return (
		<ScrollView style={{ width: '100%' }} onTouchStart={Keyboard.dismiss} keyboardShouldPersistTaps='handled'>
			{Boolean(data[0].length) && <OtherItem displayMode={displayMode} type={I18n.t('Search_Contacts')} />}
			{renderPerson()}
			{renderMore}
			{Boolean(data[1].length) && <OtherItem displayMode={displayMode} type={`${I18n.t('Teams')}&${I18n.t('Channels')}`} />}
			{data[1]?.map(value =>
				renderItem({
					item: value
				})
			)}
			{renderMoreRoom}
		</ScrollView>
	);

	/* const [sections, setSections] = useState([]);

	useEffect(() => {
		const result = [
			{ title: '联系人', footer: '查看更多', data: data[0] },
			{ title: '群', footer: '查看更多', data: data[1] }
		];
		console.info('result', result);
		setSections(result);
	}, [data]);

	return (
		<SectionList
			style={{ width: '100%' }}
			onTouchStart={Keyboard.dismiss}
			keyboardShouldPersistTaps='handled'
			sections={sections}
			keyExtractor={(item, index) => item + index}
			renderItem={({ item }) => {
				console.info('item', item);
				return renderItem({ item });
			}}
			renderSectionHeader={({ section: { title } }) => <Text style={{ fontWeight: 'bold' }}>{title}</Text>}
			renderSectionFooter={({ section: { footer } }) => <Text style={{ fontWeight: 'bold' }}>{footer}</Text>}
		></SectionList>
	); */
};
export default AllList;
