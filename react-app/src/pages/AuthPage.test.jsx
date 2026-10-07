import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthPage from './AuthPage';
let auth;
function mount(mode = 'login', context = {}) {
	return render(<MemoryRouter><AuthContext.Provider value={{ configured: true, loading: false, supabase: { auth }, ...context }}><Routes><Route path="/" element={<AuthPage mode={mode} />} /><Route path="/account" element={<div>Account destination</div>} /></Routes></AuthContext.Provider></MemoryRouter>);
}
function fill(mode, password = 'StrongPassword123!') {
	fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.test' } });
	if (mode === 'register') fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Fixture Customer' } });
	if (mode === 'register' || mode === 'login') fireEvent.change(screen.getByLabelText(/Password/), { target: { value: password } });
	fireEvent.submit(screen.getByLabelText('Email').closest('form'));
}
beforeEach(() => {
	window.history.replaceState(null, '', '/');
	auth = { signInWithPassword: vi.fn().mockResolvedValue({}), signUp: vi.fn().mockResolvedValue({}), resetPasswordForEmail: vi.fn().mockResolvedValue({}), resend: vi.fn().mockResolvedValue({}) };
});
afterEach(() => { cleanup(); window.history.replaceState(null, '', '/'); });
it('settles a thrown sign-in request so the user can retry', async () => {
	auth.signInWithPassword.mockRejectedValue(new Error('network failure')); mount(); fill('login');
	await screen.findByRole('alert'); expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled(); expect(auth.signInWithPassword).toHaveBeenCalledOnce();
});
it('navigates a successful login to the customer account', async () => {
	mount(); fill('login'); await screen.findByText('Account destination');
	expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'customer@example.test', password: 'StrongPassword123!', options: {} });
});
it('sends registration details with the canonical email callback', async () => {
	mount('register'); fill('register'); await screen.findByText('If this address is awaiting verification, a confirmation email will arrive shortly.');
	expect(auth.signUp).toHaveBeenCalledWith({ email: 'customer@example.test', password: 'StrongPassword123!', options: { data: { full_name: 'Fixture Customer' }, emailRedirectTo: 'https://softhe.io/login' } });
});
it('rejects a weak registration password before contacting the provider', async () => {
	mount('register'); fill('register', 'weakpassword'); await screen.findByRole('alert'); expect(auth.signUp).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toHaveTextContent('uppercase');
});
it('requests password recovery with the canonical callback and a neutral confirmation', async () => {
	mount('forgot'); fill('forgot'); await screen.findByText('If an account exists for this address, a reset email will arrive shortly.');
	expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('customer@example.test', { redirectTo: 'https://softhe.io/reset-password' }); expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
});
it('resends signup confirmation without a password field', async () => {
	mount('resend'); fill('resend'); await screen.findByText('If this address is awaiting verification, a confirmation email will arrive shortly.');
	expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'customer@example.test', options: { emailRedirectTo: 'https://softhe.io/login' } }); expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
});
it.each(['forgot', 'resend', 'register'])('keeps unknown identity errors neutral for %s', async (mode) => {
	for (const request of Object.values(auth)) request.mockResolvedValue({ error: { message: 'Unknown identity', code: 'identity_unknown' } }); mount(mode); fill(mode);
	await screen.findByText(mode === 'forgot' ? 'If an account exists for this address, a reset email will arrive shortly.' : 'If this address is awaiting verification, a confirmation email will arrive shortly.'); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('shows actionable email delivery failure and permits recovery retry', async () => {
	auth.resetPasswordForEmail.mockResolvedValue({ error: { code: 'smtp_failure', message: 'Error sending email' } }); mount('forgot'); fill('forgot'); await screen.findByRole('alert'); expect(screen.getByRole('alert')).toHaveTextContent('verification email could not be sent'); expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled();
});
it('distinguishes missing configuration from a still-loading client', async () => {
	const view = mount('login', { configured: false, supabase: null }); fill('login'); await screen.findByText('Customer portal is not configured.'); view.unmount(); mount('login', { supabase: null }); fill('login'); await screen.findByText('Authentication is still loading. Please try again.'); expect(auth.signInWithPassword).not.toHaveBeenCalled();
});
it('offers provider retry and disables form submission while initialization is pending', () => {
	const retry = vi.fn(); const view = mount('login', { error: 'Authentication initialization failed', retry }); fireEvent.click(screen.getByRole('button', { name: 'Try again' })); expect(retry).toHaveBeenCalledOnce(); view.unmount(); mount('login', { loading: true }); expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
});
it('redirects a signed-in user away from signup while allowing recovery requests', async () => {
	const view = mount('register', { user: { id: 'customer' } }); await screen.findByText('Account destination'); view.unmount(); mount('forgot', { user: { id: 'customer' } }); expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();
});
it('retains a recovery callback error from router state', async () => {
	window.history.replaceState({ authError: 'Expired recovery callback' }, '', '/'); mount('forgot'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Expired recovery callback'));
});
