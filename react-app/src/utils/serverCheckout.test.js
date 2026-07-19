import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PRODUCTS as clientProducts } from '../data/products';

const require = createRequire(import.meta.url);
const { PRODUCTS: serverProducts, createStripeForm, getDiscountRate, getPublicOrigin, isStripeCheckoutUrl, normalizeItems } = require('../../../api/create-checkout-session.js');
const { verifyStripeSignature } = require('../../../api/stripe-webhook.js');

describe('server checkout validation', () => {
	it('keeps client display prices aligned with server-authoritative prices', () => {
		const clientPriceById = Object.fromEntries(clientProducts.map(({ id, price }) => [id, price * 100]));
		const serverPriceById = Object.fromEntries(Object.entries(serverProducts).map(([id, product]) => [id, product.unitAmount]));
		expect(clientPriceById).toEqual(serverPriceById);
	});

	it('rejects unknown products and invalid quantities', () => {
		expect(() => normalizeItems([{ id: 'made-up', quantity: 1 }])).toThrow('Unknown product');
		expect(() => normalizeItems([{ id: 'windows-10', quantity: 0 }])).toThrow('Invalid quantity');
	});

	it('applies bundle pricing to authoritative server prices', () => {
		const items = normalizeItems([
			{ id: 'windows-10', quantity: 1 },
			{ id: 'bios-optimization', quantity: 1 },
		]);
		const { form, discountRate } = createStripeForm(items, 'https://softhe.io');

		expect(getDiscountRate(2)).toBe(0.05);
		expect(discountRate).toBe(0.05);
		expect(form.get('line_items[0][price_data][unit_amount]')).toBe('6175');
		expect(form.get('line_items[1][price_data][unit_amount]')).toBe('4750');
		expect(form.get('metadata[order_schema]')).toBe('1');
		expect(JSON.parse(form.get('metadata[order_items]'))).toEqual(items);
	});

	it('uses only a configured public origin and allowlists Stripe redirect URLs', () => {
		const previousOrigin = process.env.PUBLIC_SITE_URL;
		process.env.PUBLIC_SITE_URL = 'https://shop.softhe.io/path';
		expect(getPublicOrigin()).toBe('https://shop.softhe.io');
		process.env.PUBLIC_SITE_URL = 'javascript:alert(1)';
		expect(() => getPublicOrigin()).toThrow('valid HTTP(S) origin');
		if (previousOrigin === undefined) delete process.env.PUBLIC_SITE_URL;
		else process.env.PUBLIC_SITE_URL = previousOrigin;

		expect(isStripeCheckoutUrl('https://checkout.stripe.com/c/pay/test')).toBe(true);
		expect(isStripeCheckoutUrl('https://checkout.stripe.com.attacker.example/test')).toBe(false);
	});
});

describe('Stripe webhook verification', () => {
	it('accepts a current valid v1 signature and rejects a bad signature', () => {
		const payload = Buffer.from('{"id":"evt_test"}');
		const timestamp = Math.floor(Date.now() / 1000);
		const secret = 'whsec_test';
		const signature = crypto.createHmac('sha256', secret)
			.update(`${timestamp}.${payload.toString('utf8')}`)
			.digest('hex');

		expect(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret)).toBe(true);
		expect(verifyStripeSignature(payload, `t=${timestamp},v1=${'0'.repeat(64)}`, secret)).toBe(false);
		expect(verifyStripeSignature(payload, `t=not-a-number,v1=${signature}`, secret)).toBe(false);
	});
});
