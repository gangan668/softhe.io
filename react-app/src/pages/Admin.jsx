import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { staffRequest } from '../utils/staff';
import './Portal.css';

export default function Admin() {
	const { user, session } = useAuth();
	const [tickets, setTickets] = useState([]); const [orders, setOrders] = useState([]); const [customers, setCustomers] = useState([]); const [access, setAccess] = useState(null); const [selected, setSelected] = useState(null); const [messages, setMessages] = useState([]); const [reply, setReply] = useState(''); const [error, setError] = useState('');
	const load = useCallback(async () => {
		try {
			const queue = await staffRequest(session, 'queue');
			setTickets(queue.tickets || []);
			const status = await staffRequest(session, 'status'); setAccess(status);
			if (status.role === 'admin') { setOrders((await staffRequest(session, 'orders')).orders || []); setCustomers((await staffRequest(session, 'customers')).customers || []); }
			setError('');
		} catch (loadError) { setError(loadError.message); }
	}, [session]);
	useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
	const open = async (ticket) => { try { const data = await staffRequest(session, 'ticket', { query: { id: ticket.id } }); setSelected(data.ticket); setMessages(data.messages || []); setError(''); } catch (openError) { setError(openError.message); } };
	const updateStatus = async (status) => { try { await staffRequest(session, 'status', { method: 'POST', body: { ticketId: selected.id, status } }); setSelected({ ...selected, status }); await load(); } catch (statusError) { setError(statusError.message); } };
	const send = async (event) => { event.preventDefault(); try { await staffRequest(session, 'reply', { method: 'POST', body: { ticketId: selected.id, message: reply.trim() } }); setReply(''); await open(selected); await load(); } catch (sendError) { setError(sendError.message); } };
	return <div className="portal-page"><header className="portal-heading"><div><span className="eyebrow">Staff only · MFA protected</span><h1>Customer operations</h1><p>Server-mediated support access. Every privileged view and action is audited.</p></div><Link className="btn btn-secondary" to="/account">Customer account</Link></header>{error && <div className="portal-error" role="alert">{error}</div>}
		<div className="admin-metrics"><div><strong>{tickets.filter((t) => t.status !== 'closed').length}</strong><span>active tickets</span></div><div><strong>{customers.length}</strong><span>customers</span></div><div><strong>AAL2</strong><span>{access?.role || 'staff'} · expires {access?.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'soon'}</span></div></div>
		<div className="portal-grid"><section className="portal-card"><h2>Ticket queue</h2><div className="ticket-list">{tickets.map((ticket) => <button key={ticket.id} onClick={() => open(ticket)} className={selected?.id === ticket.id ? 'active' : ''}><strong>{ticket.subject}</strong><span>{ticket.owner?.email || 'Customer'} · {ticket.status.replaceAll('_', ' ')}</span></button>)}</div></section><section className="portal-card">{selected ? <><div className="ticket-toolbar"><h2>{selected.subject}</h2><select aria-label="Ticket status" value={selected.status} onChange={(e) => updateStatus(e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting_for_customer">Waiting for customer</option><option value="closed">Closed</option></select></div><div className="conversation">{messages.map((message) => <div className={message.author_id === user.id ? 'message own' : 'message'} key={message.id}><p>{message.body}</p></div>)}<form onSubmit={send}><textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength="4000" required /><button className="btn btn-primary">Reply as staff</button></form></div></> : <p>Select a ticket to review its conversation.</p>}</section></div>
		{orders.length > 0 && <section className="portal-card"><h2>Recent orders</h2><div className="portal-list">{orders.map((order) => <article key={order.id}><div><strong>{order.customer_email}</strong><p>{order.status}</p></div><strong>{(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}</strong></article>)}</div></section>}
		{access && <section className="portal-card"><h2>Staff security</h2><p>Role: {access.role}. MFA assurance: {access.mfa}. Active sessions: {access.sessions?.length || 0}. Revoke other sessions from the customer account Security tab.</p></section>}
	</div>;
}
