import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoAppBindings } from '../index';
import { createConnectionAttemptRoute, CreateConnectionAttemptSuccessResponseType } from '../presentation/schemas/create-connection-attempt.schema';
import { getRequestContext } from '../shared/context/request-context';

export function createConnectionRoutes() {
	const app = new OpenAPIHono<HonoAppBindings>();

	app.openapi(createConnectionAttemptRoute, async (c) => {
		const container = c.get('container');
		const context = getRequestContext();

		const validatedData = c.req.valid('json');
		console.log(validatedData);

		try {
			const result = await container.createConnectionAttemptUseCase.execute({
				customerId: validatedData.customerId,
				customerOrganizationName: validatedData.customerOrganizationName,
				customerEmail: validatedData.customerEmail,
				connectorType: validatedData.connectorType,
			});
			const response: CreateConnectionAttemptSuccessResponseType['data'] = {
				customerId: result.customerId,
				customerOrganizationName: result.customerOrganizationName,
				customerEmail: result.customerEmail,
				connectorType: result.connectorType,
				status: result.status,
				mergeLinkToken: result.mergeLinkToken,
				url: result.url,
			};
			return c.json(
				{
					success: true as const,
					data: response,
					message: 'Connection attempt created successfully (mock)',
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
