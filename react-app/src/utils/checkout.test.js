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

	it('uses a new key after a definite server rejection', async () => {
		const cart = [{ id: 'windows-10', quantity: 7 }];
		const fetchImpl = vi.fn()
			.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Checkout is unavailable' }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cs_retry', url: 'https://checkout.stripe.com/retry' }) });
		await expect(createCheckoutSession(cart, legalAcceptance, fetchImpl)).rejects.toThrow('Checkout is unavailable');
		await createCheckoutSession(cart, legalAcceptance, fetchImpl);
		expect(fetchImpl.mock.calls[1][1].headers['Idempotency-Key'])
			.not.toBe(fetchImpl.mock.calls[0][1].headers['Idempotency-Key']);
	});

	it('reuses the same key after an uncertain failure and changes it when the cart changes', async () => {
		const cart = [{ id: 'windows-10', quantity: 3 }];
		const fetchImpl = vi.fn()
			.mockRejectedValueOnce(new Error('Network timeout'))
			.mockResolvedValue({ ok: true, json: async () => ({ id: 'cs_retry', url: 'https://checkout.stripe.com/retry' }) });
		await expect(createCheckoutSession(cart, legalAcceptance, fetchImpl)).rejects.toThrow('Network timeout');
		await createCheckoutSession(cart, legalAcceptance, fetchImpl);
		const firstKey = fetchImpl.mock.calls[0][1].headers['Idempotency-Key'];
		expect(fetchImpl.mock.calls[1][1].headers['Idempotency-Key']).toBe(firstKey);
		await createCheckoutSession([{ id: 'windows-10', quantity: 4 }], legalAcceptance, fetchImpl);
		expect(fetchImpl.mock.calls[2][1].headers['Idempotency-Key']).not.toBe(firstKey);
	});

	it('links checkout with an authenticated bearer token without adding user ids to the body', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'cs_test', url: 'https://checkout.stripe.com/test' }) });
		await createCheckoutSession([{ id: 'windows-11', quantity: 1 }], legalAcceptance, fetchImpl, 'verified-session-token');
		expect(fetchImpl).toHaveBeenCalledWith('/api/create-checkout-session', expect.objectContaining({
			headers: expect.objectContaining({ 'Content-Type': 'application/json', Authorization: 'Bearer verified-session-token', 'Idempotency-Key': expect.any(String) }),
			body: JSON.stringify({ items: [{ id: 'windows-11', quantity: 1 }], legalAcceptance }),
		}));
	});

	it('isolates uncertain retries by authenticated token without keeping the token in the lookup key', async () => {
		const cart = [{ id: 'windows-11', quantity: 8 }];
		const fetchImpl = vi.fn().mockRejectedValue(new Error('Network timeout'));
		for (const token of ['first-session-token', 'first-session-token', 'second-session-token']) {
			await expect(createCheckoutSession(cart, legalAcceptance, fetchImpl, token)).rejects.toThrow('Network timeout');
		}
		const keys = fetchImpl.mock.calls.map((call) => call[1].headers['Idempotency-Key']);
		expect(keys[1]).toBe(keys[0]);
		expect(keys[2]).not.toBe(keys[0]);
	});

	it('expires an uncertain retry after 23 hours', async () => {
		const cart = [{ id: 'windows-11', quantity: 9 }];
		const fetchImpl = vi.fn().mockRejectedValue(new Error('Network timeout'));
		vi.useFakeTimers();
		try {
			vi.setSystemTime(new Date('2026-09-29T00:00:00.000Z'));
			await expect(createCheckoutSession(cart, legalAcceptance, fetchImpl)).rejects.toThrow('Network timeout');
			vi.setSystemTime(new Date('2026-09-29T22:59:59.000Z'));
			await expect(createCheckoutSession(cart, legalAcceptance, fetchImpl)).rejects.toThrow('Network timeout');
			vi.setSystemTime(new Date('2026-09-29T23:00:00.000Z'));
			await expect(createCheckoutSession(cart, legalAcceptance, fetchImpl)).rejects.toThrow('Network timeout');
			const keys = fetchImpl.mock.calls.map((call) => call[1].headers['Idempotency-Key']);
			expect(keys[1]).toBe(keys[0]);
			expect(keys[2]).not.toBe(keys[0]);
		} finally {
			vi.useRealTimers();
		}
	});

	it('caps uncertain retry entries', async () => {
		const fetchImpl = vi.fn().mockRejectedValue(new Error('Network timeout'));
		const cartFor = (index) => [{ id: `test-product-${index}`, quantity: 1 }];
		for (let index = 0; index <= 100; index += 1) {
			await expect(createCheckoutSession(cartFor(index), legalAcceptance, fetchImpl)).rejects.toThrow('Network timeout');
		}
		await expect(createCheckoutSession(cartFor(0), legalAcceptance, fetchImpl)).rejects.toThrow('Network timeout');
		const keys = fetchImpl.mock.calls.map((call) => call[1].headers['Idempotency-Key']);
		expect(keys.at(-1)).not.toBe(keys[0]);
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
