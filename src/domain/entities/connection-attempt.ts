import { EntityIdVO } from '../value-objects/entity-id';
import { ConnectorType } from '../../shared/helpers/mergeConnectorConfigGetter';

interface ConnectionAttemptCreateProps {
	customerId: string;
	customerOrganizationName: string;
	customerEmail: string;
	connectorType: ConnectorType;
	status: string;
	url: string | null;
	mergeLinkToken: string | null;
}

export class ConnectionAttempt {
	constructor(
		public readonly id: EntityIdVO,
		public readonly customerId: string,
		public readonly customerOrganizationName: string,
		public readonly customerEmail: string,
		public readonly connectorType: ConnectorType,
		public readonly status: string,
		public readonly mergeLinkToken: string | null,
		public readonly url: string | null = null,
	) {}

	static create(entity: ConnectionAttemptCreateProps): ConnectionAttempt {
		const { customerId, customerOrganizationName, customerEmail, connectorType, status, mergeLinkToken, url } = entity;
		return new ConnectionAttempt(EntityIdVO.generate(), customerId, customerOrganizationName, customerEmail, connectorType, status, mergeLinkToken, url);
	}
}
