export interface FileStoragePort {
	store(key: string, file: File | ArrayBuffer): Promise<void>;
	storeStream(key: string, stream: ReadableStream, contentType?: string): Promise<void>;
	retrieve(key: string): Promise<ArrayBuffer>;
	retrieveStream(key: string): Promise<R2ObjectBody | null>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
}
