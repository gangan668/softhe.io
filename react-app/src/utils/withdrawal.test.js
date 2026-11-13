import { describe, expect, it, vi } from 'vitest';
import { submitWithdrawal } from './withdrawal';

const request = { orderReference: 'cs_test_12345678', email: 'jane@example.com', requestedItems: ['entire-order'], comments: '', website: '' };

describe('submitWithdrawal', () => {
	it('includes the Turnstile token in the request body', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({ requestId: 'WR-1' }) });

		await expect(submitWithdrawal({ ...request, captchaToken: 'turnstile-token' }, fetchImpl)).resolves.toEqual({ requestId: 'WR-1' });
		expect(fetchImpl).toHaveBeenCalledWith('/api/withdrawal', expect.objectContaining({ method: 'POST' }));
		expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ ...request, captchaToken: 'turnstile-token' });
	});

	it('sends an empty token string when captcha is disabled', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
		await submitWithdrawal(request, fetchImpl);
		expect(JSON.parse(fetchImpl.mock.calls[0][1].body).captchaToken).toBe('');
	});

	it('surfaces sanitized server errors and falls back for unusable ones', async () => {
		const rejected = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Security verification failed. Please try again.' }) });
		await expect(submitWithdrawal(request, rejected)).rejects.toThrow('Security verification failed. Please try again.');

		const empty = vi.fn().mockResolvedValue({ ok: false, json: async () => { throw new Error('not json'); } });
		await expect(submitWithdrawal(request, empty)).rejects.toThrow('The withdrawal request could not be confirmed.');
	});
});
