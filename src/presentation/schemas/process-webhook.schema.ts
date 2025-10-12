import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

export const ProcessWebhookSchema = z
	.object({
		hook: z.object({
			id: z.string().describe('Unique identifier for the webhook event'),
			event: z.string().describe('Type of the event that triggered the webhook'),
			target: z.string().describe('The target resource of the event'),
		}),
		linked_account: z.any().optional(),
		data: z.any(),
	})
	.loose();

export type ProcessWebhookSchemaType = z.infer<typeof ProcessWebhookSchema>;

export const ProcessWebhookSuccessResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		message: z.string().describe('Success message'),
	}),
});

export type ProcessWebhookSuccessResponseType = z.infer<typeof ProcessWebhookSuccessResponseSchema>;

export const ProcessWebhookErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string().describe('Error code'),
		message: z.string().describe('Error message'),
		details: z.any().optional().describe('Additional error details'),
	}),
	requestId: z.string().optional().describe('Optional request ID for tracing'),
});

export type ProcessWebhookErrorResponseType = z.infer<typeof ProcessWebhookErrorResponseSchema>;

export const processWebhookRoute = createRoute({
	method: 'post',
	path: '/',
	request: {
		body: {
			content: {
				'application/json': {
					schema: ProcessWebhookSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ProcessWebhookSuccessResponseSchema,
				},
			},
			description: 'Successful response indicating the webhook was processed',
		},
		401: {
			content: {
				'application/json': {
					schema: ProcessWebhookErrorResponseSchema,
				},
			},
			description: 'Webhook signature is invalid',
		},
		500: {
			content: {
				'application/json': {
					schema: ProcessWebhookErrorResponseSchema,
				},
			},
			description: 'Server error response indicating an internal error occurred',
		},
	},
});
