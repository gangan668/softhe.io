const requestError = (statusCode, message) => Object.assign(new Error(message), { statusCode, publicMessage: message });

const JSON_MEDIA_TYPES = ['application/json'];

const mediaType = (req) => String(req.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();

// Bounded read of any JSON value. mediaTypes lists the accepted Content-Type values
// (e.g. CSP reports arrive as application/csp-report or application/reports+json).
const readJsonValue = async (req, { maxBytes = 16384, mediaTypes = JSON_MEDIA_TYPES } = {}) => {
	if (!mediaTypes.includes(mediaType(req))) {
		throw requestError(415, 'JSON content type required');
	}
	const length = Number(req.headers?.['content-length'] || 0);
	if (!Number.isInteger(length) || length < 0 || length > maxBytes) throw requestError(413, 'Request too large');

	// Inspect a data property without invoking Vercel's lazy JSON parser.
	const descriptor = Object.getOwnPropertyDescriptor(req, 'body');
	const supplied = descriptor && 'value' in descriptor ? descriptor.value : undefined;
	let raw;
	if (supplied !== undefined && !Buffer.isBuffer(supplied) && typeof supplied !== 'string') {
		if (Buffer.byteLength(JSON.stringify(supplied), 'utf8') > maxBytes) throw requestError(413, 'Request too large');
		return supplied;
	}
	if (Buffer.isBuffer(supplied) || typeof supplied === 'string') {
		raw = Buffer.from(supplied);
		if (raw.length > maxBytes) throw requestError(413, 'Request too large');
	} else {
		const chunks = [];
		let bytes = 0;
		if (typeof req[Symbol.asyncIterator] !== 'function') throw requestError(400, 'Invalid JSON');
		const stream = typeof req.iterator === 'function' ? req.iterator({ destroyOnReturn: false }) : req;
		for await (const chunk of stream) {
			const buffer = Buffer.from(chunk);
			bytes += buffer.length;
			if (bytes > maxBytes) {
				req.resume?.();
				throw requestError(413, 'Request too large');
			}
			chunks.push(buffer);
		}
		raw = Buffer.concat(chunks, bytes);
	}
	try { return JSON.parse(raw.toString('utf8')); } catch { throw requestError(400, 'Invalid JSON'); }
};

const readJsonBody = async (req, maxBytes = 16384) => {
	const body = await readJsonValue(req, { maxBytes });
	if (!body || typeof body !== 'object' || Array.isArray(body)) throw requestError(400, 'JSON object required');
	return body;
};

module.exports = { readJsonBody, readJsonValue };
