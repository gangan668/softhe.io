const crypto = require('node:crypto');

const safeEqual = (left, right) => {
	const leftBuffer = Buffer.from(String(left || ''));
	const rightBuffer = Buffer.from(String(right || ''));
	return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

async function monitoringTest(req, res) {
	res.setHeader('Cache-Control', 'no-store');
	if (process.env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'Not found' });
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const configuredSecret = process.env.MONITORING_TEST_SECRET;
	const suppliedSecret = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
	if (!configuredSecret || !safeEqual(configuredSecret, suppliedSecret)) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const kind = req.body?.kind;
	if (kind === 'browser') console.error('browser_error', { monitorTest: true });
	else if (kind === 'delivery') console.error('contact_delivery_failed', { monitorTest: true });
	else return res.status(400).json({ error: 'Unsupported monitoring test' });

	return res.status(202).json({ accepted: true, kind });
}

module.exports = monitoringTest;
module.exports.safeEqual = safeEqual;
