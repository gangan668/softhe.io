import { StrictMode } from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn() }));
vi.mock('../lib/supabase', () => ({ portalConfigured: true, getSupabase: mocks.getSupabase }));
function Consumer() {
	const auth = useAuth();
	return <><div>{auth.loading ? 'loading' : auth.error || auth.user?.id || 'anonymous'}</div><div>{auth.staff ? 'staff' : 'customer'}</div><button onClick={auth.retry}>Retry</button></>;
}
function mount(path = '/login', strict = false) {
	const content = <MemoryRouter initialEntries={[path]}><AuthProvider><Consumer /></AuthProvider></MemoryRouter>;
	return render(strict ? <StrictMode>{content}</StrictMode> : content);
}
function client(session = null) {
	const unsubscribe = vi.fn();
	let callback;
	return { auth: { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }), onAuthStateChange: vi.fn((fn) => { callback = fn; return { data: { subscription: { unsubscribe } } }; }) }, unsubscribe, emit: (session) => callback('SIGNED_IN', session) };
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co'); vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authorized: true, mfa: 'aal2' }) })); });
describe('AuthProvider recovery and lifecycle', () => {
	it('keeps anonymous public pages free of authentication startup', () => { mount('/'); expect(screen.getByText('anonymous')).toBeInTheDocument(); expect(mocks.getSupabase).not.toHaveBeenCalled(); });
	it('restores stored sessions even on public routes', async () => { localStorage.setItem('sb-project-auth-token', '{}'); mocks.getSupabase.mockResolvedValue(client({ user: { id: 'returning' }, access_token: 'token' })); mount('/'); await screen.findByText('returning'); });
	it('settles an SDK failure and recovers on retry', async () => { mocks.getSupabase.mockRejectedValueOnce(new Error('chunk missing')).mockResolvedValue(client()); mount(); await screen.findByText('Authentication could not be loaded. Please try again.'); fireEvent.click(screen.getByText('Retry')); await screen.findByText('anonymous'); });
	it('handles returned session errors without leaving a loading screen', async () => { const sdk = client(); sdk.auth.getSession.mockResolvedValue({ data: {}, error: new Error('session unavailable') }); mocks.getSupabase.mockResolvedValue(sdk); mount(); await screen.findByText('Authentication could not be loaded. Please try again.'); expect(sdk.unsubscribe).toHaveBeenCalledOnce(); });
	it('does not install a subscription when an import resolves after unmount', async () => { let resolve; mocks.getSupabase.mockReturnValue(new Promise((done) => { resolve = done; })); const view = mount(); view.unmount(); const sdk = client(); await act(async () => resolve(sdk)); expect(sdk.auth.onAuthStateChange).not.toHaveBeenCalled(); });
	it('maintains one subscription in Strict Mode and cleans it up', async () => { const sdk = client(); mocks.getSupabase.mockResolvedValue(sdk); const view = mount('/login', true); await screen.findByText('anonymous'); expect(sdk.auth.onAuthStateChange).toHaveBeenCalledOnce(); view.unmount(); expect(sdk.unsubscribe).toHaveBeenCalledOnce(); });
	it('does not overwrite a newer auth event with an older initial snapshot', async () => { let resolve; const sdk = client(); sdk.auth.getSession.mockReturnValue(new Promise((done) => { resolve = done; })); mocks.getSupabase.mockResolvedValue(sdk); mount(); await waitFor(() => expect(sdk.auth.getSession).toHaveBeenCalled()); await act(async () => { sdk.emit({ user: { id: 'new-user' } }); resolve({ data: { session: null }, error: null }); }); expect(screen.getByText('new-user')).toBeInTheDocument(); });
	it('denies stale staff access when the user changes', async () => { const sdk = client({ user: { id: 'staff-user' }, access_token: 'staff-token' }); mocks.getSupabase.mockResolvedValue(sdk); mount(); await screen.findByText('staff'); vi.mocked(fetch).mockReturnValue(new Promise(() => {})); act(() => sdk.emit({ user: { id: 'other-user' }, access_token: 'other-token' })); expect(screen.getByText('customer')).toBeInTheDocument(); });
});
