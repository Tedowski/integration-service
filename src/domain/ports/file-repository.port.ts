import { FileRecord } from '../entities/file-record';
import { EntityIdVO } from '../value-objects/entity-id';

export interface FileRepositoryPort {
	save(fileRecord: FileRecord): Promise<void>;
	findById(id: EntityIdVO): Promise<FileRecord | null>;
	findByStorageKey(storageKey: string): Promise<FileRecord | null>;
	delete(id: EntityIdVO): Promise<void>;
}
