import { useCallback, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { staffRequest } from '../utils/staff';
import './Portal.css';

export default function Admin() {
	const { user, session } = useAuth();
	const replyInFlight = useRef(false);
	const [cachedTickets, setTickets] = useState([]); const [cachedOrders, setOrders] = useState([]); const [cachedCustomers, setCustomers] = useState([]); const [cachedAccess, setAccess] = useState(null); const [cachedSelected, setSelected] = useState(null); const [cachedMessages, setMessages] = useState([]); const [reply, setReply] = useState(''); const [error, setError] = useState(''); const [replySending, setReplySending] = useState(false);
	const [dataOwner, setDataOwner] = useState('');
	const currentOwner = user.id + ':' + session?.access_token;
	const tickets = dataOwner === currentOwner ? cachedTickets : [];
	const orders = dataOwner === currentOwner ? cachedOrders : [];
	const customers = dataOwner === currentOwner ? cachedCustomers : [];
	const access = dataOwner === currentOwner ? cachedAccess : null;
	const selected = dataOwner === currentOwner ? cachedSelected : null;
	const messages = dataOwner === currentOwner ? cachedMessages : [];
	const scope = useRef(0);
	const queueRead = useRef(0);
	const ticketRead = useRef(0);
	useEffect(() => { scope.current += 1; return () => { scope.current += 1; queueRead.current += 1; ticketRead.current += 1; }; }, [session?.access_token, user.id]);
	const load = useCallback(async () => {
		const generation = scope.current; const request = ++queueRead.current;
		const current = () => generation === scope.current && request === queueRead.current;
		try {
			const queue = await staffRequest(session, 'queue'); if (!current()) return;
			const status = await staffRequest(session, 'status'); if (!current()) return;
			const nextOrders = status.role === 'admin' ? (await staffRequest(session, 'orders')).orders || [] : []; if (!current()) return;
			const nextCustomers = status.role === 'admin' ? (await staffRequest(session, 'customers')).customers || [] : [];
			if (!current()) return;
			setDataOwner(user.id + ':' + session?.access_token); setTickets(queue.tickets || []); setAccess(status); setOrders(nextOrders); setCustomers(nextCustomers); setError('');
		} catch (loadError) { if (current()) { setTickets([]); setOrders([]); setCustomers([]); setAccess(null); setSelected(null); setMessages([]); setError(loadError.message); } }
	}, [session, user.id]);
	useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
	const open = async (ticket) => {
		const generation = scope.current; const request = ++ticketRead.current;
		setSelected(null); setMessages([]);
		try { const data = await staffRequest(session, 'ticket', { query: { id: ticket.id } }); if (generation !== scope.current || request !== ticketRead.current) return; setSelected(data.ticket); setMessages(data.messages || []); setError(''); }
		catch (openError) { if (generation === scope.current && request === ticketRead.current) setError(openError.message); }
	};
	const updateStatus = async (status) => {
		const generation = scope.current; const ticket = selected; const read = ticketRead.current;
		try { await staffRequest(session, 'status', { method: 'POST', body: { ticketId: ticket.id, status } }); if (generation !== scope.current) return; if (read === ticketRead.current) setSelected({ ...ticket, status }); await load(); }
		catch (statusError) { if (generation === scope.current) setError(statusError.message); }
	};
	const send = async (event) => {
		event.preventDefault(); if (replyInFlight.current || !reply.trim() || !selected) return;
		const generation = scope.current; const ticket = selected; const read = ticketRead.current;
		replyInFlight.current = true; setReplySending(true);
		try { await staffRequest(session, 'reply', { method: 'POST', body: { ticketId: ticket.id, message: reply.trim() } }); if (generation !== scope.current) return; setReply(''); if (read === ticketRead.current) await open(ticket); await load(); }
		catch (sendError) { if (generation === scope.current) setError(sendError.message); }
		finally { replyInFlight.current = false; if (generation === scope.current) setReplySending(false); }
	};
	return <div className="portal-page"><header className="portal-heading"><div><span className="eyebrow">Staff only · MFA protected</span><h1>Customer operations</h1><p>Server-mediated support access. Every privileged view and action is audited.</p></div><Link className="btn btn-secondary" to="/account">Customer account</Link></header>{error && <div className="portal-error" role="alert">{error}</div>}
		<div className="admin-metrics"><div><strong>{tickets.filter((t) => t.status !== 'closed').length}</strong><span>active tickets</span></div><div><strong>{customers.length}</strong><span>customers</span></div><div><strong>AAL2</strong><span>{access?.role || 'staff'} · expires {access?.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'soon'}</span></div></div>
		<div className="portal-grid"><section className="portal-card"><h2>Ticket queue</h2><div className="ticket-list">{tickets.map((ticket) => <button key={ticket.id} onClick={() => open(ticket)} className={selected?.id === ticket.id ? 'active' : ''}><strong>{ticket.subject}</strong><span>{ticket.owner?.email || 'Customer'} · {ticket.status.replaceAll('_', ' ')}</span></button>)}</div></section><section className="portal-card">{selected ? <><div className="ticket-toolbar"><h2>{selected.subject}</h2><select aria-label="Ticket status" value={selected.status} onChange={(e) => updateStatus(e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting_for_customer">Waiting for customer</option><option value="closed">Closed</option></select></div><div className="conversation">{messages.map((message) => <div className={message.author_id === user.id ? 'message own' : 'message'} key={message.id}><p>{message.body}</p></div>)}<form onSubmit={send}><textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength="4000" disabled={replySending} required /><button className="btn btn-primary" disabled={replySending}>{replySending ? 'Sending…' : 'Reply as staff'}</button></form></div></> : <p>Select a ticket to review its conversation.</p>}</section></div>
		{orders.length > 0 && <section className="portal-card"><h2>Recent orders</h2><div className="portal-list">{orders.map((order) => <article key={order.id}><div><strong>{order.customer_email}</strong><p>{order.status}</p></div><strong>{(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}</strong></article>)}</div></section>}
		{access && <section className="portal-card"><h2>Staff security</h2><p>Role: {access.role}. MFA assurance: {access.mfa}. Active sessions: {access.sessions?.length || 0}. Revoke other sessions from the customer account Security tab.</p></section>}
	</div>;
}
