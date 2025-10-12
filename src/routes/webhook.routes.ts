import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoAppBindings } from '../index';
import { processWebhookRoute } from '../presentation/schemas/process-webhook.schema';
import { getRequestContext } from '../shared/context/request-context';

export function createWebhookRoutes() {
	const app = new OpenAPIHono<HonoAppBindings>();

	app.openapi(processWebhookRoute, async (c) => {
		// TODO: Enable signature verification
		// const isValid = await verifyMergeSignature(c.req.raw, c.env.MERGE_WEBHOOK_SECRET);
		//
		// if (!isValid) {
		// 	return c.json(
		// 		{
		// 			success: false as const,
		// 			error: {
		// 				code: 'INVALID_SIGNATURE',
		// 				message: 'Invalid webhook signature',
		// 				details: 'The provided webhook signature does not match the expected signature.',
		// 			},
		// 		},
		// 		401,
		// 	);
		// }

		const container = c.get('container');
		const context = getRequestContext();

		const validatedData = c.req.valid('json');

		try {
			await container.processWebhookUseCase.execute({
				eventType: validatedData.hook.event,
				payload: validatedData,
			});

			return c.json(
				{
					success: true as const,
					data: {
						message: 'Webhook processed successfully',
					},
				},
				200,
			);
		} catch (e) {
			return c.json(
				{
					success: false as const,
					error: {
						code: 'INTERNAL_ERROR',
						message: e instanceof Error ? e.message : 'An unknown error occurred',
						details: e,
					},
					requestId: context?.requestId,
				},
				500,
			);
		}
	});

	return app;
}
