import { FailedFilesSyncRepositoryPort } from '../../domain/ports/failed-files-sync-repository.port';
import { FailedFileSync } from '../../domain/entities/failed-file-sync';
import { Database } from '../database/connection';
import { failedMergeFileSyncs } from '../database/schema';

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
}
