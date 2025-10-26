import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import { ErrorResponseSchema } from './shared';

export const CreateCustomerConnectionSchema = z.object({
	attemptId: z.string().describe('Optional ID of the connection attempt'),
	publicToken: z.string().describe('Public token provided by the connector'),
});

export type CreateCustomerConnectionType = z.infer<typeof CreateCustomerConnectionSchema>;

export const CreateCustomerConnectionSuccessResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		connectionId: z.string().describe('Connection ID'),
		accountId: z.string().describe('ID of the connected account'),
		createdAt: z.string().describe('Timestamp when the connection was created'),
	}),
});

export type CreateCustomerConnectionSuccessResponseType = z.infer<typeof CreateCustomerConnectionSuccessResponseSchema>;

export const createCustomerConnectionRoute = createRoute({
	method: 'post',
	path: '/',
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateCustomerConnectionSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: CreateCustomerConnectionSuccessResponseSchema,
				},
			},
			description: 'Successful response with connection details',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Bad request due to invalid input',
		},
		500: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Internal server error',
		},
	},
	tags: ['Customer Connections'],
	summary: 'Create a new customer connection',
	description: 'Create a new customer connection',
});
