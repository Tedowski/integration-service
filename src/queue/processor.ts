import { IMergeFileSyncMessage } from '../domain/events/file-sync.message';
import { Container } from '../container';

export async function processQueueMessageBatch(batch: MessageBatch<IMergeFileSyncMessage>, container: Container) {
	for (const msg of batch.messages) {
		const handler = container.downloadMergeFileUseCase;

		await handler.execute(msg.body, container.envVar('MERGE_API_KEY'));
	}
}
