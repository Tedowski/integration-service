import { FailedFileSync } from '../entities/failed-file-sync';

export interface FailedFilesSyncRepositoryPort {
	save(entity: FailedFileSync): Promise<void>;
}
