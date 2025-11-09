import { FailedFilesSyncRepositoryPort } from '../../domain/ports/failed-files-sync-repository.port';
import { FailedFileSync } from '../../domain/entities/failed-file-sync';
import { Database } from '../database/connection';
import { failedMergeFileSyncs, FailedMergeFileSyncSchema } from '../database/schema';
import { desc, eq } from 'drizzle-orm';
import { EntityIdVO } from '../../domain/value-objects/entity-id';

export class FailedFilesSyncRepositoryAdapter implements FailedFilesSyncRepositoryPort {
	constructor(private readonly db: Database) {}

	async save(entity: FailedFileSync): Promise<void> {
		await this.db.insert(failedMergeFileSyncs).values({
			id: entity.id.toString(),
			fileId: entity.fileId,
			accountId: entity.accountId,
			reason: entity.reason,
			attemptedAt: entity.attemptedAt,
		});
	}

	async getLatestByFileId(fileId: string): Promise<FailedFileSync | null> {
		const result = await this.db.select().from(failedMergeFileSyncs).where(eq(failedMergeFileSyncs.fileId, fileId)).orderBy(desc(failedMergeFileSyncs.attemptedAt)).limit(1);

		return result[0] ? this.toDomainEntity(result[0]) : null;
	}

	private toDomainEntity(record: FailedMergeFileSyncSchema): FailedFileSync {
		return new FailedFileSync(EntityIdVO.create(record.id), record.fileId, record.accountId, record.reason, record.attemptedAt);
	}
}
