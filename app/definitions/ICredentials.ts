import { AppleAuthenticationFullName } from 'expo-apple-authentication';

export interface ICredentials {
	appiaToken?: string;
	resume?: string;
	user?: string;
	password?: string;
	username?: string;
	ldapPass?: string;
	ldap?: boolean;
	ldapOptions?: object;
	crowdPassword?: string;
	crowd?: boolean;
	code?: string;
	totp?: {
		login: ICredentials;
		code: string;
	};
	fullName?: AppleAuthenticationFullName | null;
	email?: string | null;
	identityToken?: string | null;
	credentialToken?: string;
	saml?: boolean;
	cas?: { credentialToken?: string };
	smsCode?: boolean;
	phone?: string;
	areaCode?: string;
	userToken?: string;
	userId?: string;
	url?: string;
}
