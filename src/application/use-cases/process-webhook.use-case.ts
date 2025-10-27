import { WebhooksRepositoryPort } from '../../domain/ports/webhooks-repository.port';
import { MergeWebhookEvent } from '../../domain/entities/merge-webhook-event';
import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { IMergeEventQueueProvider } from '../../domain/ports/message-provider.port';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { MergeClient } from '@mergeapi/merge-node-client';
import { FileMetadata } from '../../domain/value-objects/file-metadata';

interface InputWebhook {
	eventType: string;
	payload: unknown;
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
	constructor(
		private readonly webhooksRepositoryPort: WebhooksRepositoryPort,
		private readonly connectionsRepositoryPort: ConnectionsRepositoryPort,
		private readonly messageProvider: IMergeEventQueueProvider,
	) {}

	async execute(request: InputWebhook): Promise<string> {
		const webhookData = MergeWebhookEvent.create(request);
		await this.webhooksRepositoryPort.save(webhookData);

		// Get file storage file synced event
		// TODO: Implement other event types for other verticals
		if (webhookData.eventType === 'FileStorageFile.synced') {
			const payload = webhookData.payload as FileStorageFileSyncedPayload;

			// Process only completed syncs
			if (payload.data.sync_status.status === 'DONE') {
				const accountId = payload.linked_account.id;
				const connection = await this.connectionsRepositoryPort.findById(EntityIdVO.create(accountId));
				if (!connection) {
					console.log(`No connection found for account ID: ${accountId}`);
					return webhookData.id.toString();
				}

				const client = new MergeClient({
					apiKey: process.env.MERGE_API_KEY || '',
					environment: 'https://api-eu.merge.dev/api', // TODO: make configurable based on customer region
					accountToken: connection.accountToken,
				});

				// TODO: add pagination handling
				const files = await client.filestorage.files.list({
					createdAfter: connection.lastSyncedAt ?? undefined,
				});

				if (!files.results || files.results?.length === 0) {
					console.log(`No new files to sync for connection ID: ${connection.id.toString()}`);
					return webhookData.id.toString();
				}

				for (const result of files.results) {
					if (!result.fileUrl) {
						console.log(`File result has no file URL, skipping. File ID: ${result.id}`);
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

					// TODO: figure out how to handle lastSyncedAt properly with async processing
				}
			}
		}

		return webhookData.id.toString();
	}

	private generateStorageKey(originalName: string, requestId?: string): string {
		const timestamp = new Date().toISOString().split('T')[0];
		const fileExtension = originalName.split('.').pop() || '';
		const uniqueId = requestId || crypto.randomUUID();

		return `uploads/${timestamp}/${uniqueId}.${fileExtension}`;
	}
}
