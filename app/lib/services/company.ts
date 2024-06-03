import sdk from './sdk';

export const getCompany = () => sdk.get('login.getSwitchCandidate');

interface IGetCompanyTokenParams {
	company: string;
	phone: string;
	userId: string;
}
export const getCompanyToken = (params: IGetCompanyTokenParams) => sdk.post('login.generateSwitchLoginToken', params);
