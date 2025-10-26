import { FileRecord } from '../../domain/entities/file-record';
import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { FileRepositoryPort } from '../../domain/ports/file-repository.port';
import { TransactionPort } from '../../domain/ports/transaction.port';
import { FileMetadata } from '../../domain/value-objects/file-metadata';
import { getRequestContext } from '../../shared/context/request-context';

export interface UploadRawFileRequest {
	stream: ReadableStream;
	size: number;
	originalName: string;
	mimeType: string;
}

export interface UploadRawFileResponse {
	fileId: string;
	storageKey: string;
	metadata: FileMetadata;
}

export class UploadFileRawUseCase {
	constructor(
		private readonly fileStorage: FileStoragePort,
		private readonly fileRepository: FileRepositoryPort,
		private readonly transaction: TransactionPort,
	) {}

	async execute(request: UploadRawFileRequest): Promise<UploadRawFileResponse> {
		const context = getRequestContext();

		// Create file metadata
		const metadata: FileMetadata = {
			originalName: request.originalName,
			mimeType: request.mimeType,
			size: request.size,
			uploadedAt: new Date(),
		};

		// Generate storage key with context
		const storageKey = this.generateStorageKey(request.mimeType, context?.requestId);

		// Create domain entity
		const fileRecord = FileRecord.create(metadata, storageKey, context?.userId ?? 'anonymous'); // TODO: Handle make userId mandatory

		// Execute in transaction to ensure consistency
		await this.transaction.execute(async () => {
			// Store file in R2
			await this.fileStorage.storeStream(storageKey, request.stream, metadata.mimeType);

			// Save record in database
			await this.fileRepository.save(fileRecord);
		});

		return {
			fileId: fileRecord.id.toString(),
			storageKey: storageKey,
			metadata: metadata,
		};
	}

	private generateStorageKey(mimeType: string, requestId?: string): string {
		const timestamp = new Date().toISOString().split('T')[0];
		const fileExtension = this.getExtensionFromMimeType(mimeType);
		const uniqueId = requestId || crypto.randomUUID();

		return `uploads/${timestamp}/${uniqueId}.${fileExtension}`;
	}

	private getExtensionFromMimeType(mimeType: string): string {
		const mimeToExt: Record<string, string> = {
			'audio/mpeg': 'mp3',
			'audio/mp4': 'm4a',
			'audio/wav': 'wav',
			'image/jpeg': 'jpg',
			'image/png': 'png',
			'image/gif': 'gif',
			'image/webp': 'webp',
			'video/mp4': 'mp4',
			'video/webm': 'webm',
			'video/quicktime': 'mov',
		};
		return mimeToExt[mimeType] || 'bin';
	}
}
