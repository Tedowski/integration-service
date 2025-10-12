import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

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

export const CreateCustomerConnectionErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string().describe('Error code'),
		message: z.string().describe('Error message'),
		details: z.any().optional().describe('Additional error details'),
	}),
	requestId: z.string().optional().describe('Optional request ID for tracing'),
});

export type CreateCustomerConnectionErrorResponseType = z.infer<typeof CreateCustomerConnectionErrorResponseSchema>;

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
					schema: CreateCustomerConnectionErrorResponseSchema,
				},
			},
			description: 'Bad request due to invalid input',
		},
		500: {
			content: {
				'application/json': {
					schema: CreateCustomerConnectionErrorResponseSchema,
				},
			},
			description: 'Internal server error',
		},
	},
	tags: ['Customer Connections'],
	summary: 'Create a new customer connection',
	description: 'Create a new customer connection',
});
