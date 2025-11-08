import { createDatabaseConnection } from './infrastructure/database/connection';
import { R2FileStorageAdapter } from './infrastructure/adapters/r2-file-storage.adapter';
import { DrizzleFileRepositoryAdapter } from './infrastructure/adapters/drizzle-file-repository.adapter';
import { DrizzleTransactionAdapter } from './infrastructure/adapters/drizzle-transaction.adapter';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import { FileService } from './application/services/file.service';
import { FileUploadController } from './presentation/controllers/file-upload.controller';
import { DrizzleConnectionsRepositoryAdapter } from './infrastructure/adapters/drizzle-connections-repository.adapter';
import { MergeLinkClientAdapter } from './infrastructure/adapters/merge-link-client.adapter';
import { CreateConnectionAttemptUseCase } from './application/use-cases/create-connection-attempt.use-case';
import { DrizzleConnectionAttemptsRepositoryAdapter } from './infrastructure/adapters/drizzle-connection-attempts-repository.adapter';
import { CreateConnectionUseCase } from './application/use-cases/create-connection.use-case';
import { DrizzleWebhooksRepositoryAdapter } from './infrastructure/adapters/drizzle-webhooks-repository.adapter';
import { ProcessWebhookUseCase } from './application/use-cases/process-webhook.use-case';
import { DownloadFileUseCase } from './application/use-cases/download-file.use-case';
import { GetFileMetadataUseCase } from './application/use-cases/get-file-metadata.use-case';
import { UploadFileRawUseCase } from './application/use-cases/upload-raw-file.use-case';
import { MergeEventQueueProvider } from './infrastructure/messages/messages-provider.adapter';
import { DownloadMergeFileUseCase } from './application/use-cases/download-merge-file.use-case';

export class Container {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private instances = new Map<string, any>();

	constructor(private readonly env: Env) {}

	private get<T>(key: string, factory: () => T): T {
		if (!this.instances.has(key)) {
			this.instances.set(key, factory());
		}
		return this.instances.get(key);
	}

	public envVar(name: keyof Omit<Env, 'integration_files' | 'MERGE_EVENTS_QUEUE' | 'BATCH_COORDINATOR'>): string {
		return this.env[name];
	}

	// Infrastructure
	get database() {
		return this.get('database', () => createDatabaseConnection(this.env.DATABASE_URL));
	}

	get mergeEventsQueue() {
		return this.get('mergeEventsQueue', () => this.env.MERGE_EVENTS_QUEUE);
	}

	get fileStorageAdapter() {
		return this.get('fileStorageAdapter', () => new R2FileStorageAdapter(this.env.integration_files));
	}

	get fileRepositoryAdapter() {
		return this.get('fileRepositoryAdapter', () => new DrizzleFileRepositoryAdapter(this.database));
	}

	get connectionRepositoryAdapter() {
		return this.get('connectionRepositoryAdapter', () => new DrizzleConnectionsRepositoryAdapter(this.database));
	}

	get connectionAttemptRepositoryAdapter() {
		return this.get('connectionAttemptRepositoryAdapter', () => new DrizzleConnectionAttemptsRepositoryAdapter(this.database));
	}

	get mergeLinkAdapter() {
		return this.get('mergeLinkAdapter', () => new MergeLinkClientAdapter({ apiKey: this.env.MERGE_API_KEY }));
	}

	get transactionAdapter() {
		return this.get('transactionAdapter', () => new DrizzleTransactionAdapter(this.database));
	}

	get webhookAdapter() {
		return this.get('webhookAdapter', () => new DrizzleWebhooksRepositoryAdapter(this.database));
	}

	// infrastructure - messages
	get mergeEventMessagesProvider() {
		return this.get('mergeEventMessagesProvider', () => new MergeEventQueueProvider(this.mergeEventsQueue));
	}

	// Use cases
	get uploadFileUseCase() {
		return this.get('uploadFileUseCase', () => new UploadFileUseCase(this.fileStorageAdapter, this.fileRepositoryAdapter, this.transactionAdapter));
	}

	get uploadFileRawUseCase() {
		return this.get('uploadFileRawUseCase', () => new UploadFileRawUseCase(this.fileStorageAdapter, this.fileRepositoryAdapter, this.transactionAdapter));
	}

	get createConnectionAttemptUseCase() {
		return this.get('createConnectionAttemptUseCase', () => new CreateConnectionAttemptUseCase(this.connectionAttemptRepositoryAdapter, this.mergeLinkAdapter));
	}

	get createCustomerConnectionUseCase() {
		return this.get(
			'createCustomerConnectionUseCase',
			() => new CreateConnectionUseCase(this.connectionAttemptRepositoryAdapter, this.connectionRepositoryAdapter, this.mergeLinkAdapter),
		);
	}

	get processWebhookUseCase() {
		return this.get('processWebhookUseCase', () => new ProcessWebhookUseCase(this.webhookAdapter, this.connectionRepositoryAdapter, this.mergeEventMessagesProvider));
	}

	get downloadFileUseCase() {
		return this.get('downloadFileUseCase', () => new DownloadFileUseCase(this.fileStorageAdapter, this.fileRepositoryAdapter));
	}

	get getFileMetadataUseCase() {
		return this.get('getFileMetadataUseCase', () => new GetFileMetadataUseCase(this.fileRepositoryAdapter));
	}

	get downloadMergeFileUseCase() {
		return this.get('downloadMergeFileUseCase', () => new DownloadMergeFileUseCase(this.connectionRepositoryAdapter, this.fileStorageAdapter));
	}

	// Services
	get fileService() {
		return this.get('fileService', () => new FileService(this.fileRepositoryAdapter, this.fileStorageAdapter));
	}

	// Controllers
	get fileUploadController() {
		return this.get('fileUploadController', () => new FileUploadController(this.uploadFileUseCase));
	}
}
