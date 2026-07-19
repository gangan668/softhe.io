import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const contact = require('../../../api/contact.js');
const { claimKey, incrementWithExpiry, redisCommand } = require('../../../api/_lib/redis.js');
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

describe('contact API', () => {
	beforeEach(() => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
		process.env.CONTACT_RATE_LIMIT_SECRET = 'rate-secret';
		process.env.EMAILJS_SERVICE_ID = 'service';
		process.env.EMAILJS_TEMPLATE_ID = 'template';
		process.env.EMAILJS_PUBLIC_KEY = 'public';
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
});

describe('Stripe fulfillment', () => {
	beforeEach(() => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
		process.env.ORDER_FULFILLMENT_WEBHOOK_URL = 'https://fulfillment.example/orders';
		process.env.ORDER_FULFILLMENT_WEBHOOK_SECRET = 'fulfillment-secret';
	});

	it('requires HTTPS fulfillment configuration', () => {
		process.env.ORDER_FULFILLMENT_WEBHOOK_URL = 'http://fulfillment.example/orders';
		expect(() => getFulfillmentUrl()).toThrow('must use HTTPS');
	});

	it('durably claims and delivers a paid session once', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }))
			.mockResolvedValueOnce(jsonResponse({}, true, 200))
			.mockResolvedValueOnce(jsonResponse({ result: 'OK' }));
		vi.stubGlobal('fetch', fetchMock);
		const event = {
			id: 'evt_1',
			data: { object: { id: 'cs_1', payment_status: 'paid', amount_total: 6500, currency: 'eur', metadata: {} } },
		};

		await expect(fulfillPaidSession(event)).resolves.toBe('fulfilled');
		expect(fetchMock.mock.calls[1][0]).toBe('https://fulfillment.example/orders');
		expect(fetchMock.mock.calls[1][1].headers['Idempotency-Key']).toBe('cs_1');
		expect(fetchMock.mock.calls[1][1].headers['X-Softhe-Signature']).toMatch(/^[a-f0-9]{64}$/);
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	for (const key of [
		'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'CONTACT_RATE_LIMIT_SECRET',
		'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY',
		'ORDER_FULFILLMENT_WEBHOOK_URL', 'ORDER_FULFILLMENT_WEBHOOK_SECRET',
	]) delete process.env[key];
});
