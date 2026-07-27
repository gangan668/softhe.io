import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const contact = require('../../../api/contact.js');
const withdrawal = require('../../../api/withdrawal.js');
const health = require('../../../api/health.js');
const browserErrors = require('../../../api/browser-errors.js');
const checkoutSession = require('../../../api/checkout-session.js');
const { claimKey, incrementWithExpiry, redisCommand } = require('../../../api/_lib/redis.js');
const { assertCommerceConfiguration, assertOperatorIdentity } = require('../../../api/_lib/config.js');
const { fulfillPaidSession, getFulfillmentUrl } = require('../../../api/stripe-webhook.js');

const jsonResponse = (result, ok = true, status = 200) => ({
	ok,
	status,
	json: async () => result,
});

const createResponse = () => {
	const response = { headers: {}, statusCode: null, payload: null };
	response.setHeader = vi.fn((key, value) => { response.headers[key] = value; });
	response.status = vi.fn((status) => { response.statusCode = status; return response; });
	response.json = vi.fn((payload) => { response.payload = payload; return response; });
	response.end = vi.fn(() => response);
	return response;
};

describe('durable Redis helpers', () => {
	beforeEach(() => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
	});

	it('sends authenticated Redis commands and interprets claims', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ result: 'OK' }));
		await expect(redisCommand(['SET', 'key', 'value'], fetchImpl)).resolves.toBe('OK');
		expect(fetchImpl).toHaveBeenCalledWith('https://redis.example', expect.objectContaining({
			headers: expect.objectContaining({ Authorization: 'Bearer token' }),
		}));

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: null })));
		await expect(claimKey('key', 'value', 60)).resolves.toBe(false);
	});

	it('uses an atomic script for fixed-window counters', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ result: 2 }));
		vi.stubGlobal('fetch', fetchMock);
		await expect(incrementWithExpiry('rate:key', 60)).resolves.toBe(2);
		const command = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(command[0]).toBe('EVAL');
		expect(command).toContain('rate:key');
	});
});

describe('production health API', () => {
	it('reports missing server configuration without exposing values', async () => {
		process.env.RELEASE_SOURCE_COMMIT = '0123456789abcdef';
		process.env.RELEASE_FINGERPRINT = 'release-test-fingerprint';
		const response = createResponse();
		await health({ method: 'GET' }, response);

		expect(response.statusCode).toBe(503);
		expect(response.payload.status).toBe('configuration-required');
		expect(response.payload.missing).toContain('STRIPE_SECRET_KEY');
		expect(response.payload).not.toHaveProperty('values');
		expect(response.payload.release).toEqual({
			sourceCommit: '0123456789abcdef',
			fingerprint: 'release-test-fingerprint',
		});
		expect(response.headers['Cache-Control']).toBe('no-store');
	});

	it('reports ready when every required variable exists', async () => {
		for (const key of health.REQUIRED_CONFIGURATION) process.env[key] = `${key}-configured`;
		process.env.PUBLIC_SITE_URL = 'https://softhe.io';
		process.env.VAT_STATUS = 'not-registered';
		process.env.BUSINESS_REGISTRATION_ID = '000000-0000';
		process.env.SUPPORT_EMAIL = 'support@example.com';
		const response = createResponse();
		await health({ method: 'GET' }, response);

		expect(response.statusCode).toBe(200);
		expect(response.payload).toEqual(expect.objectContaining({
			status: 'ready',
			missing: [],
		}));
	});
});

describe('server configuration guards', () => {
	it('requires a complete operator identity', () => {
		expect(() => assertOperatorIdentity({})).toThrow(/operator identity/i);
		expect(() => assertOperatorIdentity({
			LEGAL_NAME: 'Softhe Test Operator',
			LEGAL_ADDRESS: 'Testgatan 1, Stockholm, Sweden',
			BUSINESS_REGISTRATION_ID: '000000-0000',
			SUPPORT_EMAIL: 'support@example.com',
		})).not.toThrow();
	});

	it('requires HTTPS and registered VAT identity for commerce', () => {
		const environment = {
			LEGAL_NAME: 'Softhe Test Operator',
			LEGAL_ADDRESS: 'Testgatan 1, Stockholm, Sweden',
			BUSINESS_REGISTRATION_ID: '000000-0000',
			SUPPORT_EMAIL: 'support@example.com',
			VAT_STATUS: 'registered',
			PUBLIC_SITE_URL: 'https://softhe.io',
		};
		expect(() => assertCommerceConfiguration(environment)).toThrow(/VAT identity/i);
		expect(() => assertCommerceConfiguration({ ...environment, VAT_ID: 'SE000000000001' })).not.toThrow();
	});
});

