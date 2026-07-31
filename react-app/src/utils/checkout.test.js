import { describe, expect, it, vi } from 'vitest';
import { createCheckoutSession, verifyCheckoutSession } from './checkout';

describe('createCheckoutSession', () => {
	const legalAcceptance = { termsAccepted: true, earlyPerformanceRequested: true, withdrawalAcknowledged: true };

	it('sends only product identifiers and quantities to the server', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ id: 'cs_test', url: 'https://checkout.stripe.com/test' }),
		});

		const result = await createCheckoutSession([
			{ id: 'windows-10', name: 'Untrusted name', price: 1, quantity: 2 },
		], legalAcceptance, fetchImpl);

		expect(fetchImpl).toHaveBeenCalledWith('/api/create-checkout-session', expect.objectContaining({
			method: 'POST',
			body: JSON.stringify({ items: [{ id: 'windows-10', quantity: 2 }], legalAcceptance }),
		}));
		expect(result.url).toBe('https://checkout.stripe.com/test');
	});

	it('surfaces the server error message', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ error: 'Stripe checkout is not configured' }),
		});

		await expect(createCheckoutSession([{ id: 'windows-10', quantity: 1 }], legalAcceptance, fetchImpl))
			.rejects.toThrow('Stripe checkout is not configured');
	});

	it('links checkout with an authenticated bearer token without adding user ids to the body', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'cs_test', url: 'https://checkout.stripe.com/test' }) });
		await createCheckoutSession([{ id: 'windows-11', quantity: 1 }], legalAcceptance, fetchImpl, 'verified-session-token');
		expect(fetchImpl).toHaveBeenCalledWith('/api/create-checkout-session', expect.objectContaining({
			headers: expect.objectContaining({ 'Content-Type': 'application/json', Authorization: 'Bearer verified-session-token', 'Idempotency-Key': expect.any(String) }),
			body: JSON.stringify({ items: [{ id: 'windows-11', quantity: 1 }], legalAcceptance }),
		}));
	});

	it('rejects a successful response that does not point to Stripe Checkout', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ url: 'https://attacker.example/checkout' }),
		});

		await expect(createCheckoutSession([{ id: 'windows-10', quantity: 1 }], legalAcceptance, fetchImpl))
			.rejects.toThrow('Checkout could not be started');
	});
});

describe('verifyCheckoutSession', () => {
	it('returns server-verified payment state', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ id: 'cs_test_12345678', paid: true, status: 'complete' }),
		});
		await expect(verifyCheckoutSession('cs_test_12345678', fetchImpl)).resolves.toEqual(
			expect.objectContaining({ paid: true, status: 'complete' }),
		);
		expect(fetchImpl).toHaveBeenCalledWith(
			'/api/checkout-session?session_id=cs_test_12345678',
			expect.objectContaining({ headers: { Accept: 'application/json' } }),
		);
	});

	it('does not turn a failed verification into success', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ error: 'Checkout session could not be verified' }),
		});
		await expect(verifyCheckoutSession('cs_test_12345678', fetchImpl)).rejects.toThrow('could not be verified');
	});
});
