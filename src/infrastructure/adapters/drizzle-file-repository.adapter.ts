import { eq } from 'drizzle-orm';
import { FileRepositoryPort } from '../../domain/ports/file-repository.port';
import { FileRecord } from '../../domain/entities/file-record';
import { FileIdVO } from '../../domain/value-objects/file-id';
import { Database } from '../database/connection';
import { fileRecords, FileRecordSchema } from '../database/schema';

export class DrizzleFileRepositoryAdapter implements FileRepositoryPort {
	constructor(private readonly db: Database) {}

	async save(fileRecord: FileRecord): Promise<void> {
		await this.db.insert(fileRecords).values({
			id: fileRecord.id.toString(),
			originalName: fileRecord.metadata.originalName,
			mimeType: fileRecord.metadata.mimeType,
			size: fileRecord.metadata.size,
			storageKey: fileRecord.storageKey,
			userId: fileRecord.userId,
			uploadedAt: fileRecord.metadata.uploadedAt,
		});
	}

	async findById(id: FileIdVO): Promise<FileRecord | null> {
		const result = await this.db.select().from(fileRecords).where(eq(fileRecords.id, id.toString())).limit(1);

		return result[0] ? this.toDomainEntity(result[0]) : null;
	}

	async findByStorageKey(storageKey: string): Promise<FileRecord | null> {
		const result = await this.db.select().from(fileRecords).where(eq(fileRecords.storageKey, storageKey)).limit(1);

		return result[0] ? this.toDomainEntity(result[0]) : null;
	}

	async delete(id: FileIdVO): Promise<void> {
		await this.db.delete(fileRecords).where(eq(fileRecords.id, id.toString()));
	}

	private toDomainEntity(record: FileRecordSchema): FileRecord {
		return new FileRecord(
			FileIdVO.create(record.id),
			{
				originalName: record.originalName,
				mimeType: record.mimeType,
				size: record.size,
				uploadedAt: record.uploadedAt,
			},
			record.storageKey,
			record.userId || undefined,
		);
	}
}
