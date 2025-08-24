import { TransactionPort } from '../../domain/ports/transaction.port';
import { Database } from '../database/connection';

export class DrizzleTransactionAdapter implements TransactionPort {
	constructor(private readonly db: Database) {}

	async execute<T>(operation: () => Promise<T>): Promise<T> {
		return await this.db.transaction(async (tx) => {
			// Note: In a real implementation, you'd want to pass the transaction
			// context to the repositories, but this is simplified for this example
			return await operation();
		});
	}
}
