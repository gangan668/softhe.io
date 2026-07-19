const getApiBaseUrl = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export const isStripeCheckoutUrl = (value) => {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
	} catch {
		return false;
	}
};

export const createCheckoutSession = async (cart, fetchImpl = fetch) => {
	const response = await fetchImpl(`${getApiBaseUrl()}/api/create-checkout-session`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			items: cart.map(({ id, quantity }) => ({ id, quantity })),
		}),
	});

	const data = await response.json().catch(() => ({}));
	if (!response.ok || !isStripeCheckoutUrl(data.url)) {
		throw new Error(data.error || 'Checkout could not be started. Please try again.');
	}
	return data;
};

export const verifyCheckoutSession = async (sessionId, fetchImpl = fetch) => {
	const response = await fetchImpl(
		`${getApiBaseUrl()}/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`,
		{ headers: { Accept: 'application/json' } },
	);
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data.error || 'Checkout could not be verified. Please try again.');
	}
	return data;
};
