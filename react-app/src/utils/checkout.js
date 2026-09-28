import { apiFetch, readJson } from './api';

const pendingCheckoutKeys = new Map();

export const isStripeCheckoutUrl = (value) => {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
	} catch {
		return false;
	}
};

export const createCheckoutSession = async (cart, legalAcceptance, fetchImpl = fetch, accessToken = null) => {
	const items = cart.map(({ id, quantity }) => ({ id, quantity })).sort((left, right) => left.id.localeCompare(right.id));
	const requestKey = JSON.stringify({ items, legalAcceptance, accessToken });
	const idempotencyKey = pendingCheckoutKeys.get(requestKey) || crypto.randomUUID();
	pendingCheckoutKeys.set(requestKey, idempotencyKey);
	const response = await apiFetch('/api/create-checkout-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
		body: JSON.stringify({
			items,
			legalAcceptance,
		}),
	}, fetchImpl);

	const data = await readJson(response);
	if (!response.ok || !isStripeCheckoutUrl(data.url)) {
		throw new Error(data.error || 'Checkout could not be started. Please try again.');
	}
	pendingCheckoutKeys.delete(requestKey);
	if (data.id && data.receiptToken && typeof sessionStorage !== 'undefined') sessionStorage.setItem(`softhe:checkout:${data.id}`, data.receiptToken);
	return data;
};

export const verifyCheckoutSession = async (sessionId, fetchImpl = fetch, accessToken = null) => {
	const receipt = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(`softhe:checkout:${sessionId}`);
	const response = await apiFetch(
		`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`,
		{ headers: { Accept: 'application/json', ...(receipt ? { 'X-Checkout-Receipt': receipt } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) } },
		fetchImpl,
	);
	const data = await readJson(response);
	if (!response.ok) {
		throw new Error(data.error || 'Checkout could not be verified. Please try again.');
	}
	return data;
};
