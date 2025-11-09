import { IMergeFileSyncMessage } from '../domain/events/file-sync.message';
import { Container } from '../container';
import { LoggerFactory } from '../logger/logger';

export async function processQueueMessageBatch(batch: MessageBatch<IMergeFileSyncMessage>, container: Container) {
	for (const msg of batch.messages) {
		const logger = new LoggerFactory().createLogger('QueueProcessor');
		logger.info(`Processing message with id: ${msg.id}`);
		const handler = container.downloadMergeFileUseCase;

		await handler.execute(msg.body, container.envVar('MERGE_API_KEY'));
	}
}
