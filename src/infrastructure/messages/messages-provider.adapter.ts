import { IMergeEventQueueProvider } from '../../domain/ports/message-provider.port';
import { IMergeFileSyncMessage } from '../../domain/events/file-sync.message';

export class MergeEventQueueProvider implements IMergeEventQueueProvider {
	constructor(private readonly queue: Queue) {}

	async send(message: IMergeFileSyncMessage): Promise<void> {
		await this.queue.send(message);
	}
}
