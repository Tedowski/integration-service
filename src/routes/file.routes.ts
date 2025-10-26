import { uploadFileRawRoute, uploadFileRoute } from '../presentation/schemas/file-upload.schema';
import { getRequestContext } from '../shared/context/request-context';
import { HonoAppBindings } from '../index';
import { OpenAPIHono } from '@hono/zod-openapi';
import { downloadFileRoute, getFileMetadataRoute } from '../presentation/schemas/get-file.schema';
import { EntityIdVO } from '../domain/value-objects/entity-id';
import { FileRecord } from '../domain/entities/file-record';
import { FileMetadata } from '../domain/value-objects/file-metadata';

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

	app.openapi(uploadFileRawRoute, async (c) => {
		const container = c.get('container');
		const context = getRequestContext();

		try {
			// Get content type from header
			const contentType = c.req.header('content-type');
			const fileName = c.req.header('x-file-name') || `upload-${Date.now()}`;

			if (!contentType) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'MISSING_CONTENT_TYPE',
							message: 'Content-Type header is required',
						},
						requestId: context?.requestId,
					},
					400,
				);
			}

			// Validate content type
			const isAllowedType = contentType.startsWith('image/') || contentType.startsWith('video/') || contentType.startsWith('audio/');

			if (!isAllowedType) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'INVALID_FILE_TYPE',
							message: 'Only image, video, and audio files are allowed',
							details: `Provided type: ${contentType}`,
						},
						requestId: context?.requestId,
					},
					400,
				);
			}

			// Get the request body as a stream
			const body = c.req.raw.body;

			if (!body) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'MISSING_BODY',
							message: 'Request body is required',
						},
						requestId: context?.requestId,
					},
					400,
				);
			}

			// Check content-length header for size validation
			const contentLength = c.req.header('content-length');
			const fileSize = contentLength ? parseInt(contentLength) : 0;

			const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
			if (fileSize > MAX_FILE_SIZE) {
				return c.json(
					{
						success: false as const,
						error: {
							code: 'FILE_TOO_LARGE',
							message: 'File size exceeds the maximum limit of 1GB',
							details: `File size: ${fileSize} bytes, Maximum: ${MAX_FILE_SIZE} bytes`,
						},
						requestId: context?.requestId,
					},
					413,
				);
			}

			// Generate unique storage key
			const fileId = EntityIdVO.generate();
			const extension = fileName.split('.').pop() || getExtensionFromMimeType(contentType);
			const storageKey = `${fileId.toString()}.${extension}`;

			// Stream directly to R2
			await container.fileStorageAdapter.storeStream(storageKey, body, contentType);

			const metadata: FileMetadata = {
				originalName: fileName,
				mimeType: extension,
				size: fileSize,
				uploadedAt: new Date(),
			};

			// Create file record
			const fileRecord = FileRecord.create(metadata, storageKey, context?.userId ?? 'anonymous');

			await container.fileRepositoryAdapter.save(fileRecord);

			return c.json(
				{
					success: true as const,
					data: {
						fileId: fileId.toString(),
						storageKey: storageKey,
						metadata: {
							originalName: fileName,
							mimeType: contentType,
							size: fileSize,
							uploadedAt: fileRecord.metadata.uploadedAt.toISOString(),
						},
					},
					message: 'File uploaded successfully',
				},
				201,
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

function getExtensionFromMimeType(mimeType: string): string {
	const mimeToExt: Record<string, string> = {
		'audio/mpeg': 'mp3',
		'audio/mp4': 'm4a',
		'audio/wav': 'wav',
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/gif': 'gif',
		'image/webp': 'webp',
		'video/mp4': 'mp4',
		'video/webm': 'webm',
		'video/quicktime': 'mov',
	};
	return mimeToExt[mimeType] || 'bin';
}
