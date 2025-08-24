export interface FileStoragePort {
	store(key: string, file: File | ArrayBuffer): Promise<void>;
	retrieve(key: string): Promise<ArrayBuffer>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
}
