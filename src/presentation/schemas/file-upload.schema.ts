import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

// For OpenAPI, we need to define the schema differently for multipart/form-data
export const FileUploadRequestSchema = z.object({
	file: z
		.instanceof(File)
		.refine((file) => file.size > 0, { message: 'File cannot be empty' })
		.refine(
			(file) => file.size <= 10 * 1024 * 1024, // 10MB limit
			{ message: 'File size must be less than 10MB' },
		)
		.refine((file) => file.name.length > 0, { message: 'File must have a name' }),
});

// Success response schema
export const FileUploadSuccessResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		fileId: z.string().uuid(),
		storageKey: z.string(),
		metadata: z.object({
			originalName: z.string(),
			mimeType: z.string(),
			size: z.number(),
			uploadedAt: z.string().datetime(),
		}),
	}),
	message: z.string(),
});

// Error response schema
export const ErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.any().optional(),
	}),
	requestId: z.string().optional(),
});

// OpenAPI route definition with proper request body handling
export const uploadFileRoute = createRoute({
	method: 'post',
	path: '/upload', // Changed from '/files/upload' to '/upload'
	request: {
		body: {
			content: {
				'multipart/form-data': {
					schema: z.object({
						file: z.instanceof(File).openapi({
							type: 'string',
							format: 'binary',
							description: 'File to upload (max 10MB)',
						}),
					}),
				},
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: FileUploadSuccessResponseSchema,
				},
			},
			description: 'File uploaded successfully',
		},
		400: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'Validation error or missing file',
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
	tags: ['Files'],
	summary: 'Upload a file',
	description: 'Upload a file to R2 storage and create a database record',
});
