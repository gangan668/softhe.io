import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { verifyActiveUser, userRequest } = require('../../../api/_lib/supabase.js');
const { withHttp } = require('../../../api/_lib/http.js');
const portalBootstrap = require('../../../api/portal-bootstrap.js');
const staffApi = require('../../../api/_lib/staff-handler.js');

const actor = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const ticketId = '33333333-3333-4333-8333-333333333333';
const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const jwt = (claims) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
const createResponse = () => {
	const response = { headers: {}, statusCode: null, payload: null };
	response.setHeader = vi.fn((key, value) => { response.headers[key] = value; });
	response.status = vi.fn((status) => { response.statusCode = status; return response; });
	response.json = vi.fn((payload) => { response.payload = payload; return response; });
	response.end = vi.fn(() => response);
	return response;
};

beforeEach(() => {
	for (const [name, value] of Object.entries({
		SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-key', SUPABASE_SERVICE_ROLE_KEY: 'service-key',
		PORTAL_RATE_LIMIT_SECRET: 'rate-secret', UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'redis-token',
	})) vi.stubEnv(name, value);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('second factor enforcement', () => {
	const enrolledUser = { id: actor, email: 'customer@example.invalid', factors: [{ id: 'factor', status: 'verified' }] };
	it('rejects an AAL1 session for an account with a verified factor before reading data', async () => {
		const outbound = vi.fn(async () => json(enrolledUser));
		vi.stubGlobal('fetch', outbound);
		await expect(verifyActiveUser({ headers: { authorization: `Bearer ${jwt({ sub: actor, aal: 'aal1' })}` } }))
			.rejects.toMatchObject({ statusCode: 403, publicMessage: 'Multi-factor authentication is required.' });
		expect(outbound).toHaveBeenCalledOnce();
	});
	it('accepts the same account once the session is AAL2', async () => {
		vi.stubGlobal('fetch', vi.fn(async (url) => url.endsWith('/auth/v1/user') ? json(enrolledUser) : json([{ account_status: 'active' }])));
		await expect(verifyActiveUser({ headers: { authorization: `Bearer ${jwt({ sub: actor, aal: 'aal2' })}` } })).resolves.toMatchObject({ id: actor });
	});
	it('leaves accounts with only unverified factors on AAL1', async () => {
		vi.stubGlobal('fetch', vi.fn(async (url) => url.endsWith('/auth/v1/user') ? json({ ...enrolledUser, factors: [{ status: 'unverified' }] }) : json([{ account_status: 'active' }])));
		await expect(verifyActiveUser({ headers: { authorization: `Bearer ${jwt({ sub: actor, aal: 'aal1' })}` } })).resolves.toMatchObject({ id: actor });
	});
});

describe('portal API responses', () => {
	it('does not forward upstream database messages to clients', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'relation "internal_table" does not exist' }, 400)));
		await expect(userRequest({ token: 'token' }, 'profiles')).rejects.toMatchObject({ statusCode: 400, publicMessage: 'Request could not be completed' });
	});
	it('marks every API response as uncacheable', async () => {
		const response = createResponse();
		await withHttp(async (_req, res) => res.status(200).json({ ok: true }))({ method: 'GET', url: '/api/example', headers: {} }, response);
		expect(response.headers['Cache-Control']).toBe('no-store');
	});
	it('rate limits other-session revocation before contacting Auth', async () => {
		const outbound = vi.fn(async (url) => {
			if (url.endsWith('/auth/v1/user')) return json({ id: actor, email: 'customer@example.invalid' });
			if (url === 'https://redis.example') return json({ result: 6 });
			throw new Error(`Unexpected request ${url}`);
		});
		vi.stubGlobal('fetch', outbound);
		const response = createResponse();
		await portalBootstrap({ method: 'POST', headers: { authorization: 'Bearer token', 'content-type': 'application/json', origin: 'https://softhe.io', host: 'softhe.io' }, body: {}, query: { action: 'revoke-others' } }, response);
		expect(response.statusCode).toBe(429);
		expect(outbound.mock.calls.some(([url]) => String(url).includes('/auth/v1/logout'))).toBe(false);
	});
});

