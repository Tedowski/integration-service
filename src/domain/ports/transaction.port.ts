export interface TransactionPort {
	execute<T>(operation: () => Promise<T>): Promise<T>;
}
