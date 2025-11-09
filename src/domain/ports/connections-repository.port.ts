import { EntityIdVO } from '../value-objects/entity-id';
import { CustomerConnection } from '../entities/customer-connection';

export interface ConnectionsRepositoryPort {
	save(entity: CustomerConnection): Promise<void>;
	updateSyncedAt(id: EntityIdVO, date: Date): Promise<void>;
	findById(id: EntityIdVO): Promise<CustomerConnection | null>;
	findByMergeAccountId(accountId: string): Promise<CustomerConnection | null>;
	list(filter: { customerId?: string; providerName?: string }): Promise<CustomerConnection[]>;
	delete(id: EntityIdVO): Promise<void>;
}
