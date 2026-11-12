import { createRequire } from 'node:module';
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const contact = require('../../../api/contact.js');
const withdrawal = require('../../../api/withdrawal.js');
const browserErrors = require('../../../api/browser-errors.js');
const { verifyTurnstile, SITEVERIFY_URL, CAPTCHA_FAILED_MESSAGE } = require('../../../api/_lib/turnstile.js');
const { sendPublicError } = require('../../../api/_lib/portal-security.js');
const { adminRequest, userRequest, verifyUser } = require('../../../api/_lib/supabase.js');

const JSON_HEADERS = { 'content-type': 'application/json' };

const jsonResponse = (result, ok = true, status = 200) => ({ ok, status, json: async () => result });

const createResponse = () => {
	const response = { headers: {}, statusCode: null, payload: null };
	response.setHeader = vi.fn((key, value) => { response.headers[key] = value; });
	response.status = vi.fn((status) => { response.statusCode = status; return response; });
	response.json = vi.fn((payload) => { response.payload = payload; return response; });
	response.end = vi.fn(() => response);
	return response;
};

const exchange = async (handler, { method = 'POST', path = '/', headers = {}, chunks = [] } = {}) => {
	const server = createServer(handler);
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	try {
		return await new Promise((resolve, reject) => {
			const outgoing = request({ host: '127.0.0.1', port: server.address().port, method, path, headers }, (incoming) => {
				let body = '';
				incoming.setEncoding('utf8');
				incoming.on('data', (chunk) => { body += chunk; });
				incoming.on('end', () => resolve({ status: incoming.statusCode, headers: incoming.headers, body }));
				incoming.on('error', reject);
			});
			outgoing.on('error', reject);
			for (const chunk of chunks) outgoing.write(chunk);
			outgoing.end();
		});
	} finally {
		server.closeAllConnections();
		await new Promise((resolve) => server.close(resolve));
	}
};

const ENV_KEYS = [
	'TURNSTILE_SECRET_KEY', 'PUBLIC_SITE_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
	'CONTACT_RATE_LIMIT_SECRET', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY',
	'LEGAL_NAME', 'LEGAL_ADDRESS', 'BUSINESS_REGISTRATION_ID', 'SUPPORT_EMAIL',
	'EMAILJS_WITHDRAWAL_TEMPLATE_ID', 'EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID',
	'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY',
];

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
	process.env.EMAILJS_WITHDRAWAL_TEMPLATE_ID = 'withdrawal-customer';
	process.env.EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID = 'withdrawal-operator';
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	for (const key of ENV_KEYS) delete process.env[key];
});

const validContact = { name: 'Jane Doe', email: 'jane@example.com', subject: 'general', message: 'A valid message body.' };
const validWithdrawal = { orderReference: 'cs_test_12345678', email: 'jane@example.com', requestedItems: ['entire-order'] };

