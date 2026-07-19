import { describe, expect, it, vi } from 'vitest';
import { submitContactForm } from './contact';

describe('submitContactForm', () => {
	it('submits contact data to the server boundary', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ delivered: true }),
		});
		const form = { name: 'Jane Doe', email: 'jane@example.com', subject: 'general', message: 'Hello there.' };

		await expect(submitContactForm(form, '', fetchImpl)).resolves.toEqual({ delivered: true });
		expect(fetchImpl).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
			method: 'POST',
			body: JSON.stringify({ ...form, website: '' }),
		}));
	});

	it('surfaces server validation and rate-limit messages', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ error: 'Too many messages. Please wait one minute.' }),
		});

		await expect(submitContactForm({}, '', fetchImpl)).rejects.toThrow('Too many messages');
	});
});
