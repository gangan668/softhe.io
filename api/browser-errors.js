const crypto = require('node:crypto');
const { incrementWithExpiry } = require('./_lib/redis');

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

async function browserErrors(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const error = normalizeError(req.body);
	if (!error.message) return res.status(400).json({ error: 'Error message is required' });

	try {
		const attempts = await incrementWithExpiry(`browser:error:${getClientKey(req)}`, 60);
		if (attempts > 20) {
			res.setHeader('Retry-After', '60');
			return res.status(429).json({ error: 'Too many error reports' });
		}
		console.error('browser_error', error);
		return res.status(202).json({ accepted: true });
	} catch (reportingError) {
		return res.status(503).json({ error: reportingError.message });
	}
}

module.exports = browserErrors;
module.exports.getClientKey = getClientKey;
module.exports.normalizeError = normalizeError;
