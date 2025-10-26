import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import { Connector } from '../../shared/helpers/mergeConnectorConfigGetter';
import { ErrorResponseSchema } from './shared';

// Schema for creating a connection attempt
export const CreateConnectionAttemptSchema = z.object({
	customerId: z.uuidv4().describe('ID of the customer making the connection attempt'),
	customerEmail: z.email().describe('Email of the customer'),
	customerOrganizationName: z.string().min(1).describe('Organization name of the customer'),
	connectorType: z.enum(Connector).describe('Type of connector to use for the connection attempt'),
});

export type CreateConnectionAttemptType = z.infer<typeof CreateConnectionAttemptSchema>;

export const CreateConnectionAttemptSuccessResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		customerId: z.uuidv4().describe('ID of the customer making the connection attempt'),
		attemptId: z.string().describe('Connection attempt ID'),
		status: z.string().describe('Connection attempt status'),
		mergeLinkToken: z.string().describe('Token to merge the connection attempt'),
		url: z.string().nullable().describe('URL of the connection attempt'),
	}),
	message: z.string().describe('Success message'),
});

export type CreateConnectionAttemptSuccessResponseType = z.infer<typeof CreateConnectionAttemptSuccessResponseSchema>;

export const createConnectionAttemptRoute = createRoute({
	method: 'post',
	path: '/attempts',
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateConnectionAttemptSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: CreateConnectionAttemptSuccessResponseSchema,
				},
			},
			description: 'Connection attempt created successfully',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Validation error or bad request',
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
	tags: ['Connection Attempts'],
	summary: 'Create a new connection attempt',
	description: 'Initiate a new connection attempt for linking user accounts via third-party connectors',
});
