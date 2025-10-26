import { FileRepositoryPort } from '../../domain/ports/file-repository.port';
import { EntityIdVO } from '../../domain/value-objects/entity-id';
import { FileRecord } from '../../domain/entities/file-record';

interface DownloadFileRequest {
	fileId: string;
}

export class GetFileMetadataUseCase {
	constructor(private readonly fileRepository: FileRepositoryPort) {}

	public async execute({ fileId }: DownloadFileRequest): Promise<FileRecord | null> {
		const entityId = EntityIdVO.create(fileId);
		const fileRecord = await this.fileRepository.findById(entityId);

		if (!fileRecord) {
			return null;
		}

		return fileRecord;
	}
}
