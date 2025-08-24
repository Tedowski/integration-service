import { uploadFileRoute } from '../presentation/schemas/file-upload.schema';
import { getRequestContext } from '../shared/context/request-context';
import { HonoAppBindings } from '../index';
import { OpenAPIHono } from '@hono/zod-openapi';

export function createFileRoutes() {
	const app = new OpenAPIHono<HonoAppBindings>();

	app.openapi(uploadFileRoute, async (c) => {
		console.log('Upload endpoint called');
		console.log('Request method:', c.req.method);
		console.log('Request headers:', Object.fromEntries(c.req.raw.headers));

		const container = c.get('container');
		const context = getRequestContext();

		try {
			console.log('Parsing form data...');

			// Try both approaches to get the file
			let file: File | undefined;

			try {
				const validatedData = c.req.valid('form');
				file = validatedData.file;
				console.log('Got file from c.req.valid:', file?.name, file?.size);
			} catch (validationError) {
				console.log('Validation failed, trying parseBody:', validationError);
				const body = await c.req.parseBody();
				file = body.file as File;
				console.log('Got file from parseBody:', file?.name, file?.size);
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

			console.log('Processing file upload:', {
				name: file.name,
				size: file.size,
				type: file.type,
			});

			const result = await container.uploadFileUseCase.execute({
				file,
				originalName: file.name,
				mimeType: file.type || 'application/octet-stream',
			});

			console.log('Upload successful:', result.fileId);

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
				200,
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

	return app;
}
