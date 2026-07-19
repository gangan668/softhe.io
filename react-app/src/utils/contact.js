const getApiBaseUrl = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export const submitContactForm = async (formData, website = '', fetchImpl = fetch) => {
	const response = await fetchImpl(`${getApiBaseUrl()}/api/contact`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...formData, website }),
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || 'Message delivery failed. Please try again.');
	return data;
};
