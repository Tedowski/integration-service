import { MimeTypeKnownValues } from '../types';

export const generateStorageKey = (fileExtension: string, requestId?: string): string => {
	const uniqueId = requestId || crypto.randomUUID();

	return `uploads/${uniqueId}/file.${fileExtension}`;
};

export const getExtensionFromMimeType = (mimeType: MimeTypeKnownValues): string => {
	const mimeToExt: Record<MimeTypeKnownValues, string> = {
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
		'video/x-matroska': 'mkv',
		'document/pdf': 'pdf',
		'text/plain': 'txt',
		'text/csv': 'csv',
		'text/html': 'html',
		'text/xml': 'xml',
		'application/msword': 'doc',
		'application/vnd.ms-excel': 'xls',
		'application/vnd.ms-powerpoint': 'ppt',
		'application/pdf': 'pdf',
		'application/zip': 'zip',
		'application/json': 'json',
		'application/octet-stream': 'bin',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
	};
	return mimeToExt[mimeType] || 'bin';
};
