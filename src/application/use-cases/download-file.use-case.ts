import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { FileRepositoryPort } from '../../domain/ports/file-repository.port';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { FileStream } from '../../domain/entities/file-stream';

interface DownloadFileRequest {
	fileId: string;
}

export class DownloadFileUseCase {
	constructor(
		private readonly fileStorage: FileStoragePort,
		private readonly fileRepository: FileRepositoryPort,
	) {}

	public async execute({ fileId }: DownloadFileRequest): Promise<FileStream | null> {
		const entityId = EntityIdVO.create(fileId);
		const fileRecord = await this.fileRepository.findById(entityId);

		if (!fileRecord) {
			return null;
		}

		const r2Object = await this.fileStorage.retrieveStream(fileRecord.storageKey);

		if (!r2Object) {
			return null;
		}

		return new FileStream(
			r2Object.body, // Extract just the stream
			fileRecord.metadata,
			r2Object.etag,
		);
	}
}
