import { describe, expect, it, vi } from 'vitest';
import { createCheckoutSession } from './checkout';

describe('createCheckoutSession', () => {
	it('sends only product identifiers and quantities to the server', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ id: 'cs_test', url: 'https://checkout.stripe.com/test' }),
		});

		const result = await createCheckoutSession([
			{ id: 'windows-10', name: 'Untrusted name', price: 1, quantity: 2 },
		], fetchImpl);

		expect(fetchImpl).toHaveBeenCalledWith('/api/create-checkout-session', expect.objectContaining({
			method: 'POST',
			body: JSON.stringify({ items: [{ id: 'windows-10', quantity: 2 }] }),
		}));
		expect(result.url).toBe('https://checkout.stripe.com/test');
	});

	it('surfaces the server error message', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ error: 'Stripe checkout is not configured' }),
		});

		await expect(createCheckoutSession([{ id: 'windows-10', quantity: 1 }], fetchImpl))
			.rejects.toThrow('Stripe checkout is not configured');
	});
});
