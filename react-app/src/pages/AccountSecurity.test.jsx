import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Account from './Account';

const auth = vi.hoisted(() => ({ value: null }));
vi.mock('../context/useAuth', () => ({ useAuth: () => auth.value }));

const query = (result) => {
	const chain = {
		select: () => chain,
		eq: () => chain,
		order: () => chain,
		limit: () => chain,
		single: () => chain,
		update: () => chain,
		then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
	};
	return chain;
};

const createSupabase = () => ({
	from: vi.fn((table) => query({ data: table === 'profiles' ? { full_name: 'Jane' } : [], error: null })),
	auth: {
		reauthenticate: vi.fn().mockResolvedValue({ data: {}, error: null }),
		updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
		signOut: vi.fn(),
		refreshSession: vi.fn(),
		mfa: { listFactors: vi.fn(), enroll: vi.fn(), challenge: vi.fn(), verify: vi.fn() },
	},
});

const renderSecurityTab = async () => {
	const user = userEvent.setup();
	render(<MemoryRouter><Account /></MemoryRouter>);
	await screen.findByRole('heading', { name: /Hello, Jane/i });
	await user.click(screen.getByRole('button', { name: 'security' }));
	return user;
};

describe('Account secure password change', () => {
	let supabase;
	let fetchSpy;

	beforeEach(() => {
		supabase = createSupabase();
		auth.value = {
			// Old sign-in: the browser must not block the change; the server enforces reauthentication.
			user: { id: 'user-1', email: 'jane@example.com', last_sign_in_at: '2020-01-01T00:00:00Z' },
			session: { access_token: 'token' },
			staff: false,
			supabase,
		};
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('requests a one-time code, then updates the password with the nonce and revokes other sessions', async () => {
		const user = await renderSecurityTab();
		expect(screen.queryByLabelText(/New password/i)).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Send verification code' }));
		expect(supabase.auth.reauthenticate).toHaveBeenCalledTimes(1);
		expect(await screen.findByRole('status')).toHaveTextContent(/emailed you a verification code/i);

		await user.type(screen.getByLabelText(/Verification code/i), '123456');
		await user.type(screen.getByLabelText(/New password/i), 'Str0ng!Password');
		await user.click(screen.getByRole('button', { name: 'Change password' }));

		expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'Str0ng!Password', nonce: '123456' });
		expect(fetchSpy).toHaveBeenCalledWith('/api/session-revoke-others', expect.objectContaining({ method: 'POST' }));
		expect(await screen.findByText('Password updated and other sessions revoked.')).toBeInTheDocument();
	});

	it('enforces the strong-password policy before calling Supabase', async () => {
		const user = await renderSecurityTab();
		await user.click(screen.getByRole('button', { name: 'Send verification code' }));
		await user.type(await screen.findByLabelText(/Verification code/i), '123456');
		await user.type(screen.getByLabelText(/New password/i), 'weakpassword');
		await user.click(screen.getByRole('button', { name: 'Change password' }));

		expect(supabase.auth.updateUser).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent(/at least 12 characters/i);
	});

	it('shows friendly copy instead of raw Supabase errors', async () => {
		supabase.auth.updateUser.mockResolvedValue({
			data: {},
			error: { status: 401, code: 'reauthentication_not_valid', message: 'Verification code invalid (internal detail)' },
		});
		const user = await renderSecurityTab();
		await user.click(screen.getByRole('button', { name: 'Send verification code' }));
		await user.type(await screen.findByLabelText(/Verification code/i), '654321');
		await user.type(screen.getByLabelText(/New password/i), 'Str0ng!Password');
		await user.click(screen.getByRole('button', { name: 'Change password' }));

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('The verification code is invalid or has expired. Request a new code and try again.');
		expect(alert).not.toHaveTextContent(/internal detail/);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('maps a failed reauthentication request to generic copy', async () => {
		supabase.auth.reauthenticate.mockResolvedValue({ data: {}, error: { status: 500, message: 'smtp: relay host db-1 refused' } });
		const user = await renderSecurityTab();
		await user.click(screen.getByRole('button', { name: 'Send verification code' }));

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('The verification code could not be sent. Please try again.');
		expect(screen.queryByLabelText(/Verification code/i)).not.toBeInTheDocument();
	});
});
