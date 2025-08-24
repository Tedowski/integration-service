import { Context } from 'hono';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { getRequestContext } from '../../shared/context/request-context';

export class FileUploadController {
	constructor(private readonly uploadFileUseCase: UploadFileUseCase) {}

	async upload(c: Context) {
		const context = getRequestContext();

		try {
			// OpenAPI handles validation automatically, so we can get the validated data directly
			const body = await c.req.parseBody();
			const file = body.file as File;

			if (!file) {
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

			const result = await this.uploadFileUseCase.execute({
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
	}
}
