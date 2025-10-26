import { EntityIdVO } from '../value-objects/entity-id';

interface CustomerConnectionCreateProps {
	customerId: string;
	customerOrganizationName: string;
	customerEmail: string;
	accountId: string;
	accountToken: string;
	connectorType: string;
	lastSyncedAt: Date | null;
}

export class CustomerConnection {
	constructor(
		public readonly id: EntityIdVO,
		public readonly customerId: string,
		public readonly customerOrganizationName: string,
		public readonly customerEmail: string,
		public readonly accountId: string,
		public readonly accountToken: string,
		public readonly connectorType: string,
		public readonly lastSyncedAt: Date | null,
	) {}

	static create(entity: CustomerConnectionCreateProps): CustomerConnection {
		const { customerId, customerOrganizationName, customerEmail, accountId, accountToken, connectorType, lastSyncedAt } = entity;
		return new CustomerConnection(EntityIdVO.generate(), customerId, customerOrganizationName, customerEmail, accountId, accountToken, connectorType, lastSyncedAt);
	}
}
