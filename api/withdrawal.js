const { withHttp } = require('./_lib/http');
const crypto = require('node:crypto');
const { claimKey, deleteKey, incrementWithExpiry, setKey } = require('./_lib/redis');
const { sendEmailTemplate } = require('./_lib/emailjs');
const { assertOperatorIdentity } = require('./_lib/config');
const { readJsonBody } = require('./_lib/json-body');
const { sendPublicError } = require('./_lib/portal-security');
const { fetchWithTimeout } = require('./_lib/fetch');
const { adminRequest, portalServerConfigured } = require('./_lib/supabase');
const { verifyTurnstile } = require('./_lib/turnstile');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const STRIPE_SESSION_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9]{8,}$/;
const ALLOWED_ITEMS = new Set(['entire-order', 'windows-10', 'windows-11', 'bios-optimization']);

const cleanText = (value, maxLength) => typeof value === 'string'
	? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, maxLength)
	: '';

const normalizeWithdrawal = (body = {}) => ({
	orderReference: cleanText(body?.orderReference, 100),
	email: cleanText(body?.email, 100).toLowerCase(),
	requestedItems: Array.isArray(body?.requestedItems)
		? [...new Set(body.requestedItems.map((item) => cleanText(item, 40)).filter(Boolean))]
		: [],
	comments: cleanText(body?.comments, 2000),
	website: cleanText(body?.website, 200),
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

// Compares normalized addresses in constant time (fixed-length digests).
const emailsMatch = (left, right) => {
	if (typeof left !== 'string' || typeof right !== 'string' || !left.trim() || !right.trim()) return false;
	const digest = (value) => crypto.createHash('sha256').update(value.trim().toLowerCase()).digest();
	return crypto.timingSafeEqual(digest(left), digest(right));
};

// Resolves the e-mail address of the order behind a reference (a Stripe Checkout
// Session ID): the portal database first, then the Stripe session itself. Returns
// null when the order cannot be found. Provider errors are thrown.
const lookupOrderEmail = async (orderReference) => {
	if (portalServerConfigured()) {
		const rows = await adminRequest(`orders?stripe_session_id=eq.${encodeURIComponent(orderReference)}&select=customer_email&limit=1`);
		const email = Array.isArray(rows) ? rows[0]?.customer_email : null;
		if (email) return email;
	}
	if (process.env.STRIPE_SECRET_KEY && STRIPE_SESSION_PATTERN.test(orderReference)) {
		const response = await fetchWithTimeout(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(orderReference)}`, {
			headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
		});
		if (response.status === 404) return null;
		if (!response.ok) throw new Error(`Order lookup failed (${response.status})`);
		const session = await response.json();
		return session?.customer_details?.email || null;
	}
	return null;
};

// Never throws: an unavailable provider is treated as "not verified" so the
// operator still receives every withdrawal request.
const verifyOrderOwnership = async (submission, lookup = lookupOrderEmail) => {
	try {
		return emailsMatch(await lookup(submission.orderReference), submission.email);
	} catch (error) {
		console.error('withdrawal_order_lookup_failed', { message: error.message });
		return false;
	}
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
	// The operator notification is the legally relevant record, so it is sent
	// independently of the customer acknowledgement and decides the outcome.
	// The acknowledgement goes only to an address proven to own the order, so the
	// form cannot be used to send mail to arbitrary recipients.
	const [acknowledgement, notification] = await Promise.allSettled([
		record.orderVerified === true
			? sendEmailTemplate(process.env.EMAILJS_WITHDRAWAL_TEMPLATE_ID, {
				...templateParams,
				message_type: 'customer_acknowledgement',
			})
			: Promise.resolve(),
		sendEmailTemplate(process.env.EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID, {
			...templateParams,
			to_email: process.env.SUPPORT_EMAIL,
			customer_email: record.email,
			order_verified: record.orderVerified === true ? 'yes' : 'no',
			message_type: 'operator_notification',
		}),
	]);
	if (notification.status === 'rejected') throw notification.reason;
	if (acknowledgement.status === 'rejected') {
		// Same 202 response as an unverified request; the operator follows up.
		console.error('withdrawal_acknowledgement_failed', { requestId: record.requestId, message: acknowledgement.reason?.message });
		return { acknowledgementSent: false };
	}
	return { acknowledgementSent: record.orderVerified === true };
};

async function withdrawal(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	let body;
	try { body = await readJsonBody(req); } catch (error) { return sendPublicError(res, error); }
	const submission = normalizeWithdrawal(body);
	if (submission.website) {
		return res.status(202).json({ received: true });
	}
	const validationError = validateWithdrawal(submission);
	if (validationError) return res.status(400).json({ error: validationError });

	const captcha = await verifyTurnstile(req, { body });
	if (!captcha.ok) return res.status(captcha.status).json({ error: captcha.error });

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

		const orderVerified = await verifyOrderOwnership(submission);
		const record = {
			requestId,
			receivedAt: new Date().toISOString(),
			status: 'received',
			...submission,
			orderVerified,
		};
		delete record.website;
		await setKey(`withdrawal:request:${requestId}`, JSON.stringify(record), retentionSeconds);
		const { acknowledgementSent } = await sendWithdrawalEmails(record);
		await setKey(`withdrawal:request:${requestId}`, JSON.stringify({ ...record, status: 'acknowledged', acknowledgementSent }), retentionSeconds);

		// Identical response whether or not the order matched, so the endpoint
		// cannot be used to test which order references belong to which addresses.
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

module.exports = withHttp(withdrawal);
module.exports.config = { api: { bodyParser: false } };
module.exports.ALLOWED_ITEMS = ALLOWED_ITEMS;
module.exports.getIdempotencyKey = getIdempotencyKey;
module.exports.getRetentionSeconds = getRetentionSeconds;
module.exports.normalizeWithdrawal = normalizeWithdrawal;
module.exports.sendWithdrawalEmails = sendWithdrawalEmails;
module.exports.validateWithdrawal = validateWithdrawal;
module.exports.emailsMatch = emailsMatch;
module.exports.lookupOrderEmail = lookupOrderEmail;
module.exports.verifyOrderOwnership = verifyOrderOwnership;
