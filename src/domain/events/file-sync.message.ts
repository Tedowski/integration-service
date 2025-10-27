import { FileMetadata } from '../value-objects/file-metadata';

export interface IMergeFileSyncMessage {
	accountId: string;
	fileId: string;
	url: string;
	metadata: FileMetadata;
	timestamp: string;
}
