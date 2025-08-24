import { FileStoragePort } from '../../domain/ports/file-storage.port';

export class R2FileStorageAdapter implements FileStoragePort {
	constructor(private readonly bucket: R2Bucket) {}

	async store(key: string, file: File | ArrayBuffer): Promise<void> {
		const body = file instanceof File ? await file.arrayBuffer() : file;
		await this.bucket.put(key, body);
	}

	async retrieve(key: string): Promise<ArrayBuffer> {
		const object = await this.bucket.get(key);
		if (!object) {
			throw new Error(`File not found: ${key}`);
		}
		return await object.arrayBuffer();
	}

	async delete(key: string): Promise<void> {
		await this.bucket.delete(key);
	}

	async exists(key: string): Promise<boolean> {
		const object = await this.bucket.head(key);
		return object !== null;
	}
}
