import { CustomerConnection } from '../entities/customer-connection';

export interface MergeFilesPort {
	list(entity: CustomerConnection): Promise<void>;
}
