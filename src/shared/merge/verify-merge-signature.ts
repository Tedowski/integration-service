import crypto from 'crypto';

export async function verifyMergeSignature(request: Request, secret: string): Promise<boolean> {
	const signature = request.headers.get('x-merge-webhook-signature');
	if (!signature) return false;

	const rawBody = await request.clone().text();

	// Base64URL-encoded HMAC SHA256, just like Merge docs
	const encodedBody = Buffer.from(rawBody, 'utf-8');
	const digest = crypto.createHmac('sha256', secret).update(encodedBody).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

	// Constant-time comparison
	const a = Buffer.from(signature);
	const b = Buffer.from(digest);
	return Buffer.byteLength(a) === Buffer.byteLength(b) && crypto.timingSafeEqual(a, b);
}
