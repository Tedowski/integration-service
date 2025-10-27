import { IMergeFileSyncMessage } from '../domain/events/file-sync.message';

export async function processQueueMessageBatch(batch: MessageBatch<IMergeFileSyncMessage>, env: Env, ctx: ExecutionContext) {
	for (const msg of batch.messages) {
		const { metadata, url, fileId } = msg.body;

		const client = new MergeClient({});
	}
}
