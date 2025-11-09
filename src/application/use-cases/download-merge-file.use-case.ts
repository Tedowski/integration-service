import { ConnectionsRepositoryPort } from '../../domain/ports/connections-repository.port';
import { MergeClient } from '@mergeapi/merge-node-client';
import { IMergeFileSyncMessage } from '../../domain/events/file-sync.message';
import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { generateStorageKey, getExtensionFromMimeType } from '../../shared/helpers/generateStorageKey';
import { MimeTypeKnownValues } from '../../shared/types';
import { FailedFilesSyncRepositoryPort } from '../../domain/ports/failed-files-sync-repository.port';
import { FailedFileSync } from '../../domain/entities/failed-file-sync';
import { ILogger, LoggerFactory } from '../../logger/logger';
import { ApplicationException, logExceptionAndThrow } from '../../exceptions';
import { FileRepositoryPort } from '../../domain/ports/file-repository.port';
import { FileRecord } from '../../domain/entities/file-record';
import { FileMetadata } from '../../domain/value-objects/file-metadata';

export class DownloadMergeFileUseCase {
	private readonly logger: ILogger;

	constructor(
		private readonly connectionsRepositoryPort: ConnectionsRepositoryPort,
		private readonly fileStorage: FileStoragePort,
		private readonly fileRepository: FileRepositoryPort,
		private readonly failedFilesSyncRepositoryPort: FailedFilesSyncRepositoryPort,
	) {
		this.logger = new LoggerFactory().createLogger(DownloadMergeFileUseCase.name);
	}

	async execute(message: IMergeFileSyncMessage, mergeKey: string): Promise<void> {
		const { accountId, metadata, fileId, size } = message;
		const connection = await this.connectionsRepositoryPort.findByMergeAccountId(accountId);

		const parsedMetadata: FileMetadata = {
			...metadata,
			uploadedAt: new Date(),
		};

		try {
			if (!connection) {
				throw new ApplicationException(`No connection found for account ID: ${accountId}`);
			}

			const client = new MergeClient({
				apiKey: mergeKey,
				environment: 'https://api-eu.merge.dev/api', // TODO: make configurable based on customer region
				accountToken: connection.accountToken,
			});

			const storageKey = generateStorageKey(getExtensionFromMimeType(parsedMetadata.mimeType as MimeTypeKnownValues));
			const stream = await client.filestorage.files.downloadRetrieve(fileId);

			const r2Stream = new ReadableStream({
				expectedLength: size,
				async start(controller) {
					try {
						for await (const chunk of stream) {
							controller.enqueue(chunk);
						}
						controller.close();
					} catch (err) {
						controller.error(err);
						throw err;
					}
				},
				cancel() {
					stream.destroy();
				},
			});
			await this.fileStorage.storeStream(storageKey, r2Stream, parsedMetadata.mimeType);
			const fileRecord = FileRecord.create(parsedMetadata, storageKey, connection.customerId);
			await this.fileRepository.save(fileRecord);
		} catch (e) {
			const reason = this.getErrorReasonMessage(e);

			const previousFailedSync = await this.failedFilesSyncRepositoryPort.getLatestByFileId(message.fileId);
			if (previousFailedSync && previousFailedSync.reason === reason) {
				this.logger.info(`File sync for file ID ${message.fileId} has failed for the same reason in the previous attempt. Skipping duplicate failure record.`);
				return;
			}

			const failedFileSync = FailedFileSync.create({
				fileId: message.fileId,
				accountId: message.accountId,
				reason,
				attemptedAt: new Date(),
			});
			await this.failedFilesSyncRepositoryPort.save(failedFileSync);
			logExceptionAndThrow(this.logger, e);
		}
	}

	private getErrorReasonMessage(error: unknown): string {
		if (error instanceof Error) {
			return error.message;
		}
		if (error instanceof String) {
			return error.toString();
		}
		return 'Unknown error when downloading file from Merge';
	}
}
