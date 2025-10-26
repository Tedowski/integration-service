import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import { ErrorResponseSchema } from './shared';

// Path parameter schema
export const FileIdParamSchema = z.object({
	fileId: z.uuid().openapi({
		param: {
			name: 'fileId',
			in: 'path',
		},
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'Unique identifier of the file',
	}),
});

// Query parameter schema for download options
export const FileDownloadQuerySchema = z.object({
	download: z
		.enum(['true', 'false'])
		.optional()
		.default('false')
		.openapi({
			param: {
				name: 'download',
				in: 'query',
			},
			example: 'false',
			description: 'If true, forces file download instead of inline display',
		}),
});

// File metadata response (for JSON endpoints)
export const FileMetadataResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		fileId: z.uuid(),
		storageKey: z.string(),
		originalName: z.string(),
		mimeType: z.string(),
		size: z.number().int().positive(),
		uploadedAt: z.string().datetime(),
	}),
});

// Download/stream file route
export const downloadFileRoute = createRoute({
	method: 'get',
	path: '/{fileId}',
	request: {
		params: FileIdParamSchema,
		query: FileDownloadQuerySchema,
	},
	responses: {
		200: {
			content: {
				'image/*': {
					schema: z.object({}).openapi({
						type: 'string',
						format: 'binary',
					}),
				},
				'video/*': {
					schema: z.object({}).openapi({
						type: 'string',
						format: 'binary',
					}),
				},
			},
			description: 'File streamed successfully',
			headers: z.object({
				'Content-Type': z.string().openapi({
					description: 'MIME type of the file',
					example: 'image/jpeg',
				}),
				'Content-Length': z.string().openapi({
					description: 'Size of the file in bytes',
					example: '1048576',
				}),
				'Content-Disposition': z.string().openapi({
					description: 'How the file should be displayed',
					example: 'inline; filename="photo.jpg"',
				}),
				ETag: z.string().optional().openapi({
					description: 'Entity tag for cache validation',
					example: '"abc123"',
				}),
				'Cache-Control': z.string().optional().openapi({
					description: 'Cache control directives',
					example: 'public, max-age=31536000',
				}),
			}),
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'File not found',
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
	summary: 'Download or stream a file',
	description: 'Retrieve a file by its ID. Use ?download=true to force download instead of inline display.',
});

// Optional: Get file metadata only (no streaming)
export const getFileMetadataRoute = createRoute({
	method: 'get',
	path: '/{fileId}/metadata',
	request: {
		params: FileIdParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: FileMetadataResponseSchema,
				},
			},
			description: 'File metadata retrieved successfully',
		},
		404: {
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
			description: 'File not found',
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
	summary: 'Get file metadata',
	description: 'Retrieve metadata about a file without downloading it',
});
