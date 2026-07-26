import { describe, expect, it, vi } from 'vitest';
import { notifyTicketReply } from './portal';

describe('notifyTicketReply', () => {
	it('does nothing without an authenticated session', async () => {
		const fetchImpl = vi.fn();
		await expect(notifyTicketReply(null, { ticketId: 'ticket' }, fetchImpl)).resolves.toBe(false);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('authenticates the notification request', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
		await expect(notifyTicketReply({ access_token: 'token' }, { messageId: 'message' }, fetchImpl)).resolves.toBe(true);
		expect(fetchImpl).toHaveBeenCalledWith('/api/ticket-notification', expect.objectContaining({
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
			body: JSON.stringify({ messageId: 'message' }),
		}));
	});

	it('reports a failed notification response', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: false });
		await expect(notifyTicketReply({ access_token: 'token' }, { messageId: 'message' }, fetchImpl)).resolves.toBe(false);
	});
});
