const getApiBaseUrl = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export const createCheckoutSession = async (cart, fetchImpl = fetch) => {
	const response = await fetchImpl(`${getApiBaseUrl()}/api/create-checkout-session`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			items: cart.map(({ id, quantity }) => ({ id, quantity })),
		}),
	});

	const data = await response.json().catch(() => ({}));
	if (!response.ok || !data.url) {
		throw new Error(data.error || 'Checkout could not be started. Please try again.');
	}
	return data;
};
