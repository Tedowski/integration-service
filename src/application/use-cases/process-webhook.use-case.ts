import { WebhooksRepositoryPort } from '../../domain/ports/webhooks-repository.port';
import { MergeWebhookEvent } from '../../domain/entities/merge-webhook-event';

interface InputWebhook {
	eventType: string;
	payload: unknown;
}

export class ProcessWebhookUseCase {
	constructor(private readonly webhooksRepositoryPort: WebhooksRepositoryPort) {}

	async execute(request: InputWebhook): Promise<string> {
		const webhookData = MergeWebhookEvent.create(request);
		await this.webhooksRepositoryPort.save(webhookData);

		// TODO: Add logic to process the webhook based on eventType and payload

		return webhookData.id.toString();
	}
}
