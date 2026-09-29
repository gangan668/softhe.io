import { apiFetch, readJson } from './api';

const pendingCheckoutKeys = new Map();
const RETRY_KEY_TTL_MS = 23 * 60 * 60 * 1000;
const MAX_PENDING_CHECKOUTS = 100;

const checkoutScope = async (accessToken) => {
	if (!accessToken) return 'anonymous';
	const bytes = new TextEncoder().encode(accessToken);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const prunePendingCheckouts = (now) => {
	for (const [key, entry] of pendingCheckoutKeys) {
		if (now - entry.createdAt >= RETRY_KEY_TTL_MS) pendingCheckoutKeys.delete(key);
	}
};

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
	const requestKey = JSON.stringify({ items, legalAcceptance, scope: await checkoutScope(accessToken) });
	const now = Date.now();
	prunePendingCheckouts(now);
	const existing = pendingCheckoutKeys.get(requestKey);
	if (!existing) {
		while (pendingCheckoutKeys.size >= MAX_PENDING_CHECKOUTS) {
			pendingCheckoutKeys.delete(pendingCheckoutKeys.keys().next().value);
		}
	}
	const entry = existing || { idempotencyKey: crypto.randomUUID(), createdAt: now };
	pendingCheckoutKeys.set(requestKey, entry);
	const response = await apiFetch('/api/create-checkout-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Idempotency-Key': entry.idempotencyKey, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
		body: JSON.stringify({
			items,
			legalAcceptance,
		}),
	}, fetchImpl);

	const data = await readJson(response);
	if (!response.ok) {
		if (pendingCheckoutKeys.get(requestKey) === entry) pendingCheckoutKeys.delete(requestKey);
		throw new Error(data.error || 'Checkout could not be started. Please try again.');
	}
	if (!isStripeCheckoutUrl(data.url)) {
		throw new Error(data.error || 'Checkout could not be started. Please try again.');
	}
	if (pendingCheckoutKeys.get(requestKey) === entry) pendingCheckoutKeys.delete(requestKey);
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