describe('staff reply notification', () => {
	const staffRequest = () => ({
		method: 'POST', query: { action: 'reply' }, body: { ticketId, message: 'We fixed it' },
		headers: { authorization: `Bearer ${jwt({ sub: actor, aal: 'aal2', session_id: actor })}`, 'content-type': 'application/json', origin: 'https://softhe.io', host: 'softhe.io', 'idempotency-key': '12345678901234567890' },
	});
	const outboundFor = (email, emailStatus = 200) => vi.fn(async (url, options = {}) => {
		if (url === 'https://redis.example') {
			const command = JSON.parse(options.body);
			return json({ result: command[0] === 'GET' ? null : command[0] === 'SET' ? 'OK' : 1 });
		}
		if (url.endsWith('/auth/v1/user')) return json({ id: actor, email: 'staff@example.invalid', email_confirmed_at: '2026-01-01' });
		if (url.includes('select=account_status')) return json([{ account_status: 'active' }]);
		if (url.endsWith('/rpc/verify_staff_access')) return json([{ role: 'staff' }]);
		if (url.includes(`/tickets?id=eq.${ticketId}&select=id,status`)) return json([{ id: ticketId, status: 'open' }]);
		if (url.endsWith('/ticket_messages')) return json([{ id: 'message-1', body: 'We fixed it' }]);
		if (url.includes(`/tickets?id=eq.${ticketId}`) && options.method === 'PATCH') return json(null);
		if (url.endsWith('/staff_audit_events')) return json(null);
		if (url.includes(`/tickets?id=eq.${ticketId}&select=id,user_id`)) return json([{ id: ticketId, user_id: owner, subject: 'Help', status: 'waiting_for_customer' }]);
		if (url.includes(`/profiles?id=eq.${owner}`)) return json([{ email, full_name: 'Customer' }]);
		if (url === 'https://api.emailjs.com/api/v1.0/email/send') return json({}, emailStatus);
		throw new Error(`Unexpected request ${url}`);
	});
	beforeEach(() => {
		for (const [name, value] of Object.entries({ STAFF_PORTAL_ENABLED: 'true', EMAILJS_SERVICE_ID: 'service', EMAILJS_PUBLIC_KEY: 'public', EMAILJS_TICKET_TEMPLATE_ID: 'ticket-template' })) vi.stubEnv(name, value);
	});
	it('emails the ticket owner after a staff reply', async () => {
		const outbound = outboundFor('customer@example.invalid');
		vi.stubGlobal('fetch', outbound);
		const response = createResponse();
		await staffApi(staffRequest(), response);
		expect(response.statusCode).toBe(201);
		expect(response.payload).toEqual({ id: 'message-1', notified: true });
		// The replay entry is stored before the email request, so a retry cannot post the reply again.
		const urls = outbound.mock.calls.map(([url, options]) => (url === 'https://redis.example' && JSON.parse(options.body)[0] === 'SET' && JSON.parse(options.body)[1].startsWith('portal:staff-write:') && !JSON.parse(options.body)[1].endsWith(':lock') ? 'replay-saved' : url));
		expect(urls.indexOf('replay-saved')).toBeGreaterThan(-1);
		expect(urls.indexOf('replay-saved')).toBeLessThan(urls.indexOf('https://api.emailjs.com/api/v1.0/email/send'));
		const email = outbound.mock.calls.find(([url]) => url === 'https://api.emailjs.com/api/v1.0/email/send');
		expect(JSON.parse(email[1].body).template_params).toMatchObject({ to_email: 'customer@example.invalid', ticket_id: ticketId, reply_preview: 'We fixed it' });
	});
	it('keeps the saved reply when the customer email cannot be delivered', async () => {
		vi.stubGlobal('fetch', outboundFor('customer@example.invalid', 500));
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = createResponse();
		await staffApi(staffRequest(), response);
		expect(response.statusCode).toBe(201);
		expect(response.payload).toEqual({ id: 'message-1', notified: false });
		expect(consoleError).toHaveBeenCalledWith('ticket_delivery_failed', { message: 'Email delivery failed' });
		consoleError.mockRestore();
	});
});
