import { apiFetch, readJson } from './api';

export const isStripeCheckoutUrl = (value) => {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
	} catch {
		return false;
	}
};

export const createCheckoutSession = async (cart, legalAcceptance, fetchImpl = fetch, accessToken = null) => {
	const response = await apiFetch('/api/create-checkout-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
		body: JSON.stringify({
			items: cart.map(({ id, quantity }) => ({ id, quantity })),
			legalAcceptance,
		}),
	}, fetchImpl);

	const data = await readJson(response);
	if (!response.ok || !isStripeCheckoutUrl(data.url)) {
		throw new Error(data.error || 'Checkout could not be started. Please try again.');
	}
	return data;
};

export const verifyCheckoutSession = async (sessionId, fetchImpl = fetch) => {
	const response = await apiFetch(
		`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`,
		{ headers: { Accept: 'application/json' } },
		fetchImpl,
	);
	const data = await readJson(response);
	if (!response.ok) {
		throw new Error(data.error || 'Checkout could not be verified. Please try again.');
	}
	return data;
};
