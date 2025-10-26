import { FileMetadata } from '../value-objects/file-metadata';

export class FileStream {
	constructor(
		public readonly stream: ReadableStream,
		public readonly metadata: FileMetadata,
		public readonly etag?: string,
	) {}
}
