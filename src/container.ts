import { createDatabaseConnection } from './infrastructure/database/connection';
import { R2FileStorageAdapter } from './infrastructure/adapters/r2-file-storage.adapter';
import { DrizzleFileRepositoryAdapter } from './infrastructure/adapters/drizzle-file-repository.adapter';
import { DrizzleTransactionAdapter } from './infrastructure/adapters/drizzle-transaction.adapter';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import { FileService } from './application/services/file.service';
import { FileUploadController } from './presentation/controllers/file-upload.controller';

export class Container {
	private instances = new Map<string, any>();

	constructor(private readonly env: Env) {}

	private get<T>(key: string, factory: () => T): T {
		if (!this.instances.has(key)) {
			this.instances.set(key, factory());
		}
		return this.instances.get(key);
	}

	// Infrastructure
	get database() {
		return this.get('database', () => createDatabaseConnection(this.env.DATABASE_URL));
	}

	get fileStorageAdapter() {
		return this.get('fileStorageAdapter', () => new R2FileStorageAdapter(this.env.integration_files));
	}

	get fileRepositoryAdapter() {
		return this.get('fileRepositoryAdapter', () => new DrizzleFileRepositoryAdapter(this.database));
	}

	get transactionAdapter() {
		return this.get('transactionAdapter', () => new DrizzleTransactionAdapter(this.database));
	}

	// Application Services
	get uploadFileUseCase() {
		return this.get('uploadFileUseCase', () => new UploadFileUseCase(this.fileStorageAdapter, this.fileRepositoryAdapter, this.transactionAdapter));
	}

	get fileService() {
		return this.get('fileService', () => new FileService(this.fileRepositoryAdapter, this.fileStorageAdapter));
	}

	// Controllers
	get fileUploadController() {
		return this.get('fileUploadController', () => new FileUploadController(this.uploadFileUseCase));
	}
}