describe('contact API', () => {
	beforeEach(() => {
		process.env.PUBLIC_SITE_URL = 'https://softhe.io';
		process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
		process.env.CONTACT_RATE_LIMIT_SECRET = 'rate-secret';
		process.env.EMAILJS_SERVICE_ID = 'service';
		process.env.EMAILJS_TEMPLATE_ID = 'template';
		process.env.EMAILJS_PUBLIC_KEY = 'public';
		process.env.LEGAL_NAME = 'Softhe Test Operator';
		process.env.LEGAL_ADDRESS = 'Testgatan 1, Stockholm, Sweden';
		process.env.BUSINESS_REGISTRATION_ID = '000000-0000';
		process.env.SUPPORT_EMAIL = 'support@example.com';
	});

	it('allows the public site to preflight cross-origin submissions', async () => {
		const response = createResponse();
		await contact({
			method: 'OPTIONS',
			headers: { origin: 'https://softhe.io' },
		}, response);

		expect(response.statusCode).toBe(204);
		expect(response.headers['Access-Control-Allow-Origin']).toBe('https://softhe.io');
		expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
		expect(response.end).toHaveBeenCalled();
	});

	it('rejects submissions from untrusted browser origins', async () => {
		const response = createResponse();
		await contact({
			method: 'POST',
			headers: { origin: 'https://malicious.example' },
			body: {},
		}, response);

		expect(response.statusCode).toBe(403);
		expect(response.payload.error).toBe('Origin not allowed');
		expect(response.headers).not.toHaveProperty('Access-Control-Allow-Origin');
	});

	it('validates submissions before external calls', async () => {
		const response = createResponse();
		await contact({ method: 'POST', body: {}, headers: {} }, response);
		expect(response.statusCode).toBe(400);
		expect(response.payload.error).toMatch(/valid name/i);
	});

	it('rate limits by a hashed client identifier', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 4 })));
		const response = createResponse();
		await contact({
			method: 'POST',
			headers: { 'x-forwarded-for': '203.0.113.10' },
			body: { name: 'Jane Doe', email: 'jane@example.com', subject: 'general', message: 'A valid message.' },
		}, response);
		expect(response.statusCode).toBe(429);
		expect(response.headers['Retry-After']).toBe('60');
	});

	it('delivers a sanitized message through the configured provider', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(jsonResponse({ result: 1 }))
			.mockResolvedValueOnce(jsonResponse({}, true, 200));
		vi.stubGlobal('fetch', fetchMock);
		const response = createResponse();
		await contact({
			method: 'POST',
			headers: { 'x-forwarded-for': '203.0.113.20' },
			body: {
				name: ' Jane\u0000 Doe ',
				email: 'JANE@EXAMPLE.COM',
				subject: 'sales',
				message: 'I need compatibility advice.',
			},
		}, response);

		expect(response.statusCode).toBe(200);
		expect(response.payload).toEqual({ delivered: true });
		const emailPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
		expect(emailPayload.template_params).toEqual(expect.objectContaining({
			from_name: 'Jane  Doe',
			from_email: 'jane@example.com',
		}));
	});

	it('returns a safe error when the delivery provider rejects the message', async () => {
		vi.stubGlobal('fetch', vi.fn()
			.mockResolvedValueOnce(jsonResponse({ result: 1 }))
			.mockResolvedValueOnce(jsonResponse({}, false, 503)));
		const response = createResponse();
		await contact({
			method: 'POST',
			headers: { 'x-forwarded-for': '203.0.113.21' },
			body: {
				name: 'Jane Doe',
				email: 'jane@example.com',
				subject: 'general',
				message: 'This delivery should fail safely.',
			},
		}, response);

		expect(response.statusCode).toBe(502);
		expect(response.payload.error).toBe('Message delivery failed. Please try again.');
	});
});

