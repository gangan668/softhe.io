import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Admin from './Admin';
const mock = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../utils/staff', () => ({ staffRequest: mock.request }));
const ticket = { id: 'ticket', subject: 'Support question', status: 'open' };
function mount() { render(<MemoryRouter><AuthContext.Provider value={{ user: { id: 'staff' }, session: { access_token: 'test' } }}><Admin /></AuthContext.Provider></MemoryRouter>); }
function handler(_session, action, options = {}) { if (action === 'queue') return { tickets: [ticket] }; if (action === 'status' && options.method !== 'POST') return { role: 'support', mfa: 'aal2' }; if (action === 'ticket') return { ticket, messages: [{ id: 'm', author_id: 'customer', body: 'Customer message' }] }; return {}; }
beforeEach(() => { vi.clearAllMocks(); mock.request.mockImplementation(async (...args) => handler(...args)); });
it('reports denied server access and shows no customer information', async () => { mock.request.mockRejectedValue(new Error('Staff access denied')); mount(); await screen.findByRole('alert'); expect(screen.getByRole('alert')).toHaveTextContent('Staff access denied'); expect(screen.queryByText('Recent orders')).not.toBeInTheDocument(); });
it('loads support queue without requesting admin-only customer and order lists', async () => { mount(); await screen.findByText('Support question'); expect(mock.request.mock.calls.map((call) => call[1])).toEqual(['queue', 'status']); fireEvent.click(screen.getByRole('button', { name: /Support question/ })); await screen.findByText('Customer message'); expect(screen.getByRole('combobox', { name: 'Ticket status' })).toHaveValue('open'); });
it('shows server-authorized admin order and customer summaries', async () => { mock.request.mockImplementation(async (session, action, options) => action === 'status' ? { role: 'admin', mfa: 'aal2', sessions: [{}] } : action === 'orders' ? { orders: [{ id: 'order', customer_email: 'buyer@example.test', status: 'paid', amount_total: 2500, currency: 'eur' }] } : action === 'customers' ? { customers: [{ id: 'customer' }] } : handler(session, action, options)); mount(); await screen.findByText('buyer@example.test'); expect(screen.getByText('25.00 EUR')).toBeInTheDocument(); expect(mock.request.mock.calls.map((call) => call[1])).toEqual(['queue', 'status', 'orders', 'customers']); });
it('reports failed ticket reads without showing a conversation', async () => { mock.request.mockImplementation(async (...args) => { if (args[1] === 'ticket') throw new Error('Ticket unavailable'); return handler(...args); }); mount(); await screen.findByText('Support question'); fireEvent.click(screen.getByRole('button', { name: /Support question/ })); await screen.findByText('Ticket unavailable'); expect(screen.queryByText('Customer message')).not.toBeInTheDocument(); });
it('preserves ticket status and reply content when privileged actions fail', async () => { mock.request.mockImplementation(async (...args) => { if (args[1] === 'reply' || args[2]?.method === 'POST') throw new Error('Access revoked'); return handler(...args); }); mount(); await screen.findByText('Support question'); fireEvent.click(screen.getByRole('button', { name: /Support question/ })); await screen.findByText('Customer message'); fireEvent.change(screen.getByRole('combobox', { name: 'Ticket status' }), { target: { value: 'closed' } }); await screen.findByText('Access revoked'); expect(screen.getByRole('combobox', { name: 'Ticket status' })).toHaveValue('open'); const text = screen.getByRole('textbox'); fireEvent.change(text, { target: { value: ' Staff reply ' } }); fireEvent.click(screen.getByRole('button', { name: 'Reply as staff' })); await waitFor(() => expect(screen.getByRole('button', { name: 'Reply as staff' })).toBeEnabled()); expect(text).toHaveValue(' Staff reply '); expect(mock.request).toHaveBeenLastCalledWith({ access_token: 'test' }, 'reply', { method: 'POST', body: { ticketId: 'ticket', message: 'Staff reply' } }); });
it('refreshes the conversation and queue after a successful reply', async () => { mount(); await screen.findByText('Support question'); fireEvent.click(screen.getByRole('button', { name: /Support question/ })); await screen.findByText('Customer message'); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Response' } }); fireEvent.click(screen.getByRole('button', { name: 'Reply as staff' })); await waitFor(() => expect(mock.request.mock.calls.filter((call) => call[1] === 'queue')).toHaveLength(2)); expect(screen.getByRole('textbox')).toHaveValue(''); });
it('blocks two simultaneous staff replies until the saved reply is refreshed', async () => {
	let resolve; mock.request.mockImplementation(async (...args) => args[1] === 'reply' ? new Promise((done) => { resolve = done; }) : handler(...args));
	mount(); await screen.findByText('Support question'); fireEvent.click(screen.getByRole('button', { name: /Support question/ })); await screen.findByText('Customer message'); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Reply' } }); const form = screen.getByRole('button', { name: 'Reply as staff' }).closest('form');
	act(() => { fireEvent.submit(form); fireEvent.submit(form); });
	expect(mock.request.mock.calls.filter((call) => call[1] === 'reply')).toHaveLength(1);
	await act(async () => resolve({}));
});
it('removes previously visible admin summaries when access is downgraded during queue refresh', async () => {
	let role = 'admin';
	mock.request.mockImplementation(async (session, action, options) => action === 'status' && options?.method !== 'POST' ? { role, mfa: 'aal2' } : action === 'orders' ? { orders: [{ id: 'order', customer_email: 'private@example.test', status: 'paid', amount_total: 100, currency: 'eur' }] } : action === 'customers' ? { customers: [{ id: 'customer' }] } : handler(session, action, options));
	mount(); await screen.findByText('private@example.test'); fireEvent.click(screen.getByRole('button', { name: /Support question/ })); await screen.findByText('Customer message'); role = 'support'; fireEvent.change(screen.getByRole('combobox', { name: 'Ticket status' }), { target: { value: 'closed' } });
	await waitFor(() => expect(screen.queryByText('private@example.test')).not.toBeInTheDocument());
});
it('ignores an older ticket read after the operator opens a newer ticket', async () => {
	const reads = []; mock.request.mockImplementation(async (...args) => args[1] === 'queue' ? { tickets: [ticket, { ...ticket, id: 'second', subject: 'Second ticket' }] } : args[1] === 'ticket' ? new Promise((resolve) => reads.push(resolve)) : handler(...args));
	mount(); await screen.findByText('Support question'); fireEvent.click(screen.getByRole('button', { name: /Support question/ })); fireEvent.click(screen.getByRole('button', { name: /Second ticket/ }));
	await act(async () => reads[1]({ ticket: { ...ticket, id: 'second', subject: 'Second ticket' }, messages: [{ id: 'b', body: 'New conversation' }] }));
	await act(async () => reads[0]({ ticket, messages: [{ id: 'a', body: 'Stale conversation' }] }));
	expect(screen.getByText('New conversation')).toBeInTheDocument(); expect(screen.queryByText('Stale conversation')).not.toBeInTheDocument(); expect(screen.getByRole('heading', { name: 'Second ticket' })).toBeInTheDocument();
});
it('ignores old admin customer records when a replacement session loads support access', async () => {
	let resolveOld; mock.request.mockImplementation(async (session, action) => {
		if (action === 'queue') return { tickets: [] }; if (action === 'status') return { role: session.access_token === 'old' ? 'admin' : 'support', mfa: 'aal2' };
		if (action === 'orders') return new Promise((resolve) => { resolveOld = resolve; }); if (action === 'customers') return { customers: [{ id: 'private' }] }; return {};
	});
	const tree = (token) => <MemoryRouter><AuthContext.Provider value={{ user: { id: token }, session: { access_token: token } }}><Admin /></AuthContext.Provider></MemoryRouter>;
	const view = render(tree('old')); await waitFor(() => expect(resolveOld).toBeTypeOf('function')); view.rerender(tree('new')); await screen.findByText(/Role: support/);
	await act(async () => resolveOld({ orders: [{ id: 'private', customer_email: 'old-private@example.test', status: 'paid', amount_total: 100, currency: 'eur' }] }));
	expect(screen.queryByText('old-private@example.test')).not.toBeInTheDocument(); expect(screen.getByText(/Role: support/)).toBeInTheDocument();
});
