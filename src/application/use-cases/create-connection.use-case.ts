import { ConnectionAttemptsRepositoryPort } from '../../domain/ports/connection-attempts-repository.port';
import { MergeLinkPort } from '../../domain/ports/merge-link.port';
import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { CustomerConnection } from '../../domain/entities/customer-connection';

export interface CreateConnection {
	attemptId: string;
	publicToken: string;
}

export interface CreateConnectionAttemptResponse {
	connectionId: string;
	accountId: string;
	createdAt: string;
}

export class CreateConnectionUseCase {
	constructor(
		private readonly connectionAttemptRepositoryPort: ConnectionAttemptsRepositoryPort,
		private readonly connectionsRepositoryPort: ConnectionsRepositoryPort,
		private readonly mergeLinkPort: MergeLinkPort,
	) {}

	async execute(request: CreateConnection): Promise<CreateConnectionAttemptResponse> {
		const attemptId = EntityIdVO.create(request.attemptId);

		const connectionAttempt = await this.connectionAttemptRepositoryPort.findById(attemptId);

		if (!connectionAttempt) throw new Error('Connection attempt not found');

		const retrieveAccountTokenResponse = await this.mergeLinkPort.retrieveAccountToken({
			publicToken: request.publicToken,
			connectorType: connectionAttempt.connectorType,
		});

		const connection = CustomerConnection.create({
			customerId: connectionAttempt.customerId,
			customerEmail: connectionAttempt.customerEmail,
			customerOrganizationName: connectionAttempt.customerOrganizationName,
			connectorType: connectionAttempt.connectorType,
			accountId: retrieveAccountTokenResponse.id,
			accountToken: retrieveAccountTokenResponse.accountToken,
			lastSyncedAt: null,
		});

		await this.connectionsRepositoryPort.save(connection);

		await this.connectionAttemptRepositoryPort.update({
			...connectionAttempt,
			status: 'COMPLETED',
		});

		return {
			connectionId: connection.id.toString(),
			accountId: retrieveAccountTokenResponse.id,
			createdAt: new Date().toISOString(),
		};
	}
}
