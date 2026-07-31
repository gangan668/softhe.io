const crypto = require('node:crypto');
const { incrementWithExpiry } = require('./_lib/redis');
const { sendEmailTemplate } = require('./_lib/emailjs');
const { assertOperatorIdentity } = require('./_lib/config');

const SUBJECTS = new Set(['general', 'technical', 'sales', 'custom', 'billing']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const configureCors = (req, res) => {
	const origin = req.headers?.origin;
	if (!origin) return true;

	const publicOrigin = (() => {
		try {
			return new URL(process.env.PUBLIC_SITE_URL).origin;
		} catch {
			return '';
		}
	})();
	const requestHost = req.headers?.['x-forwarded-host'] || req.headers?.host;
	const requestOrigins = requestHost
		? new Set([`https://${requestHost}`])
		: new Set();
	if (origin !== publicOrigin && !requestOrigins.has(origin)) return false;

	res.setHeader('Access-Control-Allow-Origin', origin);
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	res.setHeader('Vary', 'Origin');
	return true;
};

const cleanText = (value, maxLength) => typeof value === 'string'
	? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, maxLength)
	: '';

const normalizeSubmission = (body = {}) => ({
	name: cleanText(body.name, 100),
	email: cleanText(body.email, 100).toLowerCase(),
	subject: cleanText(body.subject, 30),
	hardware: cleanText(body.hardware, 500),
	message: cleanText(body.message, 2000),
	website: cleanText(body.website, 200),
});

const validateSubmission = (submission) => {
	if (submission.name.length < 2) return 'Please enter a valid name';
	if (!EMAIL_PATTERN.test(submission.email)) return 'Please enter a valid email address';
	if (!SUBJECTS.has(submission.subject)) return 'Please select a valid subject';
	if (submission.message.length < 10) return 'Please enter a message of at least 10 characters';
	return null;
};

const getClientIdentifier = (req) => {
	const forwarded = req.headers['x-forwarded-for'];
	const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])
		|| req.socket?.remoteAddress
		|| 'unknown';
	const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
	if (!secret) throw new Error('Contact rate limiting is not configured');
	return crypto.createHmac('sha256', secret).update(ip.trim()).digest('hex');
};

const sendEmail = (submission) => sendEmailTemplate(process.env.EMAILJS_TEMPLATE_ID, {
	from_name: submission.name,
	from_email: submission.email,
	reply_to: submission.email,
	subject: submission.subject,
	hardware: submission.hardware,
	message: submission.message,
});

async function contact(req, res) {
	if (!configureCors(req, res)) {
		return res.status(403).json({ error: 'Origin not allowed' });
	}
	if (req.method === 'OPTIONS') {
		return res.status(204).end();
	}
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const submission = normalizeSubmission(req.body);
	if (submission.website) return res.status(200).json({ delivered: true });
	const validationError = validateSubmission(submission);
	if (validationError) return res.status(400).json({ error: validationError });

	try {
		assertOperatorIdentity();
		const identifier = getClientIdentifier(req);
		const attempts = await incrementWithExpiry(`contact:rate:${identifier}`, 60);
		if (attempts > 3) {
			res.setHeader('Retry-After', '60');
			return res.status(429).json({ error: 'Too many messages. Please wait one minute.' });
		}
		await sendEmail(submission);
		return res.status(200).json({ delivered: true });
	} catch (error) {
		const configurationError = /not configured/.test(error.message);
		console.error('contact_delivery_failed', { configurationError, message: error.message });
		return res.status(configurationError ? 503 : 502).json({
			error: configurationError
				? 'Contact service is temporarily unavailable. Please email support@softhe.io.'
				: 'Message delivery failed. Please try again.',
		});
	}
}

module.exports = contact;
module.exports.configureCors = configureCors;
module.exports.getClientIdentifier = getClientIdentifier;
module.exports.normalizeSubmission = normalizeSubmission;
module.exports.validateSubmission = validateSubmission;
