import { WebhooksRepositoryPort } from '../../domain/ports/webhooks-repository.port';
import { MergeWebhookEvent } from '../../domain/entities/merge-webhook-event';
import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { MergeClient } from '@mergeapi/merge-node-client';
import { FileMetadata } from '../../domain/value-objects/file-metadata';
import { ILogger, LoggerFactory } from '../../logger/logger';
import { generateStorageKey, getExtensionFromMimeType } from '../../shared/helpers/generateStorageKey';
import { MimeTypeKnownValues } from '../../shared/types';
import { Readable } from 'node:stream';
import { FileStoragePort } from '../../domain/ports/file-storage.port';

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
		private readonly fileStorage: FileStoragePort,
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

		const client = new MergeClient({
			apiKey: request.mergeKey,
			environment: 'https://api-eu.merge.dev/api', // TODO: make configurable based on customer region
			accountToken: connection.accountToken,
		});

		// for (const result of files.results) {
		// 	if (!result.fileUrl) {
		// 		this.logger.info(`File result has no file URL, skipping. File ID: ${result.id}`);
		// 		continue;
		// 	}
		//
		// 	const metadata: FileMetadata = {
		// 		originalName: result.name ?? result.fileUrl,
		// 		mimeType: result.mimeType ?? result.fileUrl.split('.').pop() ?? 'application/octet-stream',
		// 		size: result.size!,
		// 		uploadedAt: new Date(),
		// 	};
		//
		// 	await this.messageProvider.send({
		// 		accountId,
		// 		metadata,
		// 		url: result.fileUrl,
		// 		fileId: result.id!,
		// 		timestamp: new Date().toISOString(),
		// 	});
		// }

		// TODO: Handle in messages consumer - THIS is only a POC for dev
		try {
			const storageKey = generateStorageKey(getExtensionFromMimeType(metadata.mimeType as MimeTypeKnownValues));
			const stream = await client.filestorage.files.downloadRetrieve(payload.data.id);

			const webStream = Readable.toWeb(stream);

			const r2Stream = new ReadableStream({
				async start(controller) {
					const reader = webStream.getReader();
					try {
						while (true) {
							// eslint-disable-next-line @typescript-eslint/naming-convention
							const { done, value } = await reader.read();
							if (done) break;
							controller.enqueue(value);
						}
						controller.close();
					} catch (err) {
						controller.error(err);
						reader.releaseLock();
						throw err;
					}
				},
				cancel() {
					console.log(`Stream cancelled for file ID: ${payload.data.id}`);
					// Clean up if the stream is cancelled
					stream.destroy();
				},
			});
			await this.fileStorage.storeStream(storageKey, r2Stream, metadata.mimeType);
		} catch (e) {
			this.logger.error(e as Error);
			return webhookData.id.toString();
		}

		await this.webhooksRepositoryPort.updateProcessedAt(webhookData.id, new Date());

		return webhookData.id.toString();
	}
}
