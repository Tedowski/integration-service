import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { MergeClient } from '@mergeapi/merge-node-client';
import { IMergeFileSyncMessage } from '../../domain/events/file-sync.message';
import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { generateStorageKey, getExtensionFromMimeType } from '../../shared/helpers/generateStorageKey';
import { MimeTypeKnownValues } from '../../shared/types';
import { Readable } from 'node:stream';

export class DownloadMergeFileUseCase {
	constructor(
		private readonly connectionsRepositoryPort: ConnectionsRepositoryPort,
		private readonly fileStorage: FileStoragePort,
	) {}

	async execute(message: IMergeFileSyncMessage, mergeKey: string): Promise<void> {
		const { accountId, metadata } = message;
		const connection = await this.connectionsRepositoryPort.findById(EntityIdVO.create(accountId));

		if (!connection) {
			throw new Error(`No connection found for account ID: ${accountId}`);
		}

		const client = new MergeClient({
			apiKey: mergeKey,
			environment: 'https://api-eu.merge.dev/api', // TODO: make configurable based on customer region
			accountToken: connection.accountToken,
		});

		try {
			const storageKey = generateStorageKey(getExtensionFromMimeType(metadata.mimeType as MimeTypeKnownValues));
			const stream = await client.filestorage.files.downloadRetrieve(message.fileId);

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
					console.log(`Stream cancelled for file ID: ${message.fileId}`);
					// Clean up if the stream is cancelled
					stream.destroy();
				},
			});
			await this.fileStorage.storeStream(storageKey, r2Stream, metadata.mimeType);
		} catch (e) {
			// Add item to error repository
			console.log(e);
			throw e;
		}
	}
}
