import { ConnectorType } from '../../shared/helpers/mergeConnectorConfigGetter';

export interface ICreateLinkTokenRequest {
	connectorType: ConnectorType;
	email: string;
	organizationName: string;
	customerId: string;
}

export interface ICreateLinkTokenResponse {
	linkToken: string;
	expiry: Date | null;
	url: string | null;
}

export interface MergeLinkPort {
	linkToken(request: ICreateLinkTokenRequest): Promise<ICreateLinkTokenResponse>;
}
