import { Context, Next } from 'hono';
import { RequestContext, withRequestContext } from '../../shared/context/request-context';

export function requestContextMiddleware() {
	return async (c: Context, next: Next) => {
		const context: RequestContext = {
			requestId: crypto.randomUUID(),
			timestamp: new Date(),
			correlationId: c.req.header('x-correlation-id') || crypto.randomUUID(),
			userId: c.req.header('x-user-id') || undefined,
		};

		// Add context to response headers for debugging
		c.res.headers.set('x-request-id', context.requestId);
		c.res.headers.set('x-correlation-id', context.correlationId);

		return withRequestContext(context, () => next());
	};
}
