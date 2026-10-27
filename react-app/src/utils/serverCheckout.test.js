import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRODUCTS as clientProducts } from '../data/products';

const require = createRequire(import.meta.url);
const checkoutApi = require('../../../api/create-checkout-session.js');
const { PRODUCTS: serverProducts, createStripeForm, getDiscountRate, getIdempotentAcceptedAt, getPublicOrigin, isStripeCheckoutUrl, normalizeItems, validateLegalAcceptance } = checkoutApi;
const { verifyStripeSignature } = require('../../../api/stripe-webhook.js');

describe('server checkout validation', () => {
	it('rejects malformed Stripe signature headers without throwing', () => {
		const payload = Buffer.from('{}');
		const timestamp = Math.floor(Date.now() / 1000);
		for (const header of [[], {}, `t=${timestamp},v1=${'é'.repeat(64)}`, `t=${timestamp},v1=`]) {
			expect(verifyStripeSignature(payload, header, 'secret')).toBe(false);
		}
	});
	it('fails closed at the API boundary when commerce is disabled', async () => {
		const previous = process.env.COMMERCE_ENABLED;
		process.env.COMMERCE_ENABLED = 'false';
		const response = {
			statusCode: null,
			payload: null,
			setHeader() {},
			status(code) { this.statusCode = code; return this; },
			json(payload) { this.payload = payload; return this; },
		};

		await checkoutApi({ method: 'POST', headers: {}, body: {} }, response);

		expect(response.statusCode).toBe(503);
		expect(response.payload).toEqual({ error: 'Checkout is not available' });
		if (previous === undefined) delete process.env.COMMERCE_ENABLED;
		else process.env.COMMERCE_ENABLED = previous;
	});

	it('keeps client display prices aligned with server-authoritative prices', () => {
		const clientPriceById = Object.fromEntries(clientProducts.map(({ id, price }) => [id, price * 100]));
		const serverPriceById = Object.fromEntries(Object.entries(serverProducts).map(([id, product]) => [id, product.unitAmount]));
		expect(clientPriceById).toEqual(serverPriceById);
	});

	it('rejects unknown products and invalid quantities', () => {
		expect(() => normalizeItems([{ id: 'made-up', quantity: 1 }])).toThrow('Unknown product');
		for (const id of ['__proto__', 'constructor', 'toString', ['windows-10']]) {
			expect(() => normalizeItems([{ id, quantity: 1 }])).toThrow('Unknown product');
		}
		expect(() => normalizeItems([{ id: 'windows-10', quantity: 0 }])).toThrow('Invalid quantity');
	});

	it('requires explicit terms and early-delivery withdrawal acknowledgement', () => {
		expect(() => validateLegalAcceptance({ termsAccepted: true })).toThrow(/withdrawal information/i);
		expect(validateLegalAcceptance({
			termsAccepted: true,
			earlyPerformanceRequested: true,
			withdrawalAcknowledged: true,
		})).toEqual(expect.objectContaining({ termsAccepted: true, withdrawalAcknowledged: true }));
	});

	it('applies bundle pricing to authoritative server prices', () => {
		const items = normalizeItems([
			{ id: 'windows-10', quantity: 1 },
			{ id: 'bios-optimization', quantity: 1 },
		]);
		const { form, discountRate } = createStripeForm(items, 'https://softhe.io', undefined, undefined, { id: 'customer-id', email: 'customer@example.test' });

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

	it('reuses the original legal-acceptance time for checkout retries', async () => {
		const stored = new Map();
		const store = {
			claimKey: async (key, value) => {
				if (stored.has(key)) return false;
				stored.set(key, value);
				return true;
			},
			redisCommand: async ([command, key]) => command === 'GET' ? stored.get(key) : null,
		};
		const first = await getIdempotentAcceptedAt('same-checkout-key-1234', new Date('2026-07-31T19:00:00.000Z'), store);
		const retry = await getIdempotentAcceptedAt('same-checkout-key-1234', new Date('2026-07-31T19:05:00.000Z'), store);

		expect(retry).toBe(first);
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

describe('account-only checkout', () => {
	const env = {
		COMMERCE_ENABLED: 'true', STRIPE_SECRET_KEY: 'sk_test_fixture', LEGAL_NAME: 'Fixture Operator', LEGAL_ADDRESS: 'Testgatan 1, Stockholm',
		BUSINESS_REGISTRATION_ID: '000000-0000', SUPPORT_EMAIL: 'support@softhe.io', VAT_STATUS: 'not-registered', PUBLIC_SITE_URL: 'https://softhe.io',
		SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-key',
	};
	const request = (headers = {}) => ({
		method: 'POST',
		headers: { 'content-type': 'application/json', 'idempotency-key': '12345678901234567890', ...headers },
		body: { items: [{ id: 'windows-10', quantity: 1 }], legalAcceptance: { termsAccepted: true, earlyPerformanceRequested: true, withdrawalAcknowledged: true } },
	});
	const response = () => ({ statusCode: null, payload: null, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } });
	afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

	it('refuses anonymous checkout before contacting Stripe', async () => {
		for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
		const outbound = vi.fn(); vi.stubGlobal('fetch', outbound);
		const res = response();
		await checkoutApi(request(), res);
		expect(res.statusCode).toBe(401);
		expect(outbound).not.toHaveBeenCalled();
	});
	it('refuses accounts whose email is not confirmed', async () => {
		for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
		const outbound = vi.fn(async (url) => url.endsWith('/auth/v1/user')
			? { ok: true, status: 200, json: async () => ({ id: 'customer-id', email: 'customer@example.test', email_confirmed_at: null }) }
			: { ok: true, status: 200, json: async () => [{ account_status: 'active' }] });
		vi.stubGlobal('fetch', outbound);
		const res = response();
		await checkoutApi(request({ authorization: 'Bearer token' }), res);
		expect(res.statusCode).toBe(403);
		expect(res.payload).toEqual({ error: 'Verify your email before placing an order' });
		expect(outbound.mock.calls.some(([url]) => String(url).includes('stripe.com'))).toBe(false);
	});
	it('always binds the Stripe session to the signed-in customer', () => {
		const { form } = createStripeForm([{ id: 'windows-10', quantity: 1 }], 'https://softhe.io', undefined, undefined, { id: 'customer-id', email: 'customer@example.test' });
		expect(form.get('metadata[portal_user_id]')).toBe('customer-id');
		expect(form.get('customer_email')).toBe('customer@example.test');
		expect(() => createStripeForm([{ id: 'windows-10', quantity: 1 }], 'https://softhe.io')).toThrow('Checkout requires a signed-in customer');
	});
});
