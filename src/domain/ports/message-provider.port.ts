import { IMergeFileSyncMessage } from '../events/file-sync.message';

export interface IMessageQueuePort<T> {
	send(message: T): Promise<void>;
}

export type IMergeEventQueueProvider = IMessageQueuePort<IMergeFileSyncMessage>;