describe('Turnstile verification', () => {
	it('is skipped when no secret is configured', async () => {
		const fetchImpl = vi.fn();
		await expect(verifyTurnstile({ headers: {}, body: {} }, { fetchImpl })).resolves.toEqual(expect.objectContaining({ ok: true }));
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('posts secret, response, and client IP to siteverify', async () => {
		process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
		const result = await verifyTurnstile({ headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' } }, { body: { captchaToken: 'token-1' }, fetchImpl });
		expect(result.ok).toBe(true);
		const [url, options] = fetchImpl.mock.calls[0];
		expect(url).toBe(SITEVERIFY_URL);
		expect(options.method).toBe('POST');
		const form = new URLSearchParams(options.body);
		expect(form.get('secret')).toBe('turnstile-secret');
		expect(form.get('response')).toBe('token-1');
		expect(form.get('remoteip')).toBe('203.0.113.9');
	});

	it('rejects a missing or invalid token and reports an unreachable provider as 503', async () => {
		process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
		const missing = await verifyTurnstile({ headers: {}, body: {} }, { fetchImpl: vi.fn() });
		expect(missing).toEqual({ ok: false, status: 400, error: 'Security verification failed. Please try again.' });

		const invalid = await verifyTurnstile({ headers: {}, body: { captchaToken: 'bad' } }, { fetchImpl: vi.fn().mockResolvedValue(jsonResponse({ success: false })) });
		expect(invalid).toEqual({ ok: false, status: 400, error: CAPTCHA_FAILED_MESSAGE });

		vi.spyOn(console, 'error').mockImplementation(() => {});
		const down = await verifyTurnstile({ headers: {}, body: { captchaToken: 'x' } }, { fetchImpl: vi.fn().mockRejectedValue(new Error('network')) });
		expect(down.status).toBe(503);
		expect(down.error).not.toMatch(/network/);

		const httpError = await verifyTurnstile({ headers: {}, body: { captchaToken: 'x' } }, { fetchImpl: vi.fn().mockResolvedValue(jsonResponse({}, false, 500)) });
		expect(httpError.status).toBe(503);
	});

	it('blocks contact submissions without a valid token before rate limiting or email', async () => {
		process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const response = createResponse();
		await contact({ method: 'POST', headers: JSON_HEADERS, body: validContact }, response);
		expect(response.statusCode).toBe(400);
		expect(response.payload).toEqual({ error: CAPTCHA_FAILED_MESSAGE });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('runs the honeypot and field validation before calling siteverify', async () => {
		process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const invalid = createResponse();
		await contact({ method: 'POST', headers: JSON_HEADERS, body: { ...validContact, name: '' } }, invalid);
		expect(invalid.payload.error).toMatch(/valid name/i);

		const bot = createResponse();
		await contact({ method: 'POST', headers: JSON_HEADERS, body: { ...validContact, website: 'spam' } }, bot);
		expect(bot.statusCode).toBe(200);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('delivers a contact message after a successful verification', async () => {
		process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
		const fetchMock = vi.fn(async (url) => {
			if (url === SITEVERIFY_URL) return jsonResponse({ success: true });
			if (url === 'https://redis.example') return jsonResponse({ result: 1 });
			return jsonResponse({});
		});
		vi.stubGlobal('fetch', fetchMock);
		const response = createResponse();
		await contact({ method: 'POST', headers: JSON_HEADERS, body: { ...validContact, captchaToken: 'ok' } }, response);
		expect(response.statusCode).toBe(200);
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([SITEVERIFY_URL, 'https://redis.example', 'https://api.emailjs.com/api/v1.0/email/send']);
	});

	it('blocks withdrawal requests without a token and fails closed when siteverify is down', async () => {
		process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
		const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const missing = createResponse();
		await withdrawal({ method: 'POST', headers: JSON_HEADERS, body: validWithdrawal }, missing);
		expect(missing.statusCode).toBe(400);
		expect(missing.payload).toEqual({ error: CAPTCHA_FAILED_MESSAGE });
		expect(fetchMock).not.toHaveBeenCalled();

		const down = createResponse();
		await withdrawal({ method: 'POST', headers: JSON_HEADERS, body: { ...validWithdrawal, captchaToken: 'tok' } }, down);
		expect(down.statusCode).toBe(503);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe(SITEVERIFY_URL);
	});
});

describe('browser error ingestion boundary', () => {
	const sameOrigin = { origin: 'https://softhe.io', host: 'softhe.io', 'content-type': 'application/json' };

	it('rejects cross-origin and missing-origin reports before touching storage', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		for (const headers of [{ ...sameOrigin, origin: 'https://evil.example' }, { host: 'softhe.io', 'content-type': 'application/json' }]) {
			const response = createResponse();
			await browserErrors({ method: 'POST', headers, body: { message: 'x' } }, response);
			expect(response.statusCode).toBe(403);
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('requires JSON and enforces a 16 KB cap', async () => {
		const wrongType = createResponse();
		await browserErrors({ method: 'POST', headers: { ...sameOrigin, 'content-type': 'text/plain' }, body: 'x' }, wrongType);
		expect(wrongType.statusCode).toBe(415);

		const declaredTooLarge = createResponse();
		await browserErrors({ method: 'POST', headers: { ...sameOrigin, 'content-length': '20000' }, body: { message: 'x' } }, declaredTooLarge);
		expect(declaredTooLarge.statusCode).toBe(413);

		const actualTooLarge = createResponse();
		await browserErrors({ method: 'POST', headers: sameOrigin, body: { message: 'x', stack: 'y'.repeat(20000) } }, actualTooLarge);
		expect(actualTooLarge.statusCode).toBe(413);
	});

	it('accepts the configured public origin even when served from another host', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 1 })));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = createResponse();
		await browserErrors({ method: 'POST', headers: { ...sameOrigin, host: 'internal.vercel.app' }, body: { message: 'boom' } }, response);
		expect(response.statusCode).toBe(202);
	});

	it('keeps rate limiting error reports', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 21 })));
		const response = createResponse();
		await browserErrors({ method: 'POST', headers: sameOrigin, body: { message: 'boom' } }, response);
		expect(response.statusCode).toBe(429);
		expect(response.headers['Retry-After']).toBe('60');
	});
});

