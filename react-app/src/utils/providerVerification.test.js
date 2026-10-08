import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
const { allowed, handleProviderVerification, runVerification, recoverVerification, totpCode } = require('../../../api/_lib/provider-verification');
const health = require('../../../api/health');
const isolatedUrl = 'https://zbchdxptibehtizomwiq.supabase.co';
const secret = 'provider-verification-fixture-secret-only';
const environment = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'customer-portal-test', SUPABASE_URL: isolatedUrl, PROVIDER_VERIFICATION_ENABLED: 'true', MONITORING_TEST_SECRET: secret };
const request = { method: 'POST', headers: { authorization: `Bearer ${secret}` }, body: { acknowledgeTemporaryUsers: true } };
const claims = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
const jwt = (id, aal = 'aal1') => `header.${Buffer.from(JSON.stringify({ sub: id, aal, session_id: crypto.randomUUID() })).toString('base64url')}.fixture`;
beforeEach(() => { for (const [key, value] of Object.entries({ ...environment, SUPABASE_PUBLISHABLE_KEY: 'publishable-fixture', SUPABASE_SERVICE_ROLE_KEY: 'service-fixture', PORTAL_RATE_LIMIT_SECRET: secret, STAFF_PORTAL_ENABLED: 'true' })) vi.stubEnv(key, value); });
afterEach(() => vi.unstubAllEnvs());
function providerFixture({ failSignin = false, failCleanup = false, failAuditCleanup = false, alternateCreatedId = false } = {}) {
	const users = new Map(); const tickets = new Map(); const messages = []; const replays = new Map(); const commands = []; let granted = false;
	const result = (data, status = 200) => ({ data, status, ok: status >= 200 && status < 300 });
	const provider = vi.fn(async (path, options = {}) => {
		const url = new URL(path, isolatedUrl); const id = options.token ? claims(options.token).sub : null;
		if (path === '/auth/v1/admin/users') { const actualId = alternateCreatedId ? crypto.randomUUID() : options.body.id; users.set(actualId, { ...options.body, id: actualId, profile: { id: actualId } }); return result({ id: actualId, email: options.body.email }); }
		if (path.startsWith('/auth/v1/token')) { if (failSignin) throw new Error('Do not expose provider-password'); const user = [...users.values()].find((value) => value.email === options.body.email); return result({ access_token: jwt(user.id), user: { id: user.id } }); }
		if (path.startsWith('/auth/v1/admin/users/')) { const target = path.split('/').at(-1); if (options.method === 'DELETE') { if (failCleanup) return result({}, 503); users.delete(target); return result(null); } return users.has(target) ? result({ id: target }) : result({}, 404); }
		if (path.startsWith('/auth/v1/logout')) return result(null, 204);
		if (path === '/auth/v1/factors') return result({ id: 'factor', totp: { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' } });
		if (path.endsWith('/challenge')) return result({ id: 'challenge' });
		if (path.endsWith('/verify')) return result({ access_token: jwt(id, 'aal2') });
		if (path === '/auth/v1/user') return result({ id });
		if (path.includes('rpc/grant_staff_access')) { granted = true; return result(null); }
		if (path.includes('rpc/revoke_staff_access')) { granted = false; return result(null); }
		if (url.pathname === '/rest/v1/profiles') {
			const target = url.searchParams.get('id')?.slice(3); const owner = options.admin || target === id;
			if (options.method === 'PATCH') { if (owner) users.get(target).profile = { ...users.get(target).profile, ...options.body }; return result(options.representation ? [] : null); }
			return result(owner && users.has(target) ? [users.get(target).profile] : []);
		}
		if (url.pathname === '/rest/v1/tickets') { const ticket = tickets.get(url.searchParams.get('id')?.slice(3)); return result(ticket?.userId === id ? [ticket] : []); }
		if (options.admin && options.method !== 'DELETE' && ['ticket_messages', 'user_roles', 'activity_events', 'staff_audit_events'].some((table) => url.pathname === `/rest/v1/${table}`)) return result([]);
		if (url.pathname === '/rest/v1/ticket_messages') return result(messages.filter((message) => message.ticketId === url.searchParams.get('ticket_id')?.slice(3)));
		if (url.pathname === '/rest/v1/staff_audit_events' && options.method === 'DELETE') return result(null, failAuditCleanup ? 503 : 204);
		throw new Error('Unhandled fixture request');
	});
	const ticketHandler = async (req, res) => {
		const id = claims(req.headers.authorization.slice(7)).sub; const body = req.body;
		if (users.get(id).profile.account_status === 'suspended') return res.status(403).json({});
		if (body.action === 'create') { const key = req.headers['idempotency-key']; if (replays.has(key)) return res.status(200).json({ id: replays.get(key), duplicate: true }); const ticketId = crypto.randomUUID(); tickets.set(ticketId, { id: ticketId, userId: id }); replays.set(key, ticketId); return res.status(201).json({ id: ticketId }); }
		if (tickets.get(body.ticketId)?.userId !== id) return res.status(403).json({});
		const messageId = crypto.randomUUID(); messages.push({ id: messageId, ticketId: body.ticketId, body: body.message }); return res.status(201).json({ id: messageId });
	};
	const staffHandler = async (req, res) => {
		if (!req.headers.authorization) return res.status(401).json({}); const token = claims(req.headers.authorization.slice(7));
		if (token.aal !== 'aal2' || !granted) return res.status(403).json({});
		if (req.query.action === 'status') return res.status(200).json({ authorized: true, mfa: 'aal2' });
		if (req.query.action === 'ticket') return res.status(200).json({ ticket: { id: req.query.id } });
		return res.status(201).json({ id: crypto.randomUUID() });
	};
	return { provider, users, commands, dependencies: { request: provider, command: async (command) => { commands.push(command); return command[0] === 'SET' ? 'OK' : 1; }, ticketHandler, staffHandler } };
}
describe('isolated provider verification safety', () => {
	it('journals and deletes a mismatched provider UUID only when its acknowledged email proves run ownership', async () => {
		const fixture = providerFixture({ alternateCreatedId: true }); const result = await runVerification(fixture.dependencies);
		expect(result.passed).toBe(false); expect(result.failedPhase).toBe('temporary_auth_password_signin'); expect(result.cleanup.passed).toBe(true); expect(result.cleanup.attemptedUsers).toBe(3); expect(fixture.users.size).toBe(0);
		const updated = fixture.commands.find((command) => command[0] === 'SET' && command[1].includes(':journal:') && !command.includes('NX'));
		expect(JSON.parse(updated[2]).userIds).toHaveLength(3);
	});
	it('does not adopt or delete an unexpected UUID with an unrelated acknowledged email', async () => {
		const fixture = providerFixture(); const unknown = crypto.randomUUID(); const raw = fixture.dependencies.request;
		fixture.dependencies.request = async (path, options) => { const value = await raw(path, options); return path === '/auth/v1/admin/users' ? { ...value, data: { id: unknown, email: 'unrelated@example.test' } } : value; };
		const result = await runVerification(fixture.dependencies); expect(result.passed).toBe(false); expect(fixture.provider.mock.calls.some(([path]) => path.includes(unknown))).toBe(false); expect(result.cleanup.attemptedUsers).toBe(2);
	});
	it('journals both preselected IDs before Auth creation and stops on budget exhaustion with cleanup', async () => {
		const fixture = providerFixture(); let elapsed = 0;
		const raw = fixture.dependencies.request;
		fixture.dependencies.request = async (...args) => { const value = await raw(...args); elapsed = 150001; return value; };
		const result = await runVerification({ ...fixture.dependencies, now: () => elapsed });
		const journal = JSON.parse(fixture.commands[0][2]); expect(journal.userIds).toHaveLength(2); expect(fixture.commands[0]).toContain('NX');
		expect(result.passed).toBe(false); expect(result.cleanup.passed).toBe(true); expect(fixture.users.size).toBe(0);
	});
	it('recovers only IDs from a durable journal and rejects an arbitrary missing journal', async () => {
		const runId = crypto.randomUUID(); const ids = [crypto.randomUUID(), crypto.randomUUID()];
		const command = vi.fn(async (args) => args[0] === 'GET' ? JSON.stringify({ runId, userIds: ids, writeKeys: [`portal:ticket-write:${ids[0]}:provider_${'a'.repeat(32)}`] }) : 1);
		const request = vi.fn(async (path, options) => ({ ok: true, data: [], status: options?.method === 'DELETE' ? 204 : path.startsWith('/rest/') ? 200 : 404 }));
		const result = await recoverVerification(runId, { command, request }); expect(result.passed).toBe(true); expect(request.mock.calls.every(([path]) => ids.some((id) => path.includes(id)))).toBe(true);
		expect(request.mock.calls.some(([path]) => path.includes('staff_audit_events') && path.includes('select=id'))).toBe(true);
		expect(command.mock.calls.some(([args]) => args[0] === 'DEL' && args.includes(`portal:ticket-write:${ids[0]}:provider_${'a'.repeat(32)}:lock`))).toBe(true);
		await expect(recoverVerification(crypto.randomUUID(), { command: async () => null, request })).rejects.toThrow();
		await expect(recoverVerification(runId, { command: async () => JSON.stringify({ runId, userIds: ids, writeKeys: ['unrelated:key'] }), request })).rejects.toThrow();
	});
	it('requires exact Preview branch, isolated project, explicit enablement, acknowledgement and bearer secret', () => {
		expect(allowed(request, environment)).toBe(true);
		for (const overrides of [{ VERCEL_ENV: 'production' }, { VERCEL_GIT_COMMIT_REF: 'main' }, { SUPABASE_URL: 'https://mbwsmyqofkxmxkelqviy.supabase.co' }, { PROVIDER_VERIFICATION_ENABLED: 'false' }, { MONITORING_TEST_SECRET: '' }]) expect(allowed(request, { ...environment, ...overrides })).toBe(false);
		expect(allowed({ ...request, method: 'GET' }, environment)).toBe(false); expect(allowed({ ...request, body: {} }, environment)).toBe(false); expect(allowed({ ...request, headers: { authorization: 'Bearer wrong-secret' } }, environment)).toBe(false);
	});
	it('returns a quiet 404 without contacting providers for disallowed environments', async () => {
		vi.stubEnv('VERCEL_ENV', 'production'); const response = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() }; await handleProviderVerification(request, response); expect(response.status).toHaveBeenCalledWith(404); expect(response.json).toHaveBeenCalledWith({ error: 'Not found' });
	});
	it('applies both health authorization and hook isolation before reaching any live provider', async () => {
		const outbound = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected provider request'));
		const response = () => ({ setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() });
		for (const [overrides, headers, status] of [[{ VERCEL_ENV: 'production' }, request.headers, 404], [{}, { authorization: 'Bearer wrong' }, 401], [{ PROVIDER_VERIFICATION_ENABLED: 'false' }, request.headers, 404], [{ SUPABASE_URL: 'https://mbwsmyqofkxmxkelqviy.supabase.co' }, request.headers, 404]]) {
			for (const [key, value] of Object.entries({ ...environment, ...overrides })) vi.stubEnv(key, value);
			const res = response(); await health({ ...request, headers, body: { ...request.body, kind: 'verify-isolated-portal' } }, res); expect(res.status).toHaveBeenCalledWith(status);
		}
		expect(outbound).not.toHaveBeenCalled(); outbound.mockRestore();
	});
	it('matches RFC6238 SHA1 six-digit TOTP examples', () => { const base32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; expect(totpCode(base32, 59000)).toBe('287082'); expect(totpCode(base32, 1111111109000)).toBe('081804'); expect(() => totpCode('invalid!')).toThrow(); });
	it('completes all provider stages and removes exact temporary users and Redis keys', async () => {
		const fixture = providerFixture(); const result = await runVerification(fixture.dependencies); expect(result.passed).toBe(true); expect(result.checks).toHaveLength(7); expect(result.cleanup).toEqual({ passed: true, attemptedUsers: 2, createdUsers: 2, removedUsers: 2 }); expect(fixture.users.size).toBe(0); expect(fixture.commands.find((command) => command[0] === 'DEL')[0]).toBe('DEL'); expect(fixture.commands.find((command) => command[0] === 'DEL').slice(1).every((key) => key.startsWith('portal:'))).toBe(true); expect(JSON.stringify(result)).not.toMatch(/"password":|"access_token":|service-fixture|publishable-fixture|@example|Aa1!/); expect(result.emailSent).toBe(false);
	});
	it('cleans up a created user after sign-in fails and exposes no provider error content', async () => {
		const fixture = providerFixture({ failSignin: true }); const result = await runVerification(fixture.dependencies); expect(result.passed).toBe(false); expect(result.failedPhase).toBe('temporary_auth_password_signin'); expect(result.cleanup.passed).toBe(true); expect(fixture.users.size).toBe(0); expect(JSON.stringify(result)).not.toContain('provider-password');
	});
	it('makes cleanup failure explicit and returns only exact temporary ids for recovery', async () => {
		const fixture = providerFixture({ failSignin: true, failCleanup: true }); const result = await runVerification(fixture.dependencies); expect(result.passed).toBe(false); expect(result.cleanup.passed).toBe(false); expect(result.cleanup.temporaryUserIds).toHaveLength(2); expect(result.cleanup.temporaryUserIds[0]).toMatch(/^[0-9a-f-]{36}$/); expect(result.cleanup.removedUsers).toBeNull();
	});
	it('still removes Auth users when independent audit cleanup fails', async () => {
		const fixture = providerFixture({ failAuditCleanup: true }); const result = await runVerification(fixture.dependencies); expect(result.passed).toBe(false); expect(result.cleanup.passed).toBe(false); expect(fixture.users.size).toBe(0); expect(result.cleanup.temporaryUserIds).toHaveLength(2);
	});
	it('does not start provider calls when directly invoked outside the isolated deployment', async () => {
		vi.stubEnv('SUPABASE_URL', 'https://mbwsmyqofkxmxkelqviy.supabase.co'); const fixture = providerFixture(); const result = await runVerification(fixture.dependencies); expect(result.passed).toBe(false); expect(result.failedPhase).toBe('configuration'); expect(fixture.provider).not.toHaveBeenCalled(); expect(result.cleanup.attemptedUsers).toBe(0);
	});
});



