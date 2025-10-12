import { eq } from 'drizzle-orm';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { Database } from '../database/connection';
import { mergeWebhookEvents, MergeWebhookEventSchema, NewMergeWebhookEventSchema } from '../database/schema';
import { WebhooksRepositoryPort } from '../../domain/ports/webhooks-repository.port';
import { MergeWebhookEvent } from '../../domain/entities/merge-webhook-event';

export class DrizzleWebhooksRepositoryAdapter implements WebhooksRepositoryPort {
	constructor(private readonly db: Database) {}

	async save(entity: MergeWebhookEvent): Promise<void> {
		const insert: NewMergeWebhookEventSchema = {
			id: entity.id.toString(),
			eventType: entity.eventType,
			payload: entity.payload,
		};

		await this.db.insert(mergeWebhookEvents).values(insert);
	}

	async update(entity: MergeWebhookEvent): Promise<void> {
		await this.db
			.update(mergeWebhookEvents)
			.set({
				processedAt: entity.processedAt,
			})
			.where(eq(mergeWebhookEvents.id, entity.id.toString()));
	}

	async findById(id: EntityIdVO): Promise<MergeWebhookEvent | null> {
		const result = await this.db.select().from(mergeWebhookEvents).where(eq(mergeWebhookEvents.id, id.toString())).limit(1);

		return result[0] ? this.toDomainEntity(result[0]) : null;
	}

	private toDomainEntity(record: MergeWebhookEventSchema): MergeWebhookEvent {
		return new MergeWebhookEvent(EntityIdVO.create(record.id), record.eventType, record.payload, record.processedAt ? new Date(record.processedAt) : null);
	}
}
