import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoAppBindings } from '../index';
import { createConnectionAttemptRoute, CreateConnectionAttemptSuccessResponseType } from '../presentation/schemas/create-connection-attempt.schema';
import { getRequestContext } from '../shared/context/request-context';
import { createCustomerConnectionRoute, CreateCustomerConnectionSuccessResponseType } from '../presentation/schemas/create-customer-connection.schema';

export function createConnectionRoutes() {
	const app = new OpenAPIHono<HonoAppBindings>();

	app.openapi(createConnectionAttemptRoute, async (c) => {
		const container = c.get('container');
		const context = getRequestContext();

		const validatedData = c.req.valid('json');

		try {
			const result = await container.createConnectionAttemptUseCase.execute({
				customerId: validatedData.customerId,
				customerOrganizationName: validatedData.customerOrganizationName,
				customerEmail: validatedData.customerEmail,
				connectorType: validatedData.connectorType,
			});
			const response: CreateConnectionAttemptSuccessResponseType['data'] = {
				customerId: result.customerId,
				attemptId: result.attemptId,
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

	app.openapi(createCustomerConnectionRoute, async (c) => {
		const container = c.get('container');
		const context = getRequestContext();

		const validatedData = c.req.valid('json');

		try {
			const result = await container.createCustomerConnectionUseCase.execute({
				attemptId: validatedData.attemptId,
				publicToken: validatedData.publicToken,
			});

			const response: CreateCustomerConnectionSuccessResponseType['data'] = {
				connectionId: result.connectionId,
				accountId: result.accountId,
				createdAt: result.createdAt,
			};
			return c.json(
				{
					success: true as const,
					data: response,
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
