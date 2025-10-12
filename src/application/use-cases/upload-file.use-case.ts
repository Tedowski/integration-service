import { FileRecord } from '../../domain/entities/file-record';
import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { FileRepositoryPort } from '../../domain/ports/file-repository.port';
import { TransactionPort } from '../../domain/ports/transaction.port';
import { FileMetadata } from '../../domain/value-objects/file-metadata';
import { getRequestContext } from '../../shared/context/request-context';

export interface UploadFileRequest {
	file: File;
	originalName: string;
	mimeType: string;
}

export interface UploadFileResponse {
	fileId: string;
	storageKey: string;
	metadata: FileMetadata;
}

export class UploadFileUseCase {
	constructor(
		private readonly fileStorage: FileStoragePort,
		private readonly fileRepository: FileRepositoryPort,
		private readonly transaction: TransactionPort,
	) {}

	async execute(request: UploadFileRequest): Promise<UploadFileResponse> {
		const context = getRequestContext();

		// Create file metadata
		const metadata: FileMetadata = {
			originalName: request.originalName,
			mimeType: request.mimeType,
			size: request.file.size,
			uploadedAt: new Date(),
		};

		// Generate storage key with context
		const storageKey = this.generateStorageKey(request.originalName, context?.requestId);

		// Create domain entity
		const fileRecord = FileRecord.create(metadata, storageKey, context?.userId ?? 'anonymous'); // TODO: Handle make userId mandatory

		// Execute in transaction to ensure consistency
		await this.transaction.execute(async () => {
			// Store file in R2
			await this.fileStorage.store(storageKey, request.file);

			// Save record in database
			await this.fileRepository.save(fileRecord);
		});

		return {
			fileId: fileRecord.id.toString(),
			storageKey: storageKey,
			metadata: metadata,
		};
	}

	private generateStorageKey(originalName: string, requestId?: string): string {
		const timestamp = new Date().toISOString().split('T')[0];
		const fileExtension = originalName.split('.').pop() || '';
		const uniqueId = requestId || crypto.randomUUID();

		return `uploads/${timestamp}/${uniqueId}.${fileExtension}`;
	}
}
