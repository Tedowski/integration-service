import { FileRecord } from '../entities/file-record';
import { FileIdVO } from '../value-objects/file-id';

export interface FileRepositoryPort {
	save(fileRecord: FileRecord): Promise<void>;
	findById(id: FileIdVO): Promise<FileRecord | null>;
	findByStorageKey(storageKey: string): Promise<FileRecord | null>;
	delete(id: FileIdVO): Promise<void>;
}
