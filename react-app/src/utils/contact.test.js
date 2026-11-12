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
			body: JSON.stringify({ ...form, website: '', captchaToken: '' }),
		}));
	});

	it('surfaces server validation and rate-limit messages', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ error: 'Too many messages. Please wait one minute.' }),
		});

		await expect(submitContactForm({}, '', fetchImpl)).rejects.toThrow('Too many messages');
	});

	it('includes the Turnstile token in the request body when provided', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ delivered: true }) });
		const form = { name: 'Jane Doe', email: 'jane@example.com', subject: 'general', message: 'Hello there.' };

		await submitContactForm({ ...form, captchaToken: 'turnstile-token' }, '', fetchImpl);
		const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
		expect(body).toEqual({ ...form, website: '', captchaToken: 'turnstile-token' });
	});

	it('surfaces the security verification failure and caps oversized server messages', async () => {
		const failing = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Security verification failed. Please try again.' }) });
		await expect(submitContactForm({}, '', failing)).rejects.toThrow('Security verification failed. Please try again.');

		const huge = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'x'.repeat(5000) }) });
		const error = await submitContactForm({}, '', huge).catch((caught) => caught);
		expect(error.message.length).toBeLessThanOrEqual(200);

		const nonString = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { detail: 'internal' } }) });
		await expect(submitContactForm({}, '', nonString)).rejects.toThrow('Message delivery failed. Please try again.');
	});
});