describe('withdrawal API validation', () => {
	beforeEach(() => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
		process.env.CONTACT_RATE_LIMIT_SECRET = 'rate-secret';
		process.env.EMAILJS_SERVICE_ID = 'service';
		process.env.EMAILJS_PUBLIC_KEY = 'public';
		process.env.LEGAL_NAME = 'Softhe Test Operator';
		process.env.LEGAL_ADDRESS = 'Testgatan 1, Stockholm, Sweden';
		process.env.BUSINESS_REGISTRATION_ID = '000000-0000';
		process.env.SUPPORT_EMAIL = 'support@example.com';
		process.env.EMAILJS_WITHDRAWAL_TEMPLATE_ID = 'withdrawal-customer';
		process.env.EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID = 'withdrawal-operator';
	});

	it('normalizes and validates an eligible request', () => {
		const normalized = withdrawal.normalizeWithdrawal({
			orderReference: ' CS_TEST_12345678 ',
			email: ' Customer@Example.com ',
			requestedItems: ['windows-10', 'windows-10'],
			comments: ' Please cancel. ',
		});
		expect(normalized).toEqual(expect.objectContaining({
			orderReference: 'CS_TEST_12345678',
			email: 'customer@example.com',
			requestedItems: ['windows-10'],
		}));
		expect(withdrawal.validateWithdrawal(normalized)).toBeNull();
	});

	it('rejects mixing the entire order with individual items', () => {
		const normalized = withdrawal.normalizeWithdrawal({
			orderReference: 'CS_TEST_12345678',
			email: 'customer@example.com',
			requestedItems: ['entire-order', 'windows-10'],
		});
		expect(withdrawal.validateWithdrawal(normalized)).toMatch(/either the entire order/i);
	});

	it('persists and acknowledges a timestamped withdrawal request', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(jsonResponse({ result: 1 }))
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }))
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }))
			.mockResolvedValueOnce(jsonResponse({}, true, 200))
			.mockResolvedValueOnce(jsonResponse({}, true, 200))
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }));
		vi.stubGlobal('fetch', fetchMock);
		const response = createResponse();
		await withdrawal({
			method: 'POST',
			headers: { 'x-forwarded-for': '203.0.113.30' },
			body: {
				orderReference: 'CS_TEST_12345678',
				email: 'customer@example.com',
				requestedItems: ['entire-order'],
			},
		}, response);

		expect(response.statusCode).toBe(202);
		expect(response.payload.requestId).toMatch(/^wd_/);
		expect(fetchMock.mock.calls.filter(([url]) => url === 'https://api.emailjs.com/api/v1.0/email/send')).toHaveLength(2);
	});

	it('accepts a duplicate without sending another acknowledgement', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(jsonResponse({ result: 1 }))
			.mockResolvedValueOnce(jsonResponse({ result: null }));
		vi.stubGlobal('fetch', fetchMock);
		const response = createResponse();
		await withdrawal({
			method: 'POST',
			headers: { 'x-forwarded-for': '203.0.113.30' },
			body: {
				orderReference: 'CS_TEST_12345678',
				email: 'customer@example.com',
				requestedItems: ['entire-order'],
			},
		}, response);
		expect(response.payload).toEqual({ received: true, duplicate: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe('Stripe fulfillment', () => {
	beforeEach(() => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
		process.env.ORDER_FULFILLMENT_WEBHOOK_URL = 'https://fulfillment.example/orders';
		process.env.ORDER_FULFILLMENT_WEBHOOK_SECRET = 'fulfillment-secret';
		process.env.PUBLIC_SITE_URL = 'https://softhe.io';
		process.env.EMAILJS_SERVICE_ID = 'service';
		process.env.EMAILJS_PUBLIC_KEY = 'public';
		process.env.EMAILJS_ORDER_TEMPLATE_ID = 'order-template';
		process.env.SUPPORT_EMAIL = 'support@softhe.io';
		process.env.LEGAL_NAME = 'Softhe Test Operator';
		process.env.LEGAL_ADDRESS = 'Testgatan 1, Stockholm, Sweden';
		process.env.BUSINESS_REGISTRATION_ID = '000000-0000';
		process.env.VAT_STATUS = 'not-registered';
	});

	it('requires HTTPS fulfillment configuration', () => {
		process.env.ORDER_FULFILLMENT_WEBHOOK_URL = 'http://fulfillment.example/orders';
		expect(() => getFulfillmentUrl()).toThrow('must use HTTPS');
	});

	it('durably claims and delivers a paid session once', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }))
			.mockResolvedValueOnce(jsonResponse({}, true, 200))
			.mockResolvedValueOnce(jsonResponse({}, true, 200))
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }));
		vi.stubGlobal('fetch', fetchMock);
		const event = {
			id: 'evt_1',
			data: { object: {
				id: 'cs_1',
				payment_status: 'paid',
				amount_total: 6500,
				currency: 'eur',
				customer_details: { email: 'customer@example.com' },
				metadata: { order_schema: '1', order_items: '[{"id":"windows-10","quantity":1}]' },
			} },
		};

		await expect(fulfillPaidSession(event)).resolves.toBe('fulfilled');
		expect(fetchMock.mock.calls[1][0]).toBe('https://fulfillment.example/orders');
		expect(fetchMock.mock.calls[1][1].headers['Idempotency-Key']).toBe('cs_1');
		expect(fetchMock.mock.calls[1][1].headers['X-Softhe-Signature']).toMatch(/^[a-f0-9]{64}$/);
		expect(JSON.parse(fetchMock.mock.calls[1][1].body).items).toEqual([
			{ id: 'windows-10', quantity: 1 },
		]);
	});

	it('does not redeliver a checkout session that is already claimed', async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ result: null }));
		vi.stubGlobal('fetch', fetchMock);
		const event = { id: 'evt_duplicate', data: { object: { id: 'cs_duplicate', payment_status: 'paid' } } };
		await expect(fulfillPaidSession(event)).resolves.toBe('duplicate');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('waits for an asynchronous payment before claiming fulfillment', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const event = { id: 'evt_pending', data: { object: { id: 'cs_pending', payment_status: 'unpaid' } } };
		await expect(fulfillPaidSession(event)).resolves.toBe('payment-pending');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('releases the durable claim when fulfillment fails so Stripe can retry', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }))
			.mockResolvedValueOnce(jsonResponse({}, false, 503))
			.mockResolvedValueOnce(jsonResponse({ result: 1 }));
		vi.stubGlobal('fetch', fetchMock);
		const event = {
			id: 'evt_retry',
			data: { object: {
				id: 'cs_retry',
				payment_status: 'paid',
				metadata: { order_schema: '1', order_items: '[{"id":"windows-10","quantity":1}]' },
			} },
		};
		await expect(fulfillPaidSession(event)).rejects.toThrow(/status 503/i);
		const deleteCommand = JSON.parse(fetchMock.mock.calls[2][1].body);
		expect(deleteCommand).toEqual(['DEL', 'stripe:fulfilled:cs_retry']);
	});
});

