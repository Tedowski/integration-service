import { WebhooksRepositoryPort } from '../../domain/ports/webhooks-repository.port';
import { MergeWebhookEvent } from '../../domain/entities/merge-webhook-event';
import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { IMergeEventQueueProvider } from '../../domain/ports/message-provider.port';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { MergeClient } from '@mergeapi/merge-node-client';
import { FileMetadata } from '../../domain/value-objects/file-metadata';
import { ILogger, LoggerFactory } from '../../logger/logger';

interface InputWebhook {
	eventType: string;
	payload: unknown;
	mergeKey: string;
}

interface FileStorageFileSyncedPayload {
	data: {
		sync_status: {
			status: 'DONE' | 'SYNCING'; // incomplete
		};
	};
	linked_account: {
		id: string;
		category: string;
	};
}

export class ProcessWebhookUseCase {
	private readonly logger: ILogger;

	constructor(
		private readonly webhooksRepositoryPort: WebhooksRepositoryPort,
		private readonly connectionsRepositoryPort: ConnectionsRepositoryPort,
		private readonly messageProvider: IMergeEventQueueProvider,
	) {
		this.logger = new LoggerFactory().createLogger(ProcessWebhookUseCase.name);
	}

	async execute(request: InputWebhook): Promise<string> {
		const webhookData = MergeWebhookEvent.create(request);
		await this.webhooksRepositoryPort.save(webhookData);

		// TODO: Implement other event types for other verticals
		if (webhookData.eventType !== 'FileStorageFile.synced') {
			this.logger.info(`Unhandled webhook event type: ${webhookData.eventType}`);
			return webhookData.id.toString();
		}

		const payload = webhookData.payload as FileStorageFileSyncedPayload;

		if (payload.data.sync_status.status !== 'DONE') {
			return webhookData.id.toString();
		}

		const accountId = payload.linked_account.id;
		const connection = await this.connectionsRepositoryPort.findById(EntityIdVO.create(accountId));
		if (!connection) {
			this.logger.info(`No connection found for account ID: ${accountId}`);
			return webhookData.id.toString();
		}

		const client = new MergeClient({
			apiKey: request.mergeKey,
			environment: 'https://api-eu.merge.dev/api', // TODO: make configurable based on customer region
			accountToken: connection.accountToken,
		});

		// TODO: add pagination handling
		const files = await client.filestorage.files.list({
			createdAfter: connection.lastSyncedAt ?? undefined,
		});

		if (!files.results || files.results?.length === 0) {
			this.logger.info(`No new files to sync for connection ID: ${connection.id.toString()}`);
			return webhookData.id.toString();
		}

		for (const result of files.results) {
			if (!result.fileUrl) {
				this.logger.info(`File result has no file URL, skipping. File ID: ${result.id}`);
				continue;
			}

			const metadata: FileMetadata = {
				originalName: result.name ?? result.fileUrl,
				mimeType: result.mimeType ?? result.fileUrl.split('.').pop() ?? 'application/octet-stream',
				size: result.size!,
				uploadedAt: new Date(),
			};

			await this.messageProvider.send({
				accountId,
				metadata,
				url: result.fileUrl,
				fileId: result.id!,
				timestamp: new Date().toISOString(),
			});
		}

		await this.webhooksRepositoryPort.updateProcessedAt(webhookData.id, new Date());

		return webhookData.id.toString();
	}
}
