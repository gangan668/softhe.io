const { normalizeItems } = require('./create-checkout-session');
const { fetchWithTimeout } = require('./_lib/fetch');

const CHECKOUT_SESSION_ID = /^cs_(?:test_|live_)?[A-Za-z0-9]{8,}$/;

const getVerifiedOrderItems = (session) => {
	if (session.metadata?.order_schema !== '1' || !session.metadata?.order_items) return null;
	try {
		return normalizeItems(JSON.parse(session.metadata.order_items));
	} catch {
		return null;
	}
};

async function checkoutSession(req, res) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	if (!process.env.STRIPE_SECRET_KEY) {
		return res.status(503).json({ error: 'Stripe checkout is not configured' });
	}

	const sessionId = Array.isArray(req.query?.session_id) ? '' : req.query?.session_id;
	if (typeof sessionId !== 'string' || !CHECKOUT_SESSION_ID.test(sessionId)) {
		return res.status(400).json({ error: 'Invalid checkout session' });
	}

	try {
		const response = await fetchWithTimeout(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
			headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
		});
		const session = await response.json();
		if (!response.ok) {
			return res.status(response.status === 404 ? 404 : 502).json({ error: 'Checkout session could not be verified' });
		}

		const items = getVerifiedOrderItems(session);
		if (!items) {
			return res.status(409).json({ error: 'Checkout session is not a Softhe order' });
		}
		const paid = ['paid', 'no_payment_required'].includes(session.payment_status);
		return res.status(200).json({
			id: session.id,
			status: paid ? 'complete' : session.status === 'expired' ? 'expired' : 'processing',
			paid,
			items,
			amountTotal: session.amount_total,
			currency: session.currency,
		});
	} catch (error) {
		console.error('checkout_session_verification_failed', { sessionId, message: error.message });
		return res.status(502).json({ error: 'Unable to verify checkout. Please try again.' });
	}
}

module.exports = checkoutSession;
module.exports.CHECKOUT_SESSION_ID = CHECKOUT_SESSION_ID;
module.exports.getVerifiedOrderItems = getVerifiedOrderItems;
