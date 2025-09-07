import { MergeClient } from '@mergeapi/merge-node-client';
import { getConnectorConfig } from '../../shared/helpers/mergeConnectorConfigGetter';
import { ICreateLinkTokenRequest, ICreateLinkTokenResponse, MergeLinkPort } from '../../domain/ports/merge-link.port';

export interface IMergeClientOpts {
	apiKey: string;
}

const DEFAULT_MERGE_LINK_EXPIRY_MINUTES = 60; // 1 hour

export class MergeLinkClientAdapter implements MergeLinkPort {
	private readonly client: MergeClient;

	constructor(private readonly opts: IMergeClientOpts) {
		this.client = new MergeClient({
			apiKey: this.opts.apiKey,
			environment: 'https://api-eu.merge.dev/api',
		});
	}

	public async linkToken(request: ICreateLinkTokenRequest): Promise<ICreateLinkTokenResponse> {
		const { namespace, category } = getConnectorConfig(this.client, request.connectorType);

		const response = await namespace.linkToken.create({
			endUserEmailAddress: request.email,
			endUserOrganizationName: request.organizationName,
			endUserOriginId: request.customerId,
			categories: [category],
			linkExpiryMins: DEFAULT_MERGE_LINK_EXPIRY_MINUTES,
		});

		return {
			linkToken: response.linkToken,
			expiry: null, // TODO: return calculated expiry
			url: response.magicLinkUrl ?? null,
		};
	}
}
