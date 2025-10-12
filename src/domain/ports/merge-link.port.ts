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

export interface IRetrieveAccountTokenRequest {
	publicToken: string;
	connectorType: ConnectorType;
}

export interface IRetrieveAccountTokenResponse {
	accountToken: string;
	id: string;
	metadata: Record<string, unknown>;
}

export interface MergeLinkPort {
	linkToken(request: ICreateLinkTokenRequest): Promise<ICreateLinkTokenResponse>;
	retrieveAccountToken(request: IRetrieveAccountTokenRequest): Promise<IRetrieveAccountTokenResponse>;
}
