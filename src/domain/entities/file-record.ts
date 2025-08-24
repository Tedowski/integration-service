import { FileIdVO } from '../value-objects/file-id';
import { FileMetadata } from '../value-objects/file-metadata';

export class FileRecord {
	constructor(
		public readonly id: FileIdVO,
		public readonly metadata: FileMetadata,
		public readonly storageKey: string,
		public readonly userId?: string,
	) {}

	static create(metadata: FileMetadata, storageKey: string, userId?: string): FileRecord {
		return new FileRecord(FileIdVO.generate(), metadata, storageKey, userId);
	}
}
