const PRODUCTS = {
	'windows-10': {
		name: 'Custom Windows 10 ISO',
		unit_amount: 6500,
	},
	'windows-11': {
		name: 'Custom Windows 11 ISO',
		unit_amount: 7500,
	},
	'bios-optimization': {
		name: 'BIOS Optimization Service',
		unit_amount: 5000,
	},
};

const getOrigin = (req) => {
	const forwardedHost = req.headers['x-forwarded-host'];
	const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
	if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
	return process.env.PUBLIC_SITE_URL || 'https://softhe.io';
};

module.exports = async function createCheckoutSession(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	if (!process.env.STRIPE_SECRET_KEY) {
		return res.status(500).json({ error: 'Stripe is not configured' });
	}

	const { items = [] } = req.body || {};
	if (!Array.isArray(items) || items.length === 0) {
		return res.status(400).json({ error: 'Cart is empty' });
	}

	const normalizedItems = items.map((item) => ({
		id: item.id,
		quantity: Math.max(1, Math.min(Number(item.quantity || 1), 10)),
	}));

	const invalidItem = normalizedItems.find((item) => !PRODUCTS[item.id]);
	if (invalidItem) {
		return res.status(400).json({ error: `Unknown product: ${invalidItem.id}` });
	}

	const origin = getOrigin(req);
	const form = new URLSearchParams();
	form.append('mode', 'payment');
	form.append('success_url', `${origin}/store?checkout=success`);
	form.append('cancel_url', `${origin}/checkout?checkout=cancelled`);
	form.append('allow_promotion_codes', 'true');

	normalizedItems.forEach((item, index) => {
		const product = PRODUCTS[item.id];
		form.append(`line_items[${index}][quantity]`, String(item.quantity));
		form.append(`line_items[${index}][price_data][currency]`, 'eur');
		form.append(`line_items[${index}][price_data][unit_amount]`, String(product.unit_amount));
		form.append(`line_items[${index}][price_data][product_data][name]`, product.name);
	});

	const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: form,
	});

	const data = await response.json();
	if (!response.ok) {
		return res.status(502).json({ error: data.error?.message || 'Stripe checkout failed' });
	}

	return res.status(200).json({ url: data.url, id: data.id });
};