describe('checkout session verification', () => {
	beforeEach(() => {
		process.env.STRIPE_SECRET_KEY = 'sk_test_secret';
	});

	it('returns paid status only for a server-created Softhe order', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
			id: 'cs_test_12345678',
			payment_status: 'paid',
			status: 'complete',
			amount_total: 6500,
			currency: 'eur',
			metadata: { order_schema: '1', order_items: '[{"id":"windows-10","quantity":1}]' },
		})));
		const response = createResponse();
		await checkoutSession({ method: 'GET', query: { session_id: 'cs_test_12345678' } }, response);

		expect(response.statusCode).toBe(200);
		expect(response.payload).toEqual(expect.objectContaining({ paid: true, status: 'complete' }));
		expect(response.payload.items).toEqual([{ id: 'windows-10', quantity: 1 }]);
	});

	it('rejects malformed IDs before calling Stripe', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const response = createResponse();
		await checkoutSession({ method: 'GET', query: { session_id: '../customers' } }, response);
		expect(response.statusCode).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	for (const key of [
		'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'CONTACT_RATE_LIMIT_SECRET',
		'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY',
		'EMAILJS_ORDER_TEMPLATE_ID', 'EMAILJS_WITHDRAWAL_TEMPLATE_ID',
		'EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID',
		'ORDER_FULFILLMENT_WEBHOOK_URL', 'ORDER_FULFILLMENT_WEBHOOK_SECRET',
		'STRIPE_SECRET_KEY',
		'PUBLIC_SITE_URL', 'STRIPE_WEBHOOK_SECRET',
		'LEGAL_NAME', 'LEGAL_ADDRESS', 'BUSINESS_REGISTRATION_ID', 'VAT_STATUS', 'SUPPORT_EMAIL',
		'RELEASE_SOURCE_COMMIT', 'RELEASE_FINGERPRINT',
	]) delete process.env[key];
});

describe('browser error reporting API', () => {
	beforeEach(() => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
		process.env.CONTACT_RATE_LIMIT_SECRET = 'rate-secret';
	});

	it('sanitizes and accepts a bounded browser error', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 1 })));
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = createResponse();
		await browserErrors({
			method: 'POST',
			headers: { 'x-forwarded-for': '203.0.113.20' },
			body: { message: 'Failure\u0000message', stack: 'stack', url: 'https://softhe.io/store' },
		}, response);

		expect(response.statusCode).toBe(202);
		expect(consoleError).toHaveBeenCalledWith('browser_error', expect.objectContaining({
			message: 'Failure message',
		}));
		consoleError.mockRestore();
	});
});
