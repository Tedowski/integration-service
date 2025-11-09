import { FileMetadata } from '../value-objects/file-metadata';

export interface IMergeFileSyncMessage {
	accountId: string;
	fileId: string;
	url: string;
	size: number;
	metadata: FileMetadata;
	timestamp: string;
}