describe('CSP violation reports', () => {
	it('accepts legacy report-uri string bodies without an Origin header', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 1 })));
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const response = createResponse();
		await browserErrors({
			method: 'POST',
			query: { kind: 'csp' },
			headers: { 'content-type': 'application/csp-report', 'x-forwarded-for': '203.0.113.5' },
			body: JSON.stringify({ 'csp-report': {
				'document-uri': 'https://softhe.io/store',
				'violated-directive': 'script-src',
				'blocked-uri': `https://evil.example/${'a'.repeat(1000)}`,
				'original-policy': 'default-src self; very long policy',
			} }),
		}, response);
		expect(response.statusCode).toBe(204);
		expect(response.end).toHaveBeenCalled();
		const [event, record] = warn.mock.calls[0];
		expect(event).toBe('csp_violation');
		expect(record).toEqual(expect.objectContaining({ documentURL: 'https://softhe.io/store', effectiveDirective: 'script-src' }));
		expect(record.blockedURL.length).toBeLessThanOrEqual(300);
		expect(record).not.toHaveProperty('original-policy');
	});

	it('accepts Reporting API batches as parsed objects', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 1 })));
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const response = createResponse();
		await browserErrors({
			method: 'POST',
			query: { kind: 'csp' },
			headers: { 'content-type': 'application/reports+json' },
			body: [{ type: 'csp-violation', body: { documentURL: 'https://softhe.io/', effectiveDirective: 'img-src', blockedURL: 'https://x.example/a.png' } }],
		}, response);
		expect(response.statusCode).toBe(204);
		expect(warn).toHaveBeenCalledWith('csp_violation', expect.objectContaining({ effectiveDirective: 'img-src', blockedURL: 'https://x.example/a.png' }));
	});

	it('rejects unsupported types, oversized bodies, and floods', async () => {
		const wrongType = createResponse();
		await browserErrors({ method: 'POST', query: { kind: 'csp' }, headers: { 'content-type': 'text/plain' }, body: '{}' }, wrongType);
		expect(wrongType.statusCode).toBe(415);

		const tooLarge = createResponse();
		await browserErrors({ method: 'POST', query: { kind: 'csp' }, headers: { 'content-type': 'application/csp-report' }, body: 'x'.repeat(17000) }, tooLarge);
		expect(tooLarge.statusCode).toBe(413);

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 31 })));
		const limited = createResponse();
		await browserErrors({ method: 'POST', query: { kind: 'csp' }, headers: { 'content-type': 'application/json' }, body: {} }, limited);
		expect(limited.statusCode).toBe(429);
	});

	it('streams application/csp-report bodies through the native HTTP adapter', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: 1 })));
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const report = JSON.stringify({ 'csp-report': { 'document-uri': 'https://softhe.io/', 'violated-directive': 'style-src', 'blocked-uri': 'inline' } });
		const response = await exchange(browserErrors, { path: '/api/browser-errors?kind=csp', headers: { 'content-type': 'application/csp-report' }, chunks: [report] });
		expect(response.status).toBe(204);
		expect(warn).toHaveBeenCalledWith('csp_violation', expect.objectContaining({ effectiveDirective: 'style-src' }));

		const oversized = await exchange(browserErrors, { path: '/api/browser-errors?kind=csp', headers: { 'content-type': 'application/csp-report', 'transfer-encoding': 'chunked' }, chunks: ['{"x":"', 'x'.repeat(17000)] });
		expect(oversized.status).toBe(413);
	});
});

