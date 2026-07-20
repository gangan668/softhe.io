import { apiFetch, readJson } from './api';

export const submitWithdrawal = async (request, fetchImpl = fetch) => {
	const response = await apiFetch('/api/withdrawal', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
	}, fetchImpl);
	const data = await readJson(response);
	if (!response.ok) {
		throw new Error(data.error || 'The withdrawal request could not be confirmed.');
	}
	return data;
};
