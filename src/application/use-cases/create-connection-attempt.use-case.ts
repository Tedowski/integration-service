import { ConnectionAttempt } from '../../domain/entities/connection-attempt';
import { ConnectionAttemptsRepositoryPort } from '../../domain/ports/connection-attempts-repository.port';
import { MergeLinkPort } from '../../domain/ports/merge-link.port';
import { ConnectorType } from '../../shared/helpers/mergeConnectorConfigGetter';

export interface CreateConnectionAttempt {
	customerId: string;
	customerOrganizationName: string;
	customerEmail: string;
	connectorType: ConnectorType;
}

export interface CreateConnectionAttemptResponse {
	customerId: string;
	customerOrganizationName: string;
	customerEmail: string;
	connectorType: ConnectorType;
	status: string;
	mergeLinkToken: string;
	url: string | null;
}

export class CreateConnectionAttemptUseCase {
	constructor(
		private readonly connectionAttemptRepositoryPort: ConnectionAttemptsRepositoryPort,
		private readonly mergeLinkPort: MergeLinkPort,
	) {}

	async execute(request: CreateConnectionAttempt): Promise<CreateConnectionAttemptResponse> {
		const connectionAttempt = ConnectionAttempt.create({
			customerId: request.customerId,
			customerOrganizationName: request.customerOrganizationName,
			customerEmail: request.customerEmail,
			connectorType: request.connectorType,
			status: 'PENDING',
			mergeLinkToken: null,
			url: null,
		});

		await this.connectionAttemptRepositoryPort.save(connectionAttempt);

		try {
			const linkTokenResponse = await this.mergeLinkPort.linkToken({
				customerId: request.customerId,
				email: request.customerEmail,
				organizationName: request.customerOrganizationName,
				connectorType: request.connectorType,
			});

			await this.connectionAttemptRepositoryPort.update({
				...connectionAttempt,
				mergeLinkToken: linkTokenResponse.linkToken,
				status: 'TOKEN_LINK_CREATED',
			});

			const updated = await this.connectionAttemptRepositoryPort.findById(connectionAttempt.id);
			if (!updated) throw new Error('ConnectionAttempt not found after update');

			if (!updated.mergeLinkToken) throw new Error('Merge link token not found after update');

			return {
				customerId: updated.customerId,
				customerOrganizationName: updated.customerOrganizationName,
				customerEmail: updated.customerEmail,
				connectorType: updated.connectorType,
				status: updated.status,
				mergeLinkToken: updated.mergeLinkToken,
				url: linkTokenResponse.url,
			};
		} catch (e) {
			await this.connectionAttemptRepositoryPort.update({
				...connectionAttempt,
				status: 'ERROR',
			});
			throw e;
		}
	}
}
