const PRODUCTS = {
	'windows-10': { name: 'Custom Windows 10 ISO', unitAmount: 6500 },
	'windows-11': { name: 'Custom Windows 11 ISO', unitAmount: 7500 },
	'bios-optimization': { name: 'BIOS Optimization Service', unitAmount: 5000 },
};

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

const createStripeForm = (items, origin) => {
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const discountRate = getDiscountRate(items.length);
	const form = new URLSearchParams();
	form.append('mode', 'payment');
	form.append('success_url', `${origin}/store?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
	form.append('cancel_url', `${origin}/checkout?checkout=cancelled`);
	form.append('allow_promotion_codes', 'true');
	form.append('billing_address_collection', 'auto');
	form.append('invoice_creation[enabled]', 'true');
	form.append('metadata[item_count]', String(itemCount));
	form.append('metadata[product_count]', String(items.length));
	form.append('metadata[bundle_discount_percent]', String(discountRate * 100));

	items.forEach((item, index) => {
		const product = PRODUCTS[item.id];
		const discountedUnitAmount = Math.round(product.unitAmount * (1 - discountRate));
		form.append(`line_items[${index}][quantity]`, String(item.quantity));
		form.append(`line_items[${index}][price_data][currency]`, 'eur');
		form.append(`line_items[${index}][price_data][unit_amount]`, String(discountedUnitAmount));
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

	if (!process.env.STRIPE_SECRET_KEY) {
		return res.status(503).json({ error: 'Stripe checkout is not configured' });
	}

	let items;
	try {
		items = normalizeItems(req.body?.items);
	} catch (error) {
		return res.status(400).json({ error: error.message });
	}

	let form;
	let discountRate;
	try {
		({ form, discountRate } = createStripeForm(items, getPublicOrigin()));
	} catch (error) {
		return res.status(503).json({ error: error.message });
	}
	try {
		const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: form,
		});

		const data = await response.json();
		if (!response.ok || !isStripeCheckoutUrl(data.url)) {
			return res.status(502).json({ error: data.error?.message || 'Stripe checkout failed' });
		}

		return res.status(200).json({ url: data.url, id: data.id, discountRate });
	} catch {
		return res.status(502).json({ error: 'Unable to reach Stripe. Please try again.' });
	}
}

module.exports = createCheckoutSession;
module.exports.PRODUCTS = PRODUCTS;
module.exports.getDiscountRate = getDiscountRate;
module.exports.normalizeItems = normalizeItems;
module.exports.createStripeForm = createStripeForm;
module.exports.getPublicOrigin = getPublicOrigin;
module.exports.isStripeCheckoutUrl = isStripeCheckoutUrl;
