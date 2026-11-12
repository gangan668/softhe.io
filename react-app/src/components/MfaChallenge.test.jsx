import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import MfaChallenge from './MfaChallenge';

let auth;
const mount = () => render(<AuthContext.Provider value={{ supabase: { auth } }}><MfaChallenge /></AuthContext.Provider>);
const submit = (code = '123456') => { fireEvent.change(screen.getByLabelText('Authenticator code'), { target: { value: code } }); fireEvent.click(screen.getByRole('button', { name: 'Verify' })); };
beforeEach(() => {
	auth = { signOut: vi.fn().mockResolvedValue({}), mfa: {
		listFactors: vi.fn().mockResolvedValue({ data: { totp: [{ id: 'factor', status: 'verified' }] } }),
		challenge: vi.fn().mockResolvedValue({ data: { id: 'challenge' } }),
		verify: vi.fn().mockResolvedValue({ data: {} }),
	} };
});

it('verifies the code against the enrolled factor', async () => {
	mount(); submit();
	await vi.waitFor(() => expect(auth.mfa.verify).toHaveBeenCalledWith({ factorId: 'factor', challengeId: 'challenge', code: '123456' }));
	expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('rejects a wrong code and clears it', async () => {
	auth.mfa.verify.mockResolvedValue({ error: new Error('invalid') }); mount(); submit('000000');
	await screen.findByText('That authenticator code was not accepted.');
	expect(screen.getByLabelText('Authenticator code')).toHaveValue('');
});
it('reports a missing factor and lets the user sign out', async () => {
	auth.mfa.listFactors.mockResolvedValue({ data: { totp: [] } }); mount(); submit();
	await screen.findByText('Verification could not be completed. Please try again.');
	fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
	expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
});
