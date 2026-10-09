import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ResetPassword from './ResetPassword';
let auth;
function mount(context = {}) { return render(<MemoryRouter><AuthContext.Provider value={{ configured: true, loading: false, supabase: { auth }, ...context }}><ResetPassword /></AuthContext.Provider></MemoryRouter>); }
function submit(password = 'StrongPassword123!') { fireEvent.change(screen.getByLabelText(/New password/), { target: { value: password } }); fireEvent.submit(screen.getByRole('button', { name: 'Update password' }).closest('form')); }
beforeEach(() => { window.history.replaceState(null, '', '/reset-password'); auth = { verifyOtp: vi.fn().mockResolvedValue({}), updateUser: vi.fn().mockResolvedValue({}) }; });
afterEach(() => { cleanup(); window.history.replaceState(null, '', '/'); });
it('settles rejected recovery verification and offers a new link', async () => {
	window.history.replaceState(null, '', '/reset-password?token_hash=test'); auth.verifyOtp.mockRejectedValue(new Error('network')); mount(); await screen.findByRole('alert'); expect(screen.getByRole('link', { name: 'Request a new reset link' })).toBeInTheDocument(); expect(screen.queryByText('Verifying recovery link…')).not.toBeInTheDocument();
});
it('verifies a recovery token, removes it from the address, and updates the password', async () => {
	window.history.replaceState(null, '', '/reset-password?token_hash=fixture'); mount(); await screen.findByText('Choose a new password.'); expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'fixture', type: 'recovery' }); expect(window.location.search).toBe(''); submit(); await screen.findByText('Password updated. You can now return to your account.'); expect(auth.updateUser).toHaveBeenCalledWith({ password: 'StrongPassword123!' }); expect(screen.getByRole('link', { name: 'Return to account' })).toBeInTheDocument();
});
it('shows a ready message after the auth client establishes the callback session', () => {
	const context = { configured: true, loading: true, supabase: { auth }, user: null };
	const view = mount(context);
	expect(screen.getByRole('status')).toHaveTextContent('Verifying recovery link…');
	view.rerender(<MemoryRouter><AuthContext.Provider value={{ ...context, loading: false, user: { id: 'recovered-customer' } }}><ResetPassword /></AuthContext.Provider></MemoryRouter>);
	expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled();
	expect(screen.getByRole('status')).toHaveTextContent('Choose a new password.');
	expect(screen.queryByText(/invalid or has expired/)).not.toBeInTheDocument();
	expect(auth.verifyOtp).not.toHaveBeenCalled();
});
it('rejects weak recovery passwords locally', async () => {
	mount({ user: { id: 'customer' } }); submit('weakpassword'); await screen.findByText('Use at least 12 characters with uppercase, lowercase, a number, and a symbol.', { selector: '.portal-error' }); expect(auth.updateUser).not.toHaveBeenCalled();
});
it.each(['returned', 'thrown'])('shows a recoverable password update failure when it is %s', async (kind) => {
	if (kind === 'returned') auth.updateUser.mockResolvedValue({ error: new Error('provider denied') }); else auth.updateUser.mockRejectedValue(new Error('network')); mount({ user: { id: 'customer' } }); submit(); await screen.findByText('Password could not be updated. Request a new recovery link and try again.'); expect(screen.getByRole('alert')).toHaveClass('portal-error'); expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled();
});
it('refuses a returned invalid token and hides password controls', async () => {
	window.history.replaceState(null, '', '/reset-password?token_hash=expired'); auth.verifyOtp.mockResolvedValue({ error: new Error('expired') }); mount(); await screen.findByRole('alert'); expect(screen.queryByRole('button', { name: 'Update password' })).not.toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Request a new reset link' })).toBeInTheDocument();
});
it('does not change browser history when verification completes after unmount', async () => {
	window.history.replaceState(null, '', '/reset-password?token_hash=pending'); let resolve; auth.verifyOtp.mockReturnValue(new Promise((done) => { resolve = done; })); const view = mount(); view.unmount(); await act(async () => resolve({})); expect(window.location.search).toBe('?token_hash=pending');
});
it('does not contact the provider for a missing token or disabled portal', () => {
	const view = mount(); expect(auth.verifyOtp).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toHaveTextContent('invalid or has expired'); view.unmount(); window.history.replaceState(null, '', '/reset-password?token_hash=test'); mount({ configured: false, supabase: null }); expect(auth.verifyOtp).not.toHaveBeenCalled();
});
it('shows authentication initialization retry and a pending verification state', () => {
	const retry = vi.fn(); const view = mount({ error: 'Authentication initialization failed', retry }); fireEvent.click(screen.getByRole('button', { name: 'Try again' })); expect(retry).toHaveBeenCalledOnce(); view.unmount(); mount({ loading: true }); expect(screen.getByRole('status')).toHaveTextContent('Verifying recovery link…');
});

