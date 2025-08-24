import { Context, Next } from 'hono';
import { z } from 'zod';
import { getRequestContext } from '../../shared/context/request-context';

export function validationMiddleware<T>(schema: z.ZodSchema<T>) {
	return async (c: Context, next: Next) => {
		try {
			const body = await c.req.parseBody();
			const validated = schema.parse(body);
			c.set('validatedData', validated);
			await next();
		} catch (error) {
			const context = getRequestContext();

			if (error instanceof z.ZodError) {
				return c.json(
					{
						success: false,
						error: {
							code: 'VALIDATION_ERROR',
							message: 'Invalid request data',
							details: JSON.parse(error.message),
						},
						requestId: context?.requestId,
					},
					400,
				);
			}

			return c.json(
				{
					success: false,
					error: {
						code: 'INTERNAL_ERROR',
						message: 'An unexpected error occurred',
					},
					requestId: context?.requestId,
				},
				500,
			);
		}
	};
}
