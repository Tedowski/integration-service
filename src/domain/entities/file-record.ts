import { EntityIdVO } from '../value-objects/entity-id';
import { FileMetadata } from '../value-objects/file-metadata';

export class FileRecord {
	constructor(
		public readonly id: EntityIdVO,
		public readonly metadata: FileMetadata,
		public readonly storageKey: string,
		public readonly customerId: string,
	) {}

	static create(metadata: FileMetadata, storageKey: string, customerId: string): FileRecord {
		return new FileRecord(EntityIdVO.generate(), metadata, storageKey, customerId);
	}
}
