import { EntityIdVO } from '../value-objects/entity-id';

interface WebhookCreateProps {
	eventType: string;
	payload: unknown;
}

export class MergeWebhookEvent {
	constructor(
		public readonly id: EntityIdVO,
		public readonly eventType: string,
		public readonly payload: unknown,
		public readonly processedAt: Date | null,
	) {}

	static create(props: WebhookCreateProps): MergeWebhookEvent {
		return new MergeWebhookEvent(EntityIdVO.generate(), props.eventType, props.payload, null);
	}
}
