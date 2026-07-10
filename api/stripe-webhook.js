const crypto = require('node:crypto');

const readRawBody = async (req) => {
	if (Buffer.isBuffer(req.body)) return req.body;
	const chunks = [];
	for await (const chunk of req) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks);
};

const verifyStripeSignature = (payload, signatureHeader, secret, toleranceSeconds = 300) => {
	if (!signatureHeader || !secret) return false;
	const parts = signatureHeader.split(',').map((part) => part.split('='));
	const timestamp = parts.find(([key]) => key === 't')?.[1];
	const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
	if (!timestamp || signatures.length === 0) return false;
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) return false;

	const expected = crypto
		.createHmac('sha256', secret)
		.update(`${timestamp}.${payload.toString('utf8')}`)
		.digest('hex');

	return signatures.some((signature) => {
		if (signature.length !== expected.length) return false;
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
	});
};

async function stripeWebhook(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		return res.status(503).json({ error: 'Stripe webhook is not configured' });
	}

	const payload = await readRawBody(req);
	if (!verifyStripeSignature(payload, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) {
		return res.status(400).json({ error: 'Invalid Stripe signature' });
	}

	let event;
	try {
		event = JSON.parse(payload.toString('utf8'));
	} catch {
		return res.status(400).json({ error: 'Invalid JSON payload' });
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		console.info('Stripe checkout completed', {
			sessionId: session.id,
			paymentStatus: session.payment_status,
			amountTotal: session.amount_total,
			customerEmail: session.customer_details?.email || null,
		});
	} else if (event.type === 'checkout.session.expired') {
		console.info('Stripe checkout expired', { sessionId: event.data.object.id });
	}

	return res.status(200).json({ received: true });
}

module.exports = stripeWebhook;
module.exports.config = { api: { bodyParser: false } };
module.exports.verifyStripeSignature = verifyStripeSignature;
