import { EntityIdVO } from '../value-objects/entity-id';
import { MergeWebhookEvent } from '../entities/merge-webhook-event';

export interface WebhooksRepositoryPort {
	save(entity: MergeWebhookEvent): Promise<void>;
	findById(id: EntityIdVO): Promise<MergeWebhookEvent | null>;
	update(entity: MergeWebhookEvent): Promise<void>;
}