describe('public error messages', () => {
	it('never exposes internal messages for client errors without a public message', () => {
		const expectations = {
			400: 'Invalid request', 401: 'Authentication required', 403: 'Forbidden', 404: 'Not found',
			409: 'Conflict', 413: 'Request too large', 415: 'Unsupported content type',
			429: 'Too many requests. Please try again later.', 422: 'Request could not be completed',
		};
		for (const [status, message] of Object.entries(expectations)) {
			const response = createResponse();
			sendPublicError(response, Object.assign(new Error('relation "orders" violates policy'), { statusCode: Number(status) }));
			expect(response.statusCode).toBe(Number(status));
			expect(response.payload).toEqual({ error: message });
		}
	});

	it('returns explicit public messages and hides server errors behind the fallback', () => {
		const explicit = createResponse();
		sendPublicError(explicit, Object.assign(new Error('internal'), { statusCode: 409, publicMessage: 'Request already in progress' }));
		expect(explicit.payload).toEqual({ error: 'Request already in progress' });

		vi.spyOn(console, 'error').mockImplementation(() => {});
		const server = createResponse();
		sendPublicError(server, new Error('database exploded'), 'Ticket could not be saved');
		expect(server.statusCode).toBe(500);
		expect(server.payload).toEqual({ error: 'Ticket could not be saved' });
	});

	it('keeps PostgREST error text out of Supabase error messages', async () => {
		process.env.VITE_SUPABASE_URL = 'https://project.supabase.co';
		process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'public-key';
		process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
		const leak = { code: '42501', message: 'new row violates row-level security policy for table "tickets"' };
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(leak, false, 403)));

		const userError = await userRequest({ token: 'token' }, 'tickets').catch((error) => error);
		expect(userError.statusCode).toBe(403);
		expect(userError.message).not.toContain('row-level security');
		expect(userError.detail).toContain('row-level security');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const response = createResponse();
		sendPublicError(response, userError);
		expect(response.payload).toEqual({ error: 'Request could not be completed' });
		// The upstream rejection stays diagnosable in private server logs.
		expect(warn).toHaveBeenCalledWith('portal_request_rejected', expect.objectContaining({ status: 403, detail: expect.stringContaining('row-level security') }));
		warn.mockRestore();

		const adminError = await adminRequest('tickets').catch((error) => error);
		expect(adminError.message).toBe('Customer data request failed (403)');
		expect(adminError.statusCode).toBeUndefined();
		expect(adminError.detail).toContain('42501');
	});

	it('keeps the intended authentication messages user-facing', async () => {
		const response = createResponse();
		sendPublicError(response, await verifyUser({ headers: {} }).catch((error) => error));
		expect(response.payload).toEqual({ error: 'Authentication required' });
	});

	it('keeps checkout configuration details out of the public 503', async () => {
		const checkout = require('../../../api/create-checkout-session.js');
		const previous = { COMMERCE_ENABLED: process.env.COMMERCE_ENABLED };
		process.env.COMMERCE_ENABLED = 'true';
		process.env.STRIPE_SECRET_KEY = 'sk_test_secret';
		vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const response = createResponse();
			await checkout({ method: 'POST', headers: { ...JSON_HEADERS, 'idempotency-key': 'a'.repeat(32) }, body: { items: [] } }, response);
			expect(response.statusCode).toBe(503);
			expect(response.payload).toEqual({ error: 'Checkout is temporarily unavailable' });
		} finally {
			if (previous.COMMERCE_ENABLED === undefined) delete process.env.COMMERCE_ENABLED;
			else process.env.COMMERCE_ENABLED = previous.COMMERCE_ENABLED;
		}
	});
});
