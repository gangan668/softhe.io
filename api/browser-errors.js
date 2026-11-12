const crypto = require('node:crypto');
const { incrementWithExpiry } = require('./_lib/redis');
const { jsonOnly } = require('./_lib/portal-security');

const MAX_REPORT_BYTES = 16 * 1024;
const CSP_CONTENT_TYPES = new Set(['application/csp-report', 'application/reports+json', 'application/json']);

const cleanText = (value, maxLength) => typeof value === 'string'
	? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength)
	: '';

const normalizeError = (body = {}) => ({
	message: cleanText(body.message, 500),
	name: cleanText(body.name, 100),
	stack: cleanText(body.stack, 4000),
	url: cleanText(body.url, 500),
	environment: cleanText(body.environment, 50),
	context: body.context && typeof body.context === 'object'
		? JSON.stringify(body.context).slice(0, 2000)
		: '',
	timestamp: cleanText(body.timestamp, 50),
});

const getClientKey = (req) => {
	const forwarded = req.headers['x-forwarded-for'];
	const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])
		|| req.socket?.remoteAddress
		|| 'unknown';
	const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
	if (!secret) throw new Error('Error reporting rate limit is not configured');
	return crypto.createHmac('sha256', secret).update(ip.trim()).digest('hex');
};

const publicOrigin = () => {
	try {
		return new URL(process.env.PUBLIC_SITE_URL).origin;
	} catch {
		return '';
	}
};

// Browser error reports must come from this site: the Origin must equal the
// configured public origin or the HTTPS origin of the host serving the request.
const isSameOrigin = (req) => {
	const origin = String(req.headers?.origin || '');
	if (!origin) return false;
	const configured = publicOrigin();
	if (configured && origin === configured) return true;
	const requestHost = req.headers?.['x-forwarded-host'] || req.headers?.host;
	return Boolean(requestHost) && origin === `https://${String(requestHost).split(',')[0].trim()}`;
};

const mediaType = (req) => String(req.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();

const bodySize = (body) => {
	if (body === undefined || body === null) return 0;
	if (typeof body === 'string') return Buffer.byteLength(body);
	if (Buffer.isBuffer(body)) return body.length;
	try { return Buffer.byteLength(JSON.stringify(body)); } catch { return Infinity; }
};

const parseBody = (body) => {
	if (Buffer.isBuffer(body)) body = body.toString('utf8');
	if (typeof body === 'string') {
		try { return JSON.parse(body); } catch { return null; }
	}
	return body && typeof body === 'object' ? body : null;
};

// Accepts both the legacy report-uri format ({ "csp-report": {...} }) and the
// Reporting API format ([{ type: "csp-violation", body: {...} }]).
const normalizeCspReports = (rawBody) => {
	const parsed = parseBody(rawBody);
	if (!parsed) return [];
	const entries = Array.isArray(parsed) ? parsed : [parsed];
	return entries.slice(0, 10).flatMap((entry) => {
		if (!entry || typeof entry !== 'object') return [];
		const report = entry['csp-report'] || (entry.type === 'csp-violation' ? entry.body : null) || entry.body || entry;
		if (!report || typeof report !== 'object') return [];
		const record = {
			documentURL: cleanText(report.documentURL || report['document-uri'], 300),
			effectiveDirective: cleanText(report.effectiveDirective || report['effective-directive'] || report['violated-directive'], 100),
			blockedURL: cleanText(report.blockedURL || report['blocked-uri'], 300),
			disposition: cleanText(report.disposition, 20),
			sourceFile: cleanText(report.sourceFile || report['source-file'], 300),
			lineNumber: Number.isInteger(report.lineNumber ?? report['line-number']) ? report.lineNumber ?? report['line-number'] : null,
		};
		return record.effectiveDirective || record.blockedURL ? [record] : [];
	});
};

const enforceReportRateLimit = async (req, res, bucket, limit) => {
	const attempts = await incrementWithExpiry(`browser:${bucket}:${getClientKey(req)}`, 60);
	if (attempts > limit) {
		res.setHeader('Retry-After', '60');
		res.status(429).json({ error: 'Too many reports' });
		return false;
	}
	return true;
};

async function cspReport(req, res) {
	// Browsers do not reliably send Origin on violation reports, so no origin check here.
	if (!CSP_CONTENT_TYPES.has(mediaType(req))) return res.status(415).json({ error: 'Unsupported content type' });
	const declaredLength = Number(req.headers?.['content-length'] || 0);
	if (!Number.isFinite(declaredLength) || declaredLength > MAX_REPORT_BYTES || bodySize(req.body) > MAX_REPORT_BYTES) {
		return res.status(413).json({ error: 'Request too large' });
	}
	try {
		if (!(await enforceReportRateLimit(req, res, 'csp', 30))) return undefined;
		for (const record of normalizeCspReports(req.body)) console.warn('csp_violation', record);
		return res.status(204).end();
	} catch (reportingError) {
		console.error('csp_report_ingestion_failed', { message: reportingError.message });
		return res.status(503).json({ error: 'Reporting is temporarily unavailable' });
	}
}

async function browserErrors(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	if (req.query?.kind === 'csp') return cspReport(req, res);

	if (!isSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
	try {
		jsonOnly(req, MAX_REPORT_BYTES);
	} catch (error) {
		return res.status(error.statusCode).json({ error: error.publicMessage });
	}
	if (bodySize(req.body) > MAX_REPORT_BYTES) return res.status(413).json({ error: 'Request too large' });

	const error = normalizeError(parseBody(req.body) || {});
	if (!error.message) return res.status(400).json({ error: 'Error message is required' });

	try {
		if (!(await enforceReportRateLimit(req, res, 'error', 20))) return undefined;
		console.error('browser_error', error);
		return res.status(202).json({ accepted: true });
	} catch (reportingError) {
		console.error('browser_error_ingestion_failed', { message: reportingError.message });
		return res.status(503).json({ error: 'Error reporting is temporarily unavailable' });
	}
}

module.exports = browserErrors;
module.exports.MAX_REPORT_BYTES = MAX_REPORT_BYTES;
module.exports.getClientKey = getClientKey;
module.exports.isSameOrigin = isSameOrigin;
module.exports.normalizeCspReports = normalizeCspReports;
module.exports.normalizeError = normalizeError;
