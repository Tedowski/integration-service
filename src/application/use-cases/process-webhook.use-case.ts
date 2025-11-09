import { WebhooksRepositoryPort } from '../../domain/ports/webhooks-repository.port';
import { MergeWebhookEvent } from '../../domain/entities/merge-webhook-event';
import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { FileMetadata } from '../../domain/value-objects/file-metadata';
import { ILogger, LoggerFactory } from '../../logger/logger';
import { IMergeEventQueueProvider } from '../../domain/ports/message-provider.port';

interface InputWebhook {
	eventType: string;
	payload: unknown;
	mergeKey: string;
}

interface FileStorageFileAddedPayload {
	data: {
		id: string;
		mime_type: string;
		file_url: string;
		name: string;
		size: number;
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
		if (webhookData.eventType !== 'FileStorageFile.added') {
			this.logger.info(`Unhandled webhook event type: ${webhookData.eventType}`);
			return webhookData.id.toString();
		}

		const payload = webhookData.payload as FileStorageFileAddedPayload;

		const accountId = payload.linked_account.id;
		const connection = await this.connectionsRepositoryPort.findByMergeAccountId(accountId);
		if (!connection) {
			this.logger.info(`No connection found for account ID: ${accountId}`);
			return webhookData.id.toString();
		}

		const metadata: FileMetadata = {
			originalName: payload.data.name,
			mimeType: payload.data.mime_type ?? payload.data.name.split('.').pop() ?? 'application/octet-stream',
			size: payload.data.size,
			uploadedAt: new Date(),
		};

		await this.messageProvider.send({
			accountId,
			metadata,
			size: payload.data.size,
			url: payload.data.file_url,
			fileId: payload.data.id,
			timestamp: new Date().toISOString(),
		});

		// try {
		// 	const storageKey = generateStorageKey(getExtensionFromMimeType(metadata.mimeType as MimeTypeKnownValues));
		// 	const stream = await client.filestorage.files.downloadRetrieve(payload.data.id);
		//
		// 	const r2Stream = new ReadableStream({
		// 		expectedLength: payload.data.size,
		// 		async start(controller) {
		// 			try {
		// 				for await (const chunk of stream) {
		// 					controller.enqueue(chunk);
		// 				}
		// 				controller.close();
		// 			} catch (err) {
		// 				controller.error(err);
		// 				throw err;
		// 			}
		// 		},
		// 		cancel() {
		// 			stream.destroy();
		// 		},
		// 	});
		// 	await this.fileStorage.storeStream(storageKey, r2Stream, metadata.mimeType);
		// 	const fileRecord = FileRecord.create(metadata, storageKey, connection.customerId);
		// 	await this.fileRepository.save(fileRecord);
		// } catch (e) {
		// 	this.logger.error(e as Error);
		// 	return webhookData.id.toString();
		// }

		await this.webhooksRepositoryPort.updateProcessedAt(webhookData.id, new Date());

		return webhookData.id.toString();
	}
}
