export interface HonoVariables {
	container: import('../../container').Container;
	validatedData: unknown;
}

export enum MimeTypeKnownValues {
	AUDIO_MPEG = 'audio/mpeg',
	AUDIO_MP4 = 'audio/mp4',
	AUDIO_WAV = 'audio/wav',
	IMAGE_JPEG = 'image/jpeg',
	IMAGE_PNG = 'image/png',
	IMAGE_GIF = 'image/gif',
	IMAGE_WEBP = 'image/webp',
	VIDEO_MP4 = 'video/mp4',
	VIDEO_WEBM = 'video/webm',
	VIDEO_QUICKTIME = 'video/quicktime',
	VIDEO_MKV = 'video/x-matroska',
	DOCUMENT_PDF = 'document/pdf',
	TEXT_PLAIN = 'text/plain',
	TEXT_CSV = 'text/csv',
	TEXT_HTML = 'text/html',
	TEXT_XML = 'text/xml',
	APPLICATION_MSDOC = 'application/msword',
	APPLICATION_VND_EXCEL = 'application/vnd.ms-excel',
	APPLICATION_VND_POWERPOINT = 'application/vnd.ms-powerpoint',
	APPLICATION_PDF = 'application/pdf',
	APPLICATION_ZIP = 'application/zip',
	APPLICATION_JSON = 'application/json',
	APPLICATION_OCTET_STREAM = 'application/octet-stream',
	APPLICATION_VND_OPENXML_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	APPLICATION_VND_OPENXML_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	APPLICATION_VND_OPENXML_POWERPOINT = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}
