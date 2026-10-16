import { createRequire } from 'node:module';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const ticketWrite = require('../../../api/ticket-write.js');
const actor = '11111111-1111-4111-8111-111111111111';
const ticket = '22222222-2222-4222-8222-222222222222';
const json = (data) => ({ ok: true, status: 200, json: async () => data });
let outbound;
let allowedTicket;

beforeEach(() => {
  for (const [name, value] of Object.entries({ SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-key', SUPABASE_SERVICE_ROLE_KEY: 'service-key', PORTAL_RATE_LIMIT_SECRET: 'rate-secret', UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'redis-token' })) vi.stubEnv(name, value);
  allowedTicket = { id: ticket, status: 'open' };
  outbound = vi.fn(async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return json({ id: actor, email: 'customer@example.invalid' });
    if (url.includes('select=account_status')) return json([{ account_status: 'active' }]);
    if (url === 'https://redis.example') {
      const command = JSON.parse(options.body);
      return json({ result: command[0] === 'GET' ? null : command[0] === 'SET' ? 'OK' : 1 });
    }
    if (url.includes('/tickets?')) return json(allowedTicket ? [allowedTicket] : []);
    if (url.includes('/rpc/')) return json(ticket);
    throw new Error(`Unexpected request ${url}`);
  });
  vi.stubGlobal('fetch', outbound);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

const request = (body) => ({ method: 'POST', headers: { host: 'softhe.io', origin: 'https://softhe.io', authorization: 'Bearer customer-token', 'content-type': 'application/json', 'idempotency-key': '12345678901234567890' }, body });
const response = () => { const res = { status: vi.fn((status) => { res.statusCode = status; return res; }), json: vi.fn() }; return res; };

it('uses the verified identity and service credentials for atomic ticket creation', async () => {
  const res = response();
  await ticketWrite(request({ action: 'create', subject: 'Support request', category: 'general', message: 'First message', userId: ticket }), res);
  expect(res.statusCode).toBe(201);
  const call = outbound.mock.calls.find(([url]) => url.endsWith('/rpc/create_ticket_for_user'));
  expect(call[1].headers.Authorization).toBe('Bearer service-key');
  expect(JSON.parse(call[1].body)).toEqual({ ticket_user: actor, ticket_subject: 'Support request', ticket_category: 'general', first_message: 'First message' });
  expect(outbound.mock.calls.some(([url]) => url.includes('rpc/create_customer_ticket'))).toBe(false);
});

it('checks ownership and uses the service reply RPC with the verified identity', async () => {
  const res = response();
  await ticketWrite(request({ action: 'message', ticketId: ticket, message: 'Reply' }), res);
  expect(res.statusCode).toBe(201);
  expect(outbound.mock.calls.some(([url]) => url.includes(`user_id=eq.${actor}&select=id,status`))).toBe(true);
  const call = outbound.mock.calls.find(([url]) => url.endsWith('/rpc/add_ticket_message_for_user'));
  expect(call[1].headers.Authorization).toBe('Bearer service-key');
  expect(JSON.parse(call[1].body)).toEqual({ ticket_user: actor, target_ticket: ticket, message_body: 'Reply' });
});

it.each([null, { id: ticket, status: 'closed' }])('denies unavailable or closed tickets before invoking the privileged RPC', async (row) => {
  allowedTicket = row;
  const res = response();
  await ticketWrite(request({ action: 'message', ticketId: ticket, message: 'Reply' }), res);
  expect(res.statusCode).toBe(403);
  expect(outbound.mock.calls.some(([url]) => url.includes('/rpc/'))).toBe(false);
});
