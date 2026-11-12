import { apiFetch, readJson } from './api';
import { SafeMessageError } from './userErrors';

const WITHDRAWAL_FALLBACK_ERROR = 'The withdrawal request could not be confirmed.';

export const submitWithdrawal = async (request, fetchImpl = fetch) => {
	const { captchaToken = '', ...fields } = request || {};
	const response = await apiFetch('/api/withdrawal', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...fields, captchaToken: String(captchaToken || '') }),
	}, fetchImpl);
	const data = await readJson(response);
	if (!response.ok) {
		throw new SafeMessageError(data.error, WITHDRAWAL_FALLBACK_ERROR);
	}
	return data;
};
