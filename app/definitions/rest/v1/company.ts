import { ICompany } from '../../ICompany';

export type CompanyEndpoints = {
	'login.getSwitchCandidate': {
		GET: () => {
			data: ICompany[];
		};
	};
	'login.generateSwitchLoginToken': {
		POST: (params: { company: string; userId: string; phone: string }) => {
			data: {
				token: string;
			};
		};
	};
};
