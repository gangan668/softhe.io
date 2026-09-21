const crypto = require('node:crypto');
const { redisCommand } = require('./redis');

const MAX_BODY_BYTES = 64 * 1024;
const HEX_SIGNATURE = /^[a-f0-9]{64}$/;
const SESSION_ID = /^cs_(?:test_)?[A-Za-z0-9]{8,}$/;

const retentionSeconds = () => {
	const days = Number(process.env.ORDER_RETENTION_DAYS || 400);
	return (Number.isInteger(days) && days >= 30 && days <= 730 ? days : 400) * 86400;
};

const readRawBody = async (req) => {
	if (Buffer.isBuffer(req.body)) return req.body;
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const value = Buffer.from(chunk);
		total += value.length;
		if (total > MAX_BODY_BYTES) throw Object.assign(new Error('Payload is too large'), { statusCode: 413 });
		chunks.push(value);
	}
	return Buffer.concat(chunks);
};

const validSignature = (payload, signature, secret) => {
	if (!secret || !HEX_SIGNATURE.test(String(signature || ''))) return false;
	const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
	return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

const normalizeOrder = (body) => {
	if (!body || !SESSION_ID.test(String(body.sessionId || ''))) throw new Error('Invalid session ID');
	if (!/^evt_[A-Za-z0-9]{8,}$/.test(String(body.eventId || ''))) throw new Error('Invalid event ID');
	if (!Number.isInteger(body.amountTotal) || body.amountTotal < 0) throw new Error('Invalid order amount');
	if (!/^[a-z]{3}$/i.test(String(body.currency || ''))) throw new Error('Invalid currency');
	if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) throw new Error('Invalid order items');
	return {
		eventId: body.eventId,
		sessionId: body.sessionId,
		amountTotal: body.amountTotal,
		currency: body.currency.toLowerCase(),
		customerEmail: typeof body.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase().slice(0, 320) : null,
		customerId: typeof body.customerId === 'string' ? body.customerId.slice(0, 120) : null,
		paymentIntentId: typeof body.paymentIntentId === 'string' ? body.paymentIntentId.slice(0, 120) : null,
		items: body.items.map((item) => {
			if (!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new Error('Invalid order item');
			return { id: item.id.slice(0, 80), quantity: item.quantity };
		}),
		receivedAt: new Date().toISOString(),
	};
};

const storeOrder = async (order) => {
	const ttl = retentionSeconds();
	const key = `fulfillment:order:${order.sessionId}`;
	const eventKey = `fulfillment:event:${order.eventId}`;
	const script = [
		"if redis.call('EXISTS', KEYS[1]) == 1 then return 'duplicate' end",
		"redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])",
		"redis.call('SET', KEYS[2], ARGV[3], 'EX', ARGV[2])",
		"return 'accepted'",
	].join(' ');
	return redisCommand(['EVAL', script, 2, key, eventKey, JSON.stringify(order), ttl, order.sessionId]);
};

async function orderFulfillment(req, res) {
	res.setHeader('Cache-Control', 'no-store');
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	try {
		const payload = await readRawBody(req);
		if (!validSignature(payload, req.headers['x-softhe-signature'], process.env.ORDER_FULFILLMENT_WEBHOOK_SECRET)) {
			return res.status(401).json({ error: 'Invalid signature' });
		}
		const order = normalizeOrder(JSON.parse(payload.toString('utf8')));
		if (req.headers['idempotency-key'] !== order.sessionId) return res.status(400).json({ error: 'Invalid idempotency key' });
		return res.status(200).json({ status: await storeOrder(order) });
	} catch (error) {
		return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Fulfillment temporarily unavailable' });
	}
}

module.exports = orderFulfillment;
module.exports.normalizeOrder = normalizeOrder;
module.exports.retentionSeconds = retentionSeconds;
module.exports.storeOrder = storeOrder;
module.exports.validSignature = validSignature;
