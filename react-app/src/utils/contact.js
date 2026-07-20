import { apiFetch, readJson } from './api';

export const submitContactForm = async (formData, website = '', fetchImpl = fetch) => {
	const response = await apiFetch('/api/contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...formData, website }),
	}, fetchImpl);
	const data = await readJson(response);
	if (!response.ok) throw new Error(data.error || 'Message delivery failed. Please try again.');
	return data;
};
