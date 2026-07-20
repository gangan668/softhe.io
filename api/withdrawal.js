const crypto = require('node:crypto');
const { claimKey, deleteKey, incrementWithExpiry, setKey } = require('./_lib/redis');
const { sendEmailTemplate } = require('./_lib/emailjs');
const { assertOperatorIdentity } = require('./_lib/config');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const ALLOWED_ITEMS = new Set(['entire-order', 'windows-10', 'windows-11', 'bios-optimization']);

const cleanText = (value, maxLength) => typeof value === 'string'
	? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, maxLength)
	: '';

const normalizeWithdrawal = (body = {}) => ({
	orderReference: cleanText(body.orderReference, 100),
	email: cleanText(body.email, 100).toLowerCase(),
	requestedItems: Array.isArray(body.requestedItems)
		? [...new Set(body.requestedItems.map((item) => cleanText(item, 40)).filter(Boolean))]
		: [],
	comments: cleanText(body.comments, 2000),
	website: cleanText(body.website, 200),
});

const validateWithdrawal = (submission) => {
	if (!ORDER_REFERENCE_PATTERN.test(submission.orderReference)) return 'Please enter a valid order reference';
	if (!EMAIL_PATTERN.test(submission.email)) return 'Please enter the email used for the order';
	if (submission.requestedItems.length === 0) return 'Please select what you want to withdraw';
	if (submission.requestedItems.some((item) => !ALLOWED_ITEMS.has(item))) return 'Please select valid order items';
	if (submission.requestedItems.includes('entire-order') && submission.requestedItems.length > 1) {
		return 'Select either the entire order or individual items';
	}
	return null;
};

const getClientIdentifier = (req) => {
	const forwarded = req.headers['x-forwarded-for'];
	const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])
		|| req.socket?.remoteAddress
		|| 'unknown';
	const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
	if (!secret) throw new Error('Withdrawal rate limiting is not configured');
	return crypto.createHmac('sha256', secret).update(ip.trim()).digest('hex');
};

const getRetentionSeconds = () => {
	const configuredDays = Number(process.env.WITHDRAWAL_RETENTION_DAYS || 400);
	const days = Number.isInteger(configuredDays) ? Math.min(Math.max(configuredDays, 30), 730) : 400;
	return days * 24 * 60 * 60;
};

const getIdempotencyKey = (submission) => {
	const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
	if (!secret) throw new Error('Withdrawal idempotency is not configured');
	const canonical = JSON.stringify({
		orderReference: submission.orderReference.toLowerCase(),
		email: submission.email,
		requestedItems: [...submission.requestedItems].sort(),
	});
	return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
};

const sendWithdrawalEmails = async (record) => {
	const templateParams = {
		to_email: record.email,
		order_reference: record.orderReference,
		requested_items: record.requestedItems.join(', '),
		comments: record.comments || 'No additional comments',
		request_id: record.requestId,
		received_at: record.receivedAt,
		withdrawal_url: `${(process.env.PUBLIC_SITE_URL || 'https://softhe.io').replace(/\/$/, '')}/withdrawal`,
	};
	await sendEmailTemplate(process.env.EMAILJS_WITHDRAWAL_TEMPLATE_ID, {
		...templateParams,
		message_type: 'customer_acknowledgement',
	});
	await sendEmailTemplate(process.env.EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID, {
		...templateParams,
		customer_email: record.email,
		message_type: 'operator_notification',
	});
};

async function withdrawal(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const submission = normalizeWithdrawal(req.body);
	if (submission.website) {
		return res.status(202).json({ received: true });
	}
	const validationError = validateWithdrawal(submission);
	if (validationError) return res.status(400).json({ error: validationError });

	let idempotencyKey;
	let requestId;
	const retentionSeconds = getRetentionSeconds();
	try {
		assertOperatorIdentity();
		const identifier = getClientIdentifier(req);
		const attempts = await incrementWithExpiry(`withdrawal:rate:${identifier}`, 24 * 60 * 60);
		if (attempts > 5) {
			res.setHeader('Retry-After', '86400');
			return res.status(429).json({ error: 'Too many withdrawal requests. Please contact support.' });
		}

		idempotencyKey = `withdrawal:idempotency:${getIdempotencyKey(submission)}`;
		requestId = `wd_${crypto.randomUUID()}`;
		const claimed = await claimKey(idempotencyKey, requestId, retentionSeconds);
		if (!claimed) return res.status(202).json({ received: true, duplicate: true });

		const record = {
			requestId,
			receivedAt: new Date().toISOString(),
			status: 'received',
			...submission,
		};
		delete record.website;
		await setKey(`withdrawal:request:${requestId}`, JSON.stringify(record), retentionSeconds);
		await sendWithdrawalEmails(record);
		await setKey(`withdrawal:request:${requestId}`, JSON.stringify({ ...record, status: 'acknowledged' }), retentionSeconds);

		return res.status(202).json({
			received: true,
			requestId,
			receivedAt: record.receivedAt,
		});
	} catch (error) {
		if (idempotencyKey) await deleteKey(idempotencyKey).catch(() => {});
		console.error('withdrawal_request_failed', { requestId: requestId || null, message: error.message });
		const configurationError = /not configured/.test(error.message);
		return res.status(configurationError ? 503 : 502).json({
			error: configurationError
				? 'The online withdrawal service is temporarily unavailable. Please email support@softhe.io.'
				: 'The request could not be confirmed. Please try again or contact support.',
		});
	}
}

module.exports = withdrawal;
module.exports.ALLOWED_ITEMS = ALLOWED_ITEMS;
module.exports.getIdempotencyKey = getIdempotencyKey;
module.exports.getRetentionSeconds = getRetentionSeconds;
module.exports.normalizeWithdrawal = normalizeWithdrawal;
module.exports.sendWithdrawalEmails = sendWithdrawalEmails;
module.exports.validateWithdrawal = validateWithdrawal;
