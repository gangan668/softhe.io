import { forwardRef, useImperativeHandle } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
const fixture = vi.hoisted(() => ({ state: {}, reset: vi.fn() }));
vi.mock('../context/useAuth', () => ({ useAuth: () => fixture.state }));
vi.mock('@marsidev/react-turnstile', () => ({ Turnstile: forwardRef(function Widget({ onSuccess, onExpire, onError }, ref) {
	useImperativeHandle(ref, () => ({ reset: fixture.reset }));
	return <><button type="button" onClick={() => onSuccess('fixture-captcha')}>Solve security check</button><button type="button" onClick={onExpire}>Expire security check</button><button type="button" onClick={onError}>Fail security check</button></>;
}) }));
async function mount(siteKey = 'fixture-site-key') {
	vi.resetModules(); vi.stubEnv('VITE_CAPTCHA_ENABLED', 'true'); vi.stubEnv('VITE_TURNSTILE_SITE_KEY', siteKey);
	fixture.state = { configured: true, loading: false, supabase: { auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: { message: 'invalid credentials' } }) } } };
	const { default: AuthPage } = await import('./AuthPage');
	render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>);
	fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.test' } }); fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123!' } });
}
afterEach(() => { cleanup(); vi.unstubAllEnvs(); fixture.reset.mockClear(); });
it('requires configured security verification and does not send provider requests without it', async () => {
	await mount(''); expect(screen.getByRole('alert')).toHaveTextContent('Security verification is not configured.'); expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled(); fireEvent.submit(screen.getByLabelText('Email').closest('form')); expect(fixture.state.supabase.auth.signInWithPassword).not.toHaveBeenCalled();
});
it('blocks missing, expired, and failed security tokens then sends a solved token and resets it', async () => {
	await mount(); expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled(); fireEvent.submit(screen.getByLabelText('Email').closest('form')); expect(fixture.state.supabase.auth.signInWithPassword).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Solve security check' })); expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled(); fireEvent.click(screen.getByRole('button', { name: 'Expire security check' })); expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
	fireEvent.click(screen.getByRole('button', { name: 'Solve security check' })); fireEvent.click(screen.getByRole('button', { name: 'Fail security check' })); expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
	fireEvent.click(screen.getByRole('button', { name: 'Solve security check' })); fireEvent.click(screen.getByRole('button', { name: 'Sign in' })); await screen.findByText('Sign-in could not be completed. Check your details and try again.'); expect(fixture.state.supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'customer@example.test', password: 'StrongPassword123!', options: { captchaToken: 'fixture-captcha' } }); expect(fixture.reset).toHaveBeenCalledOnce(); expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
});
