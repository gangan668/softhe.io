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
});
