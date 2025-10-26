import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import { ErrorResponseSchema } from './shared';

// Constants for validation
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

// Request schema with validation
export const FileUploadRequestSchema = z.object({
	file: z
		.instanceof(File)
		.refine((file) => file.size > 0, {
			message: 'File cannot be empty',
		})
		.refine((file) => file.size <= MAX_FILE_SIZE, { message: 'File size must be less than 1GB' })
		.refine((file) => file.name.length > 0, { message: 'File must have a name' })
		.refine((file) => ALLOWED_MIME_TYPES.some((type) => file.type.startsWith(type.split('/')[0])), { message: 'File must be an image or video' }),
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
		201: {
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
		413: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'File too large (exceeds 1GB)',
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
