const { readJsonBody } = require('./json-body');
const { sendPublicError } = require('./portal-security');

// The deployment disables Vercel's automatic body buffering and JSON parser.
// Supply only the response and query helpers these handlers actually use.
const withHttp = (handler, { raw = false, maxBytes = 16384 } = {}) => async (req, res) => {
	if (typeof res.status !== 'function') {
		res.status = (code) => { res.statusCode = code; return res; };
	}
	if (typeof res.json !== 'function') {
		res.json = (body) => {
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.end(JSON.stringify(body));
			return res;
		};
	}
	// API responses carry account data; handlers may tighten this further.
	if (typeof res.setHeader === 'function') res.setHeader('Cache-Control', 'no-store');
	try {
		if (req.query === undefined) {
			const query = Object.create(null);
			for (const [key, value] of new URL(req.url || '/', 'http://localhost').searchParams) {
				query[key] = query[key] === undefined ? value : [...(Array.isArray(query[key]) ? query[key] : [query[key]]), value];
			}
			req.query = query;
		}
		// Direct handler callers can supply a parsed body. Real HTTP requests are
		// bounded while streaming, before JSON.parse or any lazy body getter runs.
		if (!raw && req.method === 'POST' && typeof req[Symbol.asyncIterator] === 'function') {
			req.body = await readJsonBody(req, maxBytes);
		}
		return await handler(req, res);
	} catch (error) {
		if (res.headersSent) { res.end(); return res; }
		return sendPublicError(res, error);
	}
};

module.exports = { withHttp };
