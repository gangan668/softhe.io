const crypto = require('crypto');
const { incrementWithExpiry, claimKey, deleteKey } = require('./redis');

const jsonOnly = (req, maxBytes = 16384) => {
	if (String(req.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
		throw Object.assign(new Error('JSON content type required'), { statusCode: 415, publicMessage: 'JSON content type required' });
	}
	const length = Number(req.headers?.['content-length'] || 0);
	if (!Number.isInteger(length) || length < 0 || length > maxBytes) {
		throw Object.assign(new Error('Request too large'), { statusCode: 413, publicMessage: 'Request too large' });
	}
	const serializedBody = req.body === undefined ? '' : (Buffer.isBuffer(req.body) || typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
	const actualLength = Buffer.byteLength(serializedBody, 'utf8');
	if (actualLength > maxBytes) {
		throw Object.assign(new Error('Request too large'), { statusCode: 413, publicMessage: 'Request too large' });
	}
};

const requestId = (req) => String(req.headers?.['x-request-id'] || crypto.randomUUID()).slice(0, 100);

const clientIp = (req) => String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

const enforceSameOrigin = (req) => {
	const origin = String(req.headers?.origin || '');
	const host = String(req.headers?.host || '');
	if (!origin || !host) throw Object.assign(new Error('Forbidden'), { statusCode: 403, publicMessage: 'Forbidden' });
	let originUrl;
	try { originUrl = new URL(origin); } catch { throw Object.assign(new Error('Forbidden'), { statusCode: 403, publicMessage: 'Forbidden' }); }
	if (!['https:', 'http:'].includes(originUrl.protocol) || originUrl.host !== host) {
		throw Object.assign(new Error('Forbidden'), { statusCode: 403, publicMessage: 'Forbidden' });
	}
};

const rateIdentity = (value) => {
	const secret = process.env.PORTAL_RATE_LIMIT_SECRET;
	if (!secret) throw Object.assign(new Error('Portal rate limiting is not configured'), { statusCode: 503 });
	return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
};

const enforceRateLimit = async (bucket, identity, limit, ttlSeconds) => {
	const count = await incrementWithExpiry(`portal:rate:${bucket}:${rateIdentity(identity)}`, ttlSeconds);
	if (count > limit) throw Object.assign(new Error('Rate limit exceeded'), { statusCode: 429, publicMessage: 'Too many requests. Please try again later.' });
};

const acquireLock = (name, ttlSeconds) => claimKey(`portal:lock:${name}`, crypto.randomUUID(), ttlSeconds);
const releaseLock = (name) => deleteKey(`portal:lock:${name}`);

const receiptToken = (sessionId) => {
	const secret = process.env.CHECKOUT_RECEIPT_SECRET;
	if (!secret) throw Object.assign(new Error('Checkout receipt verification is not configured'), { statusCode: 503 });
	return crypto.createHmac('sha256', secret).update(String(sessionId)).digest('base64url');
};

const verifyReceiptToken = (sessionId, supplied) => {
	if (typeof supplied !== 'string') return false;
	const expected = receiptToken(sessionId);
	const left = Buffer.from(supplied);
	const right = Buffer.from(expected);
	return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const GENERIC_CLIENT_ERRORS = {
	400: 'Invalid request',
	401: 'Authentication required',
	403: 'Forbidden',
	404: 'Not found',
	409: 'Conflict',
	413: 'Request too large',
	415: 'Unsupported content type',
	429: 'Too many requests. Please try again later.',
};

// Only messages explicitly marked as public (error.publicMessage) reach the client.
// Internal messages (including upstream provider text) stay in server logs.
const sendPublicError = (res, error, fallback = 'Request could not be completed') => {
	const status = Number(error?.statusCode) || 500;
	if (status >= 500) console.error('portal_request_failed', { status, message: error?.message, detail: error?.detail });
	const message = status < 500
		? error?.publicMessage || GENERIC_CLIENT_ERRORS[status] || 'Request could not be completed'
		: error?.publicMessage || fallback;
	return res.status(status).json({ error: message });
};

module.exports = { GENERIC_CLIENT_ERRORS, acquireLock, clientIp, enforceRateLimit, enforceSameOrigin, jsonOnly, receiptToken, releaseLock, requestId, sendPublicError, verifyReceiptToken };
