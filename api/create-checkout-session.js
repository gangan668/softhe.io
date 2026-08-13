const { assertCommerceConfiguration } = require('./_lib/config');
const { fetchWithTimeout } = require('./_lib/fetch');
const { verifyActiveUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, jsonOnly, receiptToken, sendPublicError } = require('./_lib/portal-security');
const { claimKey, redisCommand } = require('./_lib/redis');

const PRODUCTS = {
	'windows-10': { name: 'Custom Windows 10 ISO', unitAmount: 6500 },
	'windows-11': { name: 'Custom Windows 11 ISO', unitAmount: 7500 },
	'bios-optimization': { name: 'BIOS Optimization Service', unitAmount: 5000 },
};

const TERMS_VERSION = '2026-07-20';
const WITHDRAWAL_NOTICE_VERSION = '2026-07-20';

const getDiscountRate = (itemCount) => (itemCount >= 3 ? 0.1 : itemCount >= 2 ? 0.05 : 0);

const normalizeItems = (items) => {
	if (!Array.isArray(items) || items.length === 0) {
		throw new Error('Cart is empty');
	}

	const merged = new Map();
	for (const item of items) {
		if (!item || !PRODUCTS[item.id]) {
			throw new Error(`Unknown product: ${item?.id || 'missing'}`);
		}

		const quantity = Number(item.quantity);
		if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
			throw new Error(`Invalid quantity for ${item.id}`);
		}
		merged.set(item.id, (merged.get(item.id) || 0) + quantity);
	}

	const normalized = [...merged].map(([id, quantity]) => ({ id, quantity }));
	if (normalized.some((item) => item.quantity > 10)) {
		throw new Error('Maximum quantity is 10 per product');
	}
	return normalized;
};

const getPublicOrigin = () => {
	const configuredUrl = process.env.PUBLIC_SITE_URL || 'https://softhe.io';
	try {
		const url = new URL(configuredUrl);
		if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
		return url.origin;
	} catch {
		throw new Error('PUBLIC_SITE_URL must be a valid HTTP(S) origin');
	}
};

const isStripeCheckoutUrl = (value) => {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
	} catch {
		return false;
	}
};

const validateLegalAcceptance = (legalAcceptance = {}) => {
	if (legalAcceptance.termsAccepted !== true) {
		throw new Error('Terms of Service must be accepted');
	}
	if (legalAcceptance.earlyPerformanceRequested !== true || legalAcceptance.withdrawalAcknowledged !== true) {
		throw new Error('Early delivery and withdrawal information must be acknowledged');
	}
	return {
		termsAccepted: true,
		earlyPerformanceRequested: true,
		withdrawalAcknowledged: true,
	};
};

const getVatStatus = () => {
	const vatStatus = process.env.VAT_STATUS;
	if (!['registered', 'not-registered', 'exempt'].includes(vatStatus)) {
		throw new Error('VAT status is not configured');
	}
	return vatStatus;
};

const getIdempotentAcceptedAt = async (idempotencyKey, now = new Date(), store = { claimKey, redisCommand }) => {
	const key = `checkout:accepted-at:${idempotencyKey}`;
	const proposed = now.toISOString();
	if (await store.claimKey(key, proposed, 86400)) return proposed;
	const existing = await store.redisCommand(['GET', key]);
	if (typeof existing !== 'string' || Number.isNaN(Date.parse(existing))) {
		throw new Error('Checkout idempotency state is unavailable');
	}
	return existing;
};

