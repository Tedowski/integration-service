import { AsyncLocalStorage } from 'async_hooks';

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
	return requestContextStorage.getStore();
}

export function withRequestContext<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
	return requestContextStorage.run(context, fn);
}

export interface RequestContext {
	requestId: string;
	timestamp: Date;
	userId?: string;
	correlationId: string;
}
