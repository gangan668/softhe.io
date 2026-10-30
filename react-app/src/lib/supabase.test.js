import { AuthClient } from '@supabase/auth-js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const fetchMock = vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
const storageKey = 'sb-project-auth-token';
const session = (token) => ({ access_token: token, refresh_token: 'refresh-test', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'user-1', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } });
const lastRequest = () => { const [input, init] = fetchMock.mock.calls.at(-1); return { url: String(input), headers: new Headers(init.headers) }; };

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); localStorage.clear(); vi.stubGlobal('fetch', fetchMock); vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-test'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.doUnmock('@supabase/auth-js'); });

it('retries client initialization after a rejected cached promise', async () => {
	const constructor = vi.fn().mockImplementationOnce(() => { throw new Error('initialization failed'); }).mockImplementation(function client() { this.getSession = vi.fn(); });
	vi.doMock('@supabase/auth-js', () => ({ AuthClient: constructor }));
	const { getSupabase } = await import('./supabase');
	await expect(getSupabase()).rejects.toThrow('initialization failed');
	await expect(getSupabase()).resolves.toMatchObject({ auth: expect.any(Object) });
	expect(constructor).toHaveBeenCalledTimes(2);
});

it('shares one successful client and stays disabled without configuration', async () => {
	let module = await import('./supabase');
	const [first, second] = await Promise.all([module.getSupabase(), module.getSupabase()]);
	expect(first).toBe(second);
	vi.resetModules();
	vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
	module = await import('./supabase');
	await expect(module.getSupabase()).resolves.toBeNull();
});

it('keeps the supabase-js session key so existing sign-ins survive', async () => {
	localStorage.setItem(storageKey, JSON.stringify(session('stored-token')));
	const { getSupabase } = await import('./supabase');
	const { auth } = await getSupabase();
	expect(auth).toBeInstanceOf(AuthClient);
	expect((await auth.getSession()).data.session.access_token).toBe('stored-token');
});

it('sends the session token on table queries once signed in', async () => {
	localStorage.setItem(storageKey, JSON.stringify(session('stored-token')));
	const { getSupabase } = await import('./supabase');
	await (await getSupabase()).from('profiles').select('id');
	const { url, headers } = lastRequest();
	expect(url).toBe('https://project.supabase.co/rest/v1/profiles?select=id');
	expect(headers.get('Authorization')).toBe('Bearer stored-token');
	expect(headers.get('apikey')).toBe('publishable-test');
});

it('falls back to the publishable key on table queries when signed out', async () => {
	const { getSupabase } = await import('./supabase');
	await (await getSupabase()).from('profiles').select('id');
	expect(lastRequest().headers.get('Authorization')).toBe('Bearer publishable-test');
});

it('sends the publishable key on auth requests', async () => {
	const { getSupabase } = await import('./supabase');
	await (await getSupabase()).auth.signInWithPassword({ email: 'user@example.com', password: 'a-long-test-password' }).catch(() => {});
	const { url, headers } = lastRequest();
	expect(url).toContain('https://project.supabase.co/auth/v1/token');
	expect(headers.get('apikey')).toBe('publishable-test');
});
