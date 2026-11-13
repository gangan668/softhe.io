import { apiFetch, readJson } from './api';
import { SafeMessageError } from './userErrors';

const CONTACT_FALLBACK_ERROR = 'Message delivery failed. Please try again.';

export const submitContactForm = async (formData, website = '', fetchImpl = fetch) => {
	const { captchaToken = '', ...fields } = formData || {};
	const response = await apiFetch('/api/contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...fields, website, captchaToken: String(captchaToken || '') }),
	}, fetchImpl);
	const data = await readJson(response);
	if (!response.ok) throw new SafeMessageError(data.error, CONTACT_FALLBACK_ERROR);
	return data;
};
