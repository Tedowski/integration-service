import { uploadFileRoute } from '../presentation/schemas/file-upload.schema';
import { getRequestContext } from '../shared/context/request-context';
import { HonoAppBindings } from '../index';
import { OpenAPIHono } from '@hono/zod-openapi';
import { downloadFileRoute, getFileMetadataRoute } from '../presentation/schemas/get-file.schema';

export function createFileRoutes() {
	const app = new OpenAPIHono<HonoAppBindings>();

	// Upload endpoint
	app.openapi(uploadFileRoute, async (c) => {
		const container = c.get('container');
		const context = getRequestContext();

		try {
			let file: File | undefined;

			try {
				const validatedData = c.req.valid('form');
				file = validatedData.file;
			} catch (validationError) {
				console.log('Validation failed, trying parseBody:', validationError);
				const body = await c.req.parseBody();
				file = body.file as File;
			}

			if (!file) {
				console.log('No file found in request');
				return c.json(
					{
						success: false as const,
						error: {
							code: 'MISSING_FILE',
							message: 'No file provided',
						},
						requestId: context?.requestId,
					},
					400,
				);
			}

			// Check file size for 413 error
			const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
			if (file.size > MAX_FILE_SIZE) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'FILE_TOO_LARGE',
							message: 'File size exceeds the maximum limit of 1GB',
							details: `File size: ${file.size} bytes, Maximum: ${MAX_FILE_SIZE} bytes`,
						},
						requestId: context?.requestId,
					},
					413,
				);
			}

			// Check file type
			const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/');
			if (!isImageOrVideo) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'INVALID_FILE_TYPE',
							message: 'Only image and video files are allowed',
							details: `Provided type: ${file.type}`,
						},
						requestId: context?.requestId,
					},
					400,
				);
			}

			const result = await container.uploadFileUseCase.execute({
				file,
				originalName: file.name,
				mimeType: file.type || 'application/octet-stream',
			});

			return c.json(
				{
					success: true as const,
					data: {
						fileId: result.fileId,
						storageKey: result.storageKey,
						metadata: {
							originalName: result.metadata.originalName,
							mimeType: result.metadata.mimeType,
							size: result.metadata.size,
							uploadedAt: result.metadata.uploadedAt.toISOString(),
						},
					},
					message: 'File uploaded successfully',
				},
				201, // Changed from 200 to 201 (Created)
			);
		} catch (error) {
			console.error('Upload error:', error);
			return c.json(
				{
					success: false as const,
					error: {
						code: 'UPLOAD_FAILED',
						message: 'Failed to upload file',
						details: error instanceof Error ? error.message : 'Unknown error',
					},
					requestId: context?.requestId,
				},
				500,
			);
		}
	});

	// Download/stream file endpoint
	app.openapi(downloadFileRoute, async (c) => {
		const container = c.get('container');
		const context = getRequestContext();

		try {
			const { fileId } = c.req.valid('param');
			const { download } = c.req.valid('query');

			// Retrieve file using your use case or repository
			const result = await container.downloadFileUseCase.execute({ fileId });

			if (!result) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'FILE_NOT_FOUND',
							message: 'File not found',
							details: `No file found with ID: ${fileId}`,
						},
						requestId: context?.requestId,
					},
					404,
				);
			}

			// Set response headers
			const headers = new Headers();
			headers.set('Content-Type', result.metadata.mimeType);
			headers.set('Content-Length', result.metadata.size.toString());

			// Handle content disposition
			const encodedFilename = encodeURIComponent(result.metadata.originalName);
			const disposition = download === 'true' ? 'attachment' : 'inline';
			headers.set('Content-Disposition', `${disposition}; filename="${result.metadata.originalName}"; filename*=UTF-8''${encodedFilename}`);

			// Optional: Add caching headers
			if (result.etag) {
				headers.set('ETag', result.etag);
			}
			headers.set('Cache-Control', 'public, max-age=31536000');

			// Stream the file
			return new Response(result.stream, {
				headers,
				status: 200,
			});
		} catch (error) {
			console.error('Download error:', error);
			return c.json(
				{
					success: false as const,
					error: {
						code: 'DOWNLOAD_FAILED',
						message: 'Failed to download file',
						details: error instanceof Error ? error.message : 'Unknown error',
					},
					requestId: context?.requestId,
				},
				500,
			);
		}
	});

	// Get file metadata endpoint (optional but useful)
	app.openapi(getFileMetadataRoute, async (c) => {
		const container = c.get('container');
		const context = getRequestContext();

		try {
			const { fileId } = c.req.valid('param');

			// Retrieve file metadata using your repository
			const fileRecord = await container.getFileMetadataUseCase.execute({ fileId });

			if (!fileRecord) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'FILE_NOT_FOUND',
							message: 'File not found',
							details: `No file found with ID: ${fileId}`,
						},
						requestId: context?.requestId,
					},
					404,
				);
			}

			return c.json(
				{
					success: true as const,
					data: {
						fileId: fileRecord.id.toString(),
						storageKey: fileRecord.storageKey,
						originalName: fileRecord.metadata.originalName,
						mimeType: fileRecord.metadata.mimeType,
						size: fileRecord.metadata.size,
						uploadedAt: fileRecord.metadata.uploadedAt.toISOString(),
					},
				},
				200,
			);
		} catch (error) {
			console.error('Metadata retrieval error:', error);
			return c.json(
				{
					success: false as const,
					error: {
						code: 'METADATA_RETRIEVAL_FAILED',
						message: 'Failed to retrieve file metadata',
						details: error instanceof Error ? error.message : 'Unknown error',
					},
					requestId: context?.requestId,
				},
				500,
			);
		}
	});

	return app;
}
