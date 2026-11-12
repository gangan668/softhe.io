const { withHttp } = require('./_lib/http');
const crypto = require('node:crypto');
const { incrementWithExpiry } = require('./_lib/redis');
const { readJsonBody, readJsonValue } = require('./_lib/json-body');
const { sendPublicError } = require('./_lib/portal-security');

const MAX_REPORT_BYTES = 16 * 1024;
const CSP_MEDIA_TYPES = ['application/csp-report', 'application/reports+json', 'application/json'];

const cleanText = (value, maxLength) => typeof value === 'string'
	? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength)
	: '';

const normalizeError = (body = {}) => ({
	message: cleanText(body?.message, 500),
	name: cleanText(body?.name, 100),
	stack: cleanText(body?.stack, 4000),
	url: cleanText(body?.url, 500),
	environment: cleanText(body?.environment, 50),
	context: body?.context && typeof body.context === 'object'
		? JSON.stringify(body.context).slice(0, 2000)
		: '',
	timestamp: cleanText(body?.timestamp, 50),
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

// Accepts both the legacy report-uri format ({ "csp-report": {...} }) and the
// Reporting API format ([{ type: "csp-violation", body: {...} }]). String bodies
// (unparsed by an upstream adapter) are parsed here.
const normalizeCspReports = (rawBody) => {
	let parsed = rawBody;
	if (Buffer.isBuffer(parsed)) parsed = parsed.toString('utf8');
	if (typeof parsed === 'string') {
		try { parsed = JSON.parse(parsed); } catch { return []; }
	}
	if (!parsed || typeof parsed !== 'object') return [];
	const entries = Array.isArray(parsed) ? parsed : [parsed];
	return entries.slice(0, 10).flatMap((entry) => {
		if (!entry || typeof entry !== 'object') return [];
		const report = entry['csp-report'] || entry.body || entry;
		if (!report || typeof report !== 'object') return [];
		const lineNumber = report.lineNumber ?? report['line-number'];
		const record = {
			documentURL: cleanText(report.documentURL || report['document-uri'], 300),
			effectiveDirective: cleanText(report.effectiveDirective || report['effective-directive'] || report['violated-directive'], 100),
			blockedURL: cleanText(report.blockedURL || report['blocked-uri'], 300),
			disposition: cleanText(report.disposition, 20),
			sourceFile: cleanText(report.sourceFile || report['source-file'], 300),
			lineNumber: Number.isInteger(lineNumber) ? lineNumber : null,
		};
		return record.effectiveDirective || record.blockedURL ? [record] : [];
	});
};

const enforceReportRateLimit = async (req, res, bucket, limit, message) => {
	const attempts = await incrementWithExpiry(`browser:${bucket}:${getClientKey(req)}`, 60);
	if (attempts > limit) {
		res.setHeader('Retry-After', '60');
		res.status(429).json({ error: message });
		return false;
	}
	return true;
};

async function cspReport(req, res) {
	// Browsers do not reliably send Origin on violation reports, so there is no origin check.
	let body;
	try {
		body = await readJsonValue(req, { maxBytes: MAX_REPORT_BYTES, mediaTypes: CSP_MEDIA_TYPES });
	} catch (error) {
		return sendPublicError(res, error);
	}
	try {
		if (!(await enforceReportRateLimit(req, res, 'csp', 30, 'Too many reports'))) return undefined;
		for (const record of normalizeCspReports(body)) console.warn('csp_violation', record);
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

	// Bounded (16 KB) JSON only; the body is read before the origin check so
	// oversized or malformed input is rejected without further work.
	let body;
	try { body = await readJsonBody(req, MAX_REPORT_BYTES); } catch (error) { return sendPublicError(res, error); }
	if (!isSameOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
	const error = normalizeError(body);
	if (!error.message) return res.status(400).json({ error: 'Error message is required' });

	try {
		if (!(await enforceReportRateLimit(req, res, 'error', 20, 'Too many error reports'))) return undefined;
		console.error('browser_error', error);
		return res.status(202).json({ accepted: true });
	} catch (reportingError) {
		console.error('browser_error_ingestion_failed', { message: reportingError.message });
		return res.status(503).json({ error: 'Error reporting is temporarily unavailable' });
	}
}

// raw: CSP reports use non-JSON media types, so the handler reads the bounded body itself.
module.exports = withHttp(browserErrors, { raw: true });
module.exports.config = { api: { bodyParser: false } };
module.exports.MAX_REPORT_BYTES = MAX_REPORT_BYTES;
module.exports.getClientKey = getClientKey;
module.exports.isSameOrigin = isSameOrigin;
module.exports.normalizeCspReports = normalizeCspReports;
module.exports.normalizeError = normalizeError;
