import { FileRepositoryPort } from '../../domain/ports/file-repository.port';
import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { EntityIdVO } from '../../domain/value-objects/entity-id';

export class FileService {
	constructor(
		private readonly fileRepository: FileRepositoryPort,
		private readonly fileStorage: FileStoragePort,
	) {}

	async getFileInfo(fileId: string) {
		const fileIdVO = EntityIdVO.create(fileId);
		return await this.fileRepository.findById(fileIdVO);
	}

	async deleteFile(fileId: string): Promise<void> {
		const fileIdVO = EntityIdVO.create(fileId);
		const fileRecord = await this.fileRepository.findById(fileIdVO);

		if (!fileRecord) {
			throw new Error('File not found');
		}

		// Delete from storage and database
		await Promise.all([this.fileStorage.delete(fileRecord.storageKey), this.fileRepository.delete(fileIdVO)]);
	}
}
