import { EntityIdVO } from '../value-objects/entity-id';
import { ConnectionAttempt } from '../entities/connection-attempt';

export interface ConnectionAttemptsRepositoryPort {
	save(entity: ConnectionAttempt): Promise<void>;
	update(entity: ConnectionAttempt): Promise<void>;
	findById(id: EntityIdVO): Promise<ConnectionAttempt | null>;
	list(filter: { customerId?: string; providerName?: string }): Promise<ConnectionAttempt[]>;
	delete(id: EntityIdVO): Promise<void>;
}