const createStripeForm = (items, origin, acceptedAt = new Date().toISOString(), vatStatus = 'not-registered', customer = null) => {
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const discountRate = getDiscountRate(items.length);
	const form = new URLSearchParams();
	form.append('mode', 'payment');
	form.append('success_url', `${origin}/store?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
	form.append('cancel_url', `${origin}/checkout?checkout=cancelled`);
	form.append('allow_promotion_codes', 'true');
	form.append('billing_address_collection', 'auto');
	form.append('invoice_creation[enabled]', 'true');
	form.append('customer_creation', 'always');
	if (customer) {
		form.append('customer_email', customer.email);
		form.append('client_reference_id', customer.id);
		form.append('metadata[portal_user_id]', customer.id);
	}
	if (vatStatus === 'registered') form.append('automatic_tax[enabled]', 'true');
	form.append('metadata[item_count]', String(itemCount));
	form.append('metadata[product_count]', String(items.length));
	form.append('metadata[bundle_discount_percent]', String(discountRate * 100));
	// Session metadata is set only after server-side cart validation. Stripe includes
	// it in the signed webhook event, making this the authoritative fulfillment list.
	form.append('metadata[order_schema]', '1');
	form.append('metadata[order_items]', JSON.stringify(items));
	form.append('metadata[terms_version]', TERMS_VERSION);
	form.append('metadata[withdrawal_notice_version]', WITHDRAWAL_NOTICE_VERSION);
	form.append('metadata[terms_accepted]', 'true');
	form.append('metadata[early_performance_requested]', 'true');
	form.append('metadata[withdrawal_acknowledged]', 'true');
	form.append('metadata[legal_acceptance_recorded_at]', acceptedAt);
	form.append('metadata[vat_status]', vatStatus);

	items.forEach((item, index) => {
		const product = PRODUCTS[item.id];
		const discountedUnitAmount = Math.round(product.unitAmount * (1 - discountRate));
		form.append(`line_items[${index}][quantity]`, String(item.quantity));
		form.append(`line_items[${index}][price_data][currency]`, 'eur');
		form.append(`line_items[${index}][price_data][unit_amount]`, String(discountedUnitAmount));
		if (vatStatus === 'registered') form.append(`line_items[${index}][price_data][tax_behavior]`, 'inclusive');
		form.append(`line_items[${index}][price_data][product_data][name]`, product.name);
		form.append(`line_items[${index}][price_data][product_data][metadata][product_id]`, item.id);
	});

	return { form, discountRate };
};

async function createCheckoutSession(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	if (process.env.COMMERCE_ENABLED !== 'true') {
		return res.status(503).json({ error: 'Checkout is not available' });
	}

	if (!process.env.STRIPE_SECRET_KEY) {
		return res.status(503).json({ error: 'Stripe checkout is not configured' });
	}
	try { jsonOnly(req, 32768); } catch (error) { return sendPublicError(res, error); }
	const idempotencyKey = String(req.headers?.['idempotency-key'] || '').trim();
	if (!/^[A-Za-z0-9_-]{20,100}$/.test(idempotencyKey)) return res.status(400).json({ error: 'A valid idempotency key is required' });
	try {
		assertCommerceConfiguration();
	} catch (error) {
		return res.status(503).json({ error: error.message });
	}

	let items;
	try {
		items = normalizeItems(req.body?.items);
		validateLegalAcceptance(req.body?.legalAcceptance);
	} catch (error) {
		return res.status(400).json({ error: error.message });
	}

	let form;
	let discountRate;
	try {
		const customer = await verifyActiveUser(req, { required: false });
		if (customer && !customer.email_confirmed_at) return res.status(403).json({ error: 'Verify your email before linking this order' });
		const [, , acceptedAt] = await Promise.all([
			enforceRateLimit('checkout:actor', customer?.id || clientIp(req), 10, 600),
			enforceRateLimit('checkout:ip', clientIp(req), 10, 600),
			getIdempotentAcceptedAt(idempotencyKey),
		]);
		({ form, discountRate } = createStripeForm(items, getPublicOrigin(), acceptedAt, getVatStatus(), customer));
	} catch (error) {
		return sendPublicError(res, error, 'Checkout could not be started. Please try again.');
	}
	try {
		const response = await fetchWithTimeout('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				'Idempotency-Key': idempotencyKey,
			},
			body: form,
		});

		const data = await response.json();
		if (!response.ok || !isStripeCheckoutUrl(data.url)) {
			console.error('checkout_session_creation_failed', {
				status: response.status,
				type: data.error?.type || null,
				code: data.error?.code || null,
			});
			return res.status(502).json({ error: 'Checkout could not be started. Please try again.' });
		}

		return res.status(200).json({ url: data.url, id: data.id, discountRate, receiptToken: receiptToken(data.id) });
	} catch (error) {
		console.error('checkout_session_creation_failed', { status: null, message: error.message });
		return sendPublicError(res, Object.assign(error, { statusCode: 502 }), 'Unable to reach Stripe. Please try again.');
	}
}

module.exports = createCheckoutSession;
module.exports.PRODUCTS = PRODUCTS;
module.exports.TERMS_VERSION = TERMS_VERSION;
module.exports.WITHDRAWAL_NOTICE_VERSION = WITHDRAWAL_NOTICE_VERSION;
module.exports.getDiscountRate = getDiscountRate;
module.exports.normalizeItems = normalizeItems;
module.exports.createStripeForm = createStripeForm;
module.exports.getPublicOrigin = getPublicOrigin;
module.exports.getVatStatus = getVatStatus;
module.exports.getIdempotentAcceptedAt = getIdempotentAcceptedAt;
module.exports.isStripeCheckoutUrl = isStripeCheckoutUrl;
module.exports.validateLegalAcceptance = validateLegalAcceptance;
