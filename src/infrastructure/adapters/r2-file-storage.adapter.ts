import { FileStoragePort } from '../../domain/ports/file-storage.port';

export class R2FileStorageAdapter implements FileStoragePort {
	constructor(private readonly bucket: R2Bucket) {}

	async store(key: string, file: File | ArrayBuffer): Promise<void> {
		const body = file instanceof File ? await file.arrayBuffer() : file;
		await this.bucket.put(key, body);
	}

	async storeStream(key: string, stream: ReadableStream, contentType?: string): Promise<void> {
		await this.bucket.put(key, stream, { httpMetadata: { contentType: contentType ?? 'application/octet-stream' } });
	}

	async retrieve(key: string): Promise<ArrayBuffer> {
		const object = await this.bucket.get(key);
		if (!object) {
			throw new Error(`File not found: ${key}`);
		}
		return await object.arrayBuffer();
	}

	async retrieveStream(key: string): Promise<R2ObjectBody | null> {
		return this.bucket.get(key);
	}

	async delete(key: string): Promise<void> {
		await this.bucket.delete(key);
	}

	async exists(key: string): Promise<boolean> {
		const object = await this.bucket.head(key);
		return object !== null;
	}
}
