import { and, eq, SQL } from 'drizzle-orm';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { Database } from '../database/connection';
import { customerConnections, CustomerConnectionSchema } from '../database/schema';
import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { CustomerConnection } from '../../domain/entities/customer-connection';

export class DrizzleConnectionsRepositoryAdapter implements ConnectionsRepositoryPort {
	constructor(private readonly db: Database) {}

	async save(connectionRecord: CustomerConnection): Promise<void> {
		await this.db.insert(customerConnections).values({
			id: connectionRecord.id.toString(),
			customerId: connectionRecord.customerId,
			customerOrganizationName: connectionRecord.customerOrganizationName,
			customerEmail: connectionRecord.customerEmail,
			accountId: connectionRecord.accountId,
			accountToken: connectionRecord.accountToken,
			connectorType: connectionRecord.connectorType,
		});
	}

	async updateSyncedAt(id: EntityIdVO, date: Date): Promise<void> {
		await this.db.update(customerConnections).set({ lastSyncedAt: date }).where(eq(customerConnections.id, id.toString()));
	}

	async findById(id: EntityIdVO): Promise<CustomerConnection | null> {
		const result = await this.db.select().from(customerConnections).where(eq(customerConnections.id, id.toString())).limit(1);

		return result[0] ? this.toDomainEntity(result[0]) : null;
	}

	async findByMergeAccountId(accountId: string): Promise<CustomerConnection | null> {
		const result = await this.db.select().from(customerConnections).where(eq(customerConnections.accountId, accountId)).limit(1);

		return result[0] ? this.toDomainEntity(result[0]) : null;
	}

	async list(filter: { customerId?: string; providerName?: string }): Promise<CustomerConnection[]> {
		const filters: SQL[] = [];

		if (filter.customerId) filters.push(eq(customerConnections.customerId, filter.customerId));
		if (filter.providerName) filters.push(eq(customerConnections.connectorType, filter.providerName));

		const results = await this.db
			.select()
			.from(customerConnections)
			.where(and(...filters));

		return results.map((record) => this.toDomainEntity(record));
	}

	async delete(id: EntityIdVO): Promise<void> {
		await this.db.delete(customerConnections).where(eq(customerConnections.id, id.toString()));
	}

	private toDomainEntity(record: CustomerConnectionSchema): CustomerConnection {
		return new CustomerConnection(
			EntityIdVO.create(record.id),
			record.customerId,
			record.customerOrganizationName,
			record.customerEmail,
			record.accountToken,
			record.accountId,
			record.connectorType,
			record.lastSyncedAt,
		);
	}
}
