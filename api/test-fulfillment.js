const crypto = require('node:crypto');
const { redisCommand } = require('./_lib/redis');

const MAX_BODY_BYTES = 64 * 1024;
const SESSION_ID = /^cs_(?:test_)?[A-Za-z0-9]{8,}$/;
const HEX_SIGNATURE = /^[a-f0-9]{64}$/;

const isEnabled = () => process.env.VERCEL_ENV === 'preview' && process.env.FULFILLMENT_TEST_MODE === 'true';

const getRetentionSeconds = () => {
	const days = Number(process.env.FULFILLMENT_TEST_RETENTION_DAYS || 30);
	return Number.isInteger(days) && days >= 1 && days <= 90 ? days * 86400 : 30 * 86400;
};

const readRawBody = async (req) => {
	if (Buffer.isBuffer(req.body)) {
		if (req.body.length > MAX_BODY_BYTES) throw Object.assign(new Error('Payload is too large'), { statusCode: 413 });
		return req.body;
	}
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

const verifySignature = (payload, signature, secret) => {
	if (!secret || !HEX_SIGNATURE.test(String(signature || ''))) return false;
	const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
	return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

const normalizeOrder = (body) => {
	if (!body || !SESSION_ID.test(String(body.sessionId || ''))) throw new Error('Invalid session ID');
	if (!Number.isInteger(body.amountTotal) || body.amountTotal < 0) throw new Error('Invalid order amount');
	if (!/^[a-z]{3}$/i.test(String(body.currency || ''))) throw new Error('Invalid currency');
	if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) throw new Error('Invalid order items');
	const items = body.items.map((item) => {
		if (!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new Error('Invalid order item');
		return { id: item.id.slice(0, 80), quantity: item.quantity };
	});
	return {
		sessionId: body.sessionId,
		amountTotal: body.amountTotal,
		currency: body.currency.toLowerCase(),
		paymentIntentId: typeof body.paymentIntentId === 'string' ? body.paymentIntentId.slice(0, 120) : null,
		items,
		receivedAt: new Date().toISOString(),
	};
};

const recordOrder = async (order) => {
	const ttl = getRetentionSeconds();
	const recordKey = `test:fulfillment:order:${order.sessionId}`;
	const attemptsKey = `test:fulfillment:attempts:${order.sessionId}`;
	const script = [
		"local attempts = redis.call('INCR', KEYS[2])",
		"if attempts == 1 then redis.call('EXPIRE', KEYS[2], ARGV[2]) end",
		"if ARGV[3] == 'true' and attempts == 1 then return {'retry', tostring(attempts)} end",
		"if redis.call('EXISTS', KEYS[1]) == 1 then return {'duplicate', tostring(attempts)} end",
		"redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])",
		"return {'accepted', tostring(attempts)}",
	].join(' ');
	const result = await redisCommand(['EVAL', script, 2, recordKey, attemptsKey, JSON.stringify(order), ttl, process.env.FULFILLMENT_TEST_FAIL_FIRST === 'true' ? 'true' : 'false']);
	return { status: result?.[0], attempts: Number(result?.[1]) };
};

const readEvidence = async (sessionId) => {
	const [record, attempts] = await redisCommand(['MGET', `test:fulfillment:order:${sessionId}`, `test:fulfillment:attempts:${sessionId}`]);
	return { order: record ? JSON.parse(record) : null, attempts: Number(attempts || 0) };
};

async function testFulfillment(req, res) {
	res.setHeader('Cache-Control', 'no-store');
	if (!isEnabled()) return res.status(404).json({ error: 'Not found' });

	if (req.method === 'GET') {
		const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
		if (!process.env.FULFILLMENT_TEST_EVIDENCE_TOKEN || token !== process.env.FULFILLMENT_TEST_EVIDENCE_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
		const sessionId = Array.isArray(req.query?.session_id) ? '' : req.query?.session_id;
		if (!SESSION_ID.test(String(sessionId || ''))) return res.status(400).json({ error: 'Invalid session ID' });
		try { return res.status(200).json(await readEvidence(sessionId)); }
		catch (error) { return res.status(503).json({ error: error.message }); }
	}

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'GET, POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const payload = await readRawBody(req);
		if (!verifySignature(payload, req.headers['x-softhe-signature'], process.env.ORDER_FULFILLMENT_WEBHOOK_SECRET)) return res.status(401).json({ error: 'Invalid signature' });
		const order = normalizeOrder(JSON.parse(payload.toString('utf8')));
		if (req.headers['idempotency-key'] !== order.sessionId) return res.status(400).json({ error: 'Invalid idempotency key' });
		const result = await recordOrder(order);
		if (result.status === 'retry') return res.status(503).json({ accepted: false, retry: true, attempts: result.attempts });
		if (result.status === 'duplicate') return res.status(200).json({ accepted: true, duplicate: true, attempts: result.attempts });
		if (result.status !== 'accepted') throw new Error('Unexpected durable storage response');
		return res.status(202).json({ accepted: true, duplicate: false, attempts: result.attempts });
	} catch (error) {
		if (error instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON' });
		const status = error.statusCode || (/^Invalid /.test(error.message) ? 400 : 503);
		return res.status(status).json({ error: error.message });
	}
}

module.exports = testFulfillment;
module.exports.config = { api: { bodyParser: false } };
module.exports.getRetentionSeconds = getRetentionSeconds;
module.exports.isEnabled = isEnabled;
module.exports.normalizeOrder = normalizeOrder;
module.exports.readEvidence = readEvidence;
module.exports.readRawBody = readRawBody;
module.exports.recordOrder = recordOrder;
module.exports.verifySignature = verifySignature;

