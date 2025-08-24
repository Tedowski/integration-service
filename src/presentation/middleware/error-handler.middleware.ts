import { Context, Next } from 'hono';
import { getRequestContext } from '../../shared/context/request-context';

export function errorHandlerMiddleware() {
	return async (c: Context, next: Next) => {
		try {
			await next();
		} catch (error) {
			const context = getRequestContext();

			console.error('Unhandled error:', {
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
				requestId: context?.requestId,
				path: c.req.path,
				method: c.req.method,
			});

			return c.json(
				{
					success: false,
					error: {
						code: 'INTERNAL_ERROR',
						message: 'An internal server error occurred',
					},
					requestId: context?.requestId,
				},
				500,
			);
		}
	};
}
