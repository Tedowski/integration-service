import { and, eq, SQL } from 'drizzle-orm';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { Database } from '../database/connection';
import { connectionAttempts, ConnectionAttemptSchema, NewConnectionAttemptSchema } from '../database/schema';
import { ConnectionAttemptsRepositoryPort } from '../../domain/ports/connection-attempts-repository.port';
import { ConnectionAttempt } from '../../domain/entities/connection-attempt';
import { ConnectorType } from '../../shared/helpers/mergeConnectorConfigGetter';

export class DrizzleConnectionAttemptsRepositoryAdapter implements ConnectionAttemptsRepositoryPort {
	constructor(private readonly db: Database) {}

	async save(entity: ConnectionAttempt): Promise<void> {
		const insert: NewConnectionAttemptSchema = {
			id: entity.id.toString(),
			customerId: entity.customerId,
			customerOrganizationName: entity.customerOrganizationName,
			customerEmail: entity.customerEmail,
			status: entity.status,
			connectorType: entity.connectorType,
			mergeLinkToken: entity.mergeLinkToken,
			url: entity.url,
		};

		await this.db.insert(connectionAttempts).values(insert);
	}

	async update(entity: ConnectionAttempt): Promise<void> {
		await this.db
			.update(connectionAttempts)
			.set({
				status: entity.status,
				mergeLinkToken: entity.mergeLinkToken,
				url: entity.url,
			})
			.where(eq(connectionAttempts.id, entity.id.toString()));
	}

	async findById(id: EntityIdVO): Promise<ConnectionAttempt | null> {
		const result = await this.db.select().from(connectionAttempts).where(eq(connectionAttempts.id, id.toString())).limit(1);

		return result[0] ? this.toDomainEntity(result[0]) : null;
	}

	async list(filter: { customerId?: string; connectorType?: ConnectorType }): Promise<ConnectionAttempt[]> {
		const filters: SQL[] = [];

		if (filter.customerId) filters.push(eq(connectionAttempts.customerId, filter.customerId));
		if (filter.connectorType) filters.push(eq(connectionAttempts.connectorType, filter.connectorType));

		const results = await this.db
			.select()
			.from(connectionAttempts)
			.where(and(...filters));

		return results.map((record) => this.toDomainEntity(record));
	}

	async delete(id: EntityIdVO): Promise<void> {
		await this.db.delete(connectionAttempts).where(eq(connectionAttempts.id, id.toString()));
	}

	private toDomainEntity(record: ConnectionAttemptSchema): ConnectionAttempt {
		return new ConnectionAttempt(
			EntityIdVO.create(record.id),
			record.customerId,
			record.customerOrganizationName,
			record.customerEmail,
			record.connectorType as ConnectorType,
			record.status,
			record.mergeLinkToken,
			record.url,
		);
	}
}
