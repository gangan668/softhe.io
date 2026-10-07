import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Account from './Account';
const mock = vi.hoisted(() => ({ recover: vi.fn(), write: vi.fn(), notify: vi.fn() }));
vi.mock('../utils/portalSession', () => ({ runPortalQueriesWithSessionRecovery: mock.recover }));
vi.mock('../utils/portal', () => ({ writeTicket: mock.write, notifyTicketReply: mock.notify }));
let supabase;
const ticket = { id: 'ticket-1', subject: 'Existing ticket', status: 'open' };
const results = (tickets = []) => ({ results: [{ data: { full_name: 'Customer' } }, { data: [] }, { data: tickets }, { data: [] }] });
function mount() { render(<MemoryRouter><AuthContext.Provider value={{ user: { id: 'customer', email: 'customer@example.test', last_sign_in_at: new Date().toISOString() }, session: { access_token: 'fixture' }, supabase }}><Routes><Route path="/" element={<Account />} /><Route path="/login" element={<div>Signed out destination</div>} /></Routes></AuthContext.Provider></MemoryRouter>); }
beforeEach(() => {
	vi.clearAllMocks();
	const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ id: 'message-1', author_id: 'customer', body: 'Earlier reply', created_at: '2026-10-01' }] }), update: vi.fn().mockReturnThis(), then: (resolve) => Promise.resolve({ error: null }).then(resolve) };
	supabase = { from: vi.fn(() => chain), auth: { signOut: vi.fn().mockResolvedValue({}), updateUser: vi.fn().mockResolvedValue({}), mfa: { listFactors: vi.fn().mockResolvedValue({ data: { totp: [] } }), enroll: vi.fn().mockResolvedValue({ error: { message: 'denied' } }), challenge: vi.fn().mockResolvedValue({ error: { message: 'denied' } }), verify: vi.fn() } } };
	mock.recover.mockResolvedValue(results()); mock.notify.mockResolvedValue(true); mock.write.mockResolvedValue({ id: 'new-ticket' });
});
it('shows empty orders and tickets', async () => { mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'orders', exact: true })); expect(screen.getByText(/No linked orders yet/)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'tickets', exact: true })); expect(screen.getByText(/You have not created any support tickets yet/)).toBeInTheDocument(); });
it('settles rejected account loading', async () => { mock.recover.mockRejectedValue(new Error('network failed')); mount(); await screen.findByRole('alert'); expect(screen.getByRole('alert')).toHaveTextContent('Account could not be loaded'); expect(screen.queryByText('Loading account…')).not.toBeInTheDocument(); });
it('persists profile updates scoped to the customer id', async () => { mount(); await screen.findByLabelText('Full name'); fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Updated Customer' } }); fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Berlin' } }); fireEvent.click(screen.getByRole('button', { name: 'Save profile' })); await waitFor(() => expect(supabase.from().update).toHaveBeenCalled()); expect(supabase.from).toHaveBeenCalledWith('profiles'); expect(supabase.from().update).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Updated Customer', billing_address: expect.objectContaining({ city: 'Berlin' }) })); expect(supabase.from().eq).toHaveBeenCalledWith('id', 'customer'); });
it('creates tickets and preserves success when email delivery fails', async () => { mock.notify.mockResolvedValue(false); mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'tickets', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'New ticket' })); fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'New question' } }); fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Please help' } }); fireEvent.click(screen.getByRole('button', { name: 'Create ticket' })); await screen.findByText('Ticket new-tick created.'); expect(mock.write).toHaveBeenCalledWith({ access_token: 'fixture' }, { action: 'create', subject: 'New question', category: 'general', message: 'Please help' }); expect(screen.getByRole('alert')).toHaveTextContent('Ticket saved, but the email notification could not be sent.'); });
it('blocks duplicate replies while a request is pending and permits retry after failure', async () => { mock.recover.mockResolvedValue(results([ticket])); let reject; mock.write.mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; })); mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'tickets', exact: true })); fireEvent.click(screen.getByRole('button', { name: /Existing ticket/ })); await screen.findByText('Earlier reply'); fireEvent.change(screen.getByLabelText('Reply'), { target: { value: '  Follow up  ' } }); const form = screen.getByRole('button', { name: 'Send reply' }).closest('form'); fireEvent.submit(form); fireEvent.submit(form); expect(mock.write).toHaveBeenCalledTimes(1); await act(async () => reject(new Error('Reply rejected'))); expect(screen.getByRole('alert')).toHaveTextContent('Reply rejected'); expect(screen.getByLabelText('Reply')).toHaveValue('  Follow up  '); fireEvent.submit(form); await waitFor(() => expect(mock.write).toHaveBeenCalledTimes(2)); expect(mock.write).toHaveBeenLastCalledWith({ access_token: 'fixture' }, { action: 'message', ticketId: 'ticket-1', message: 'Follow up' }); });
it('clears the invalid session locally and navigates to login', async () => { mock.recover.mockResolvedValue({ ...results(), sessionInvalid: true, error: new Error('Session expired') }); mount(); await screen.findByText('Signed out destination'); expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' }); expect(screen.queryByText('Hello, Customer')).not.toBeInTheDocument(); });
it('reports MFA enrollment and challenge failures', async () => { mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'security', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'Set up or verify MFA' })); await screen.findByText('MFA enrollment could not be started.'); supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: 'factor', status: 'verified' }] } }); fireEvent.click(screen.getByRole('button', { name: 'Set up or verify MFA' })); await screen.findByLabelText('Six-digit code'); fireEvent.change(screen.getByLabelText('Six-digit code'), { target: { value: '123456' } }); fireEvent.click(screen.getByRole('button', { name: 'Verify MFA' })); await screen.findByText('MFA challenge could not be created.'); expect(supabase.auth.mfa.verify).not.toHaveBeenCalled(); });
it('signs out and removes customer data from the view', async () => { mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); await screen.findByText('Signed out destination'); expect(supabase.auth.signOut).toHaveBeenCalledOnce(); });
it('completes password rotation and clears the submitted password after revoking other sessions', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
	mount(); await screen.findByText('Hello, Customer');
	fireEvent.click(screen.getByRole('button', { name: 'security', exact: true }));
	const password = screen.getByLabelText(/New password/);
	fireEvent.change(password, { target: { value: 'StrongPassword123!' } });
	fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
	await screen.findByText('Password updated and other sessions revoked.');
	expect(password).toHaveValue('');
	expect(fetch).toHaveBeenCalledWith('/api/session-revoke-others', expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer fixture' }) }));
});
it('prevents duplicate ticket creation while the first save is pending', async () => {
	let resolve; mock.write.mockReturnValue(new Promise((done) => { resolve = done; }));
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'tickets', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'New ticket' })); fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Question' } }); fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Help' } });
	const form = screen.getByRole('button', { name: 'Create ticket' }).closest('form');
	act(() => { fireEvent.submit(form); fireEvent.submit(form); });
	expect(mock.write).toHaveBeenCalledTimes(1);
	await act(async () => resolve({ id: 'new-ticket' }));
});
it('keeps the newest selected ticket conversation when older reads finish later', async () => {
	mock.recover.mockResolvedValue(results([ticket, { id: 'ticket-2', subject: 'Second ticket', status: 'open' }]));
	const reads = [];
	supabase.from().order.mockImplementation(() => new Promise((resolve) => reads.push(resolve)));
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'tickets', exact: true }));
	fireEvent.click(screen.getByRole('button', { name: /Existing ticket/ })); fireEvent.click(screen.getByRole('button', { name: /Second ticket/ }));
	await act(async () => reads[1]({ data: [{ id: 'b', body: 'Second conversation', created_at: '2026-10-01' }] }));
	await act(async () => reads[0]({ data: [{ id: 'a', body: 'Stale first conversation', created_at: '2026-10-01' }] }));
	expect(screen.getByText('Second conversation')).toBeInTheDocument(); expect(screen.queryByText('Stale first conversation')).not.toBeInTheDocument();
});
it('preserves saved ticket success after a rejected notification request', async () => {
	mock.notify.mockRejectedValue(new Error('network'));
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'tickets', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'New ticket' })); fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Question' } }); fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Help' } }); fireEvent.click(screen.getByRole('button', { name: 'Create ticket' }));
	await screen.findByText('Ticket new-tick created.'); expect(screen.getByRole('alert')).toHaveTextContent('Ticket saved, but the email notification could not be sent.');
});
it('reports rejected profile writes and sign-out without unhandled errors', async () => {
	supabase.from().then = (_resolve, reject) => Promise.reject(new Error('network')).then(_resolve, reject);
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'Save profile' })); await screen.findByText('Profile could not be saved. Please try again.');
	supabase.auth.signOut.mockRejectedValue(new Error('network')); fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); await screen.findByText('Sign-out could not be completed. Please try again.'); expect(screen.queryByText('Signed out destination')).not.toBeInTheDocument();
});
it('does not claim AAL2 success when MFA session refresh fails', async () => {
	supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: 'factor', status: 'verified' }] } }); supabase.auth.mfa.challenge.mockResolvedValue({ data: { id: 'challenge' } }); supabase.auth.mfa.verify.mockResolvedValue({}); supabase.auth.refreshSession = vi.fn().mockResolvedValue({ error: new Error('refresh failed') });
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'security', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'Set up or verify MFA' })); await screen.findByLabelText('Six-digit code'); fireEvent.change(screen.getByLabelText('Six-digit code'), { target: { value: '123456' } }); fireEvent.click(screen.getByRole('button', { name: 'Verify MFA' }));
	await screen.findByText(/MFA was verified, but this session could not be refreshed/); expect(screen.queryByText('MFA verified. This session now has AAL2 assurance.')).not.toBeInTheDocument();
});
it('reports a thrown MFA lookup and verification request', async () => {
	supabase.auth.mfa.listFactors.mockRejectedValueOnce(new Error('network')).mockResolvedValue({ data: { totp: [{ id: 'factor', status: 'verified' }] } });
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'security', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'Set up or verify MFA' })); await screen.findByText('MFA enrollment could not be started.'); fireEvent.click(screen.getByRole('button', { name: 'Set up or verify MFA' })); await screen.findByLabelText('Six-digit code'); supabase.auth.mfa.challenge.mockRejectedValue(new Error('network')); fireEvent.change(screen.getByLabelText('Six-digit code'), { target: { value: '123456' } }); fireEvent.click(screen.getByRole('button', { name: 'Verify MFA' })); await screen.findByText('MFA verification could not be completed. Please try again.');
});
it('reports password changed when session revocation throws after successful rotation', async () => {
	vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network'))); mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'security', exact: true })); fireEvent.change(screen.getByLabelText(/New password/), { target: { value: 'StrongPassword123!' } }); fireEvent.click(screen.getByRole('button', { name: 'Change password' })); await screen.findByText('Password changed, but other sessions could not be revoked. Please sign out of all devices.');
});
it('ignores an old customer load after the authenticated user changes', async () => {
	let resolveOld; mock.recover.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; })).mockResolvedValue({ results: [{ data: { full_name: 'New Customer' } }, { data: [] }, { data: [] }, { data: [] }] });
	const tree = (id) => <MemoryRouter><AuthContext.Provider value={{ user: { id, email: `${id}@example.test` }, session: { access_token: id }, supabase }}><Account /></AuthContext.Provider></MemoryRouter>;
	const view = render(tree('old')); await waitFor(() => expect(mock.recover).toHaveBeenCalledOnce()); view.rerender(tree('new')); await screen.findByText('Hello, New Customer');
	await act(async () => resolveOld({ results: [{ data: { full_name: 'Old Private Customer' } }, { data: [] }, { data: [] }, { data: [] }] }));
	expect(screen.getByText('Hello, New Customer')).toBeInTheDocument(); expect(screen.queryByText('Hello, Old Private Customer')).not.toBeInTheDocument();
});
it('completes verified MFA and exposes its refreshed session result', async () => {
	supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: 'factor', status: 'verified' }] } }); supabase.auth.mfa.challenge.mockResolvedValue({ data: { id: 'challenge' } }); supabase.auth.mfa.verify.mockResolvedValue({}); supabase.auth.refreshSession = vi.fn().mockResolvedValue({ data: { session: { access_token: 'aal2' } } });
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'security', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'Set up or verify MFA' })); await screen.findByLabelText('Six-digit code'); fireEvent.change(screen.getByLabelText('Six-digit code'), { target: { value: '123456' } }); fireEvent.click(screen.getByRole('button', { name: 'Verify MFA' })); await screen.findByText('MFA verified. This session now has AAL2 assurance.'); expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({ factorId: 'factor', challengeId: 'challenge', code: '123456' });
});
it('renders actual order and activity records without confusing empty-state copy', async () => {
	mock.recover.mockResolvedValue({ results: [{ data: { full_name: 'Customer' } }, { data: [{ id: 'order', stripe_session_id: 'fixture-order-12345', status: 'paid', created_at: '2026-10-01', currency: 'eur', amount_total: 2500, order_items: [{ product_name: 'Fixture product', quantity: 1 }] }] }, { data: [] }, { data: [{ id: 'event', event_type: 'profile.updated', created_at: '2026-10-01' }] }] });
	mount(); await screen.findByText('Hello, Customer'); fireEvent.click(screen.getByRole('button', { name: 'orders', exact: true })); expect(screen.getByText('Fixture product × 1')).toBeInTheDocument(); expect(screen.queryByText(/No linked orders yet/)).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'history', exact: true })); expect(screen.getByText('profile updated')).toBeInTheDocument();
});
