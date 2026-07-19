const crypto = require('node:crypto');
const { claimKey, deleteKey, setKey } = require('./_lib/redis');
const { normalizeItems } = require('./create-checkout-session');

const MAX_WEBHOOK_BYTES = 1024 * 1024;

const readRawBody = async (req) => {
	if (Buffer.isBuffer(req.body)) {
		if (req.body.length > MAX_WEBHOOK_BYTES) throw new Error('Webhook payload is too large');
		return req.body;
	}
	const chunks = [];
	let totalBytes = 0;
	for await (const chunk of req) {
		const buffer = Buffer.from(chunk);
		totalBytes += buffer.length;
		if (totalBytes > MAX_WEBHOOK_BYTES) throw new Error('Webhook payload is too large');
		chunks.push(buffer);
	}
	return Buffer.concat(chunks);
};

const verifyStripeSignature = (payload, signatureHeader, secret, toleranceSeconds = 300) => {
	if (!signatureHeader || !secret) return false;
	const parts = signatureHeader.split(',').map((part) => part.split('='));
	const timestamp = parts.find(([key]) => key === 't')?.[1];
	const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
	if (!timestamp || signatures.length === 0) return false;
	const timestampSeconds = Number(timestamp);
	if (!Number.isInteger(timestampSeconds) || timestampSeconds <= 0) return false;
	if (Math.abs(Date.now() / 1000 - timestampSeconds) > toleranceSeconds) return false;

	const expected = crypto
		.createHmac('sha256', secret)
		.update(`${timestamp}.${payload.toString('utf8')}`)
		.digest('hex');

	return signatures.some((signature) => {
		if (signature.length !== expected.length) return false;
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
	});
};

const getFulfillmentUrl = () => {
	const value = process.env.ORDER_FULFILLMENT_WEBHOOK_URL;
	const secret = process.env.ORDER_FULFILLMENT_WEBHOOK_SECRET;
	if (!value || !secret) throw new Error('Order fulfillment is not configured');
	const url = new URL(value);
	if (url.protocol !== 'https:') throw new Error('Order fulfillment URL must use HTTPS');
	return { secret, url: url.toString() };
};

const getOrderItems = (session) => {
	if (session.metadata?.order_schema !== '1' || !session.metadata?.order_items) {
		throw new Error('Checkout session is missing authoritative order items');
	}
	try {
		return normalizeItems(JSON.parse(session.metadata.order_items));
	} catch {
		throw new Error('Checkout session has invalid authoritative order items');
	}
};

const deliverFulfillment = async (event, session) => {
	const { secret, url } = getFulfillmentUrl();
	const items = getOrderItems(session);
	const body = JSON.stringify({
		eventId: event.id,
		sessionId: session.id,
		amountTotal: session.amount_total,
		currency: session.currency,
		customerEmail: session.customer_details?.email || null,
		customerId: session.customer || null,
		paymentIntentId: session.payment_intent || null,
		items,
		metadata: session.metadata || {},
	});
	const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Idempotency-Key': session.id,
			'X-Softhe-Signature': signature,
		},
		body,
	});
	if (!response.ok) throw new Error(`Fulfillment delivery failed with status ${response.status}`);
};

const fulfillPaidSession = async (event) => {
	const session = event.data.object;
	if (!['paid', 'no_payment_required'].includes(session.payment_status)) return 'payment-pending';
	const key = `stripe:fulfilled:${session.id}`;
	const claimed = await claimKey(key, 'processing', 600);
	if (!claimed) return 'duplicate';

	try {
		await deliverFulfillment(event, session);
		await setKey(key, JSON.stringify({ eventId: event.id, status: 'completed' }), 60 * 60 * 24 * 90);
		return 'fulfilled';
	} catch (error) {
		await deleteKey(key).catch(() => {});
		throw error;
	}
};

async function stripeWebhook(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		return res.status(503).json({ error: 'Stripe webhook is not configured' });
	}

	let payload;
	try {
		payload = await readRawBody(req);
	} catch (error) {
		return res.status(413).json({ error: error.message });
	}
	if (!verifyStripeSignature(payload, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) {
		return res.status(400).json({ error: 'Invalid Stripe signature' });
	}

	let event;
	try {
		event = JSON.parse(payload.toString('utf8'));
	} catch {
		return res.status(400).json({ error: 'Invalid JSON payload' });
	}

	if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
		try {
			const status = await fulfillPaidSession(event);
			return res.status(200).json({ received: true, status });
		} catch (error) {
			return res.status(503).json({ error: error.message });
		}
	} else if (event.type === 'checkout.session.expired') {
		console.info('Stripe checkout expired', { sessionId: event.data.object.id });
	}

	return res.status(200).json({ received: true });
}

module.exports = stripeWebhook;
module.exports.config = { api: { bodyParser: false } };
module.exports.verifyStripeSignature = verifyStripeSignature;
module.exports.readRawBody = readRawBody;
module.exports.deliverFulfillment = deliverFulfillment;
module.exports.fulfillPaidSession = fulfillPaidSession;
module.exports.getFulfillmentUrl = getFulfillmentUrl;
module.exports.getOrderItems = getOrderItems;
