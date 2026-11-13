import { describe, expect, it, vi } from 'vitest';
import { staffRequest } from './staff';

describe('staffRequest', () => {
	it('adds authentication and replay protection to privileged mutations', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ updated: true }) });
		await staffRequest({ access_token: 'token' }, 'status', {
			method: 'POST', body: { ticketId: 'ticket', status: 'closed' },
		}, fetchImpl);
		expect(fetchImpl).toHaveBeenCalledWith('/api/staff?action=status', expect.objectContaining({
			method: 'POST',
			headers: expect.objectContaining({
				Authorization: 'Bearer token',
				'Idempotency-Key': expect.stringMatching(/^[0-9a-f-]{36}$/i),
			}),
		}));
	});

	it('caps server error messages and ignores non-string errors', async () => {
		const huge = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'x'.repeat(5000) }) });
		const error = await staffRequest({ access_token: 'token' }, 'queue', {}, huge).catch((caught) => caught);
		expect(error.safeMessage).toBe(true);
		expect(error.message.length).toBeLessThanOrEqual(200);
		const nonString = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { detail: 'internal' } }) });
		await expect(staffRequest({ access_token: 'token' }, 'queue', {}, nonString)).rejects.toThrow('Staff request failed');
	});
});
