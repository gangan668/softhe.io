import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StaffTicketDetail from '../components/portal/StaffTicketDetail';
import TicketQueue from '../components/portal/TicketQueue';
import { useAuth } from '../context/useAuth';
import { staffRequest } from '../utils/staff';
import { getUserErrorMessage } from '../utils/userErrors';
import './Portal.css';

export default function Admin() {
	const { user, session } = useAuth();
	const [tickets, setTickets] = useState([]);
	const [orders, setOrders] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [access, setAccess] = useState(null);
	const [selected, setSelected] = useState(null);
	const [messages, setMessages] = useState([]);
	const [reply, setReply] = useState('');
	const [error, setError] = useState('');
	const [replySending, setReplySending] = useState(false);

	const load = useCallback(async () => {
		try {
			const queue = await staffRequest(session, 'queue');
			setTickets(queue.tickets || []);
			const status = await staffRequest(session, 'status');
			setAccess(status);
			if (status.role === 'admin') {
				setOrders((await staffRequest(session, 'orders')).orders || []);
				setCustomers((await staffRequest(session, 'customers')).customers || []);
			}
			setError('');
		} catch (loadError) {
			setError(getUserErrorMessage(loadError));
		}
	}, [session]);

	useEffect(() => {
		const timer = window.setTimeout(() => void load(), 0);
		return () => window.clearTimeout(timer);
	}, [load]);

	const open = async (ticket) => {
		try {
			const data = await staffRequest(session, 'ticket', { query: { id: ticket.id } });
			setSelected(data.ticket);
			setMessages(data.messages || []);
			setError('');
		} catch (openError) {
			setError(getUserErrorMessage(openError));
		}
	};

	const updateStatus = async (status) => {
		try {
			await staffRequest(session, 'status', { method: 'POST', body: { ticketId: selected.id, status } });
			setSelected({ ...selected, status });
			await load();
		} catch (statusError) {
			setError(getUserErrorMessage(statusError));
		}
	};

	const send = async (event) => {
		event.preventDefault();
		if (replySending) return;
		setReplySending(true);
		try {
			await staffRequest(session, 'reply', { method: 'POST', body: { ticketId: selected.id, message: reply.trim() } });
			setReply('');
			await open(selected);
			await load();
		} catch (sendError) {
			setError(getUserErrorMessage(sendError));
		} finally {
			setReplySending(false);
		}
	};

	return (
		<div className="portal-page">
			<header className="portal-heading">
				<div>
					<span className="eyebrow">Staff only · MFA protected</span>
					<h1>Customer operations</h1>
					<p>Server-mediated support access. Every privileged view and action is audited.</p>
				</div>
				<Link className="btn btn-secondary" to="/account">Customer account</Link>
			</header>
			{error && <div className="portal-error" role="alert">{error}</div>}

			<div className="admin-metrics">
				<div>
					<strong>{tickets.filter((t) => t.status !== 'closed').length}</strong>
					<span>active tickets</span>
				</div>
				<div>
					<strong>{customers.length}</strong>
					<span>customers</span>
				</div>
				<div>
					<strong>AAL2</strong>
					<span>{access?.role || 'staff'} · expires {access?.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'soon'}</span>
				</div>
			</div>

			<div className="portal-grid">
				<TicketQueue tickets={tickets} selectedId={selected?.id} onOpen={open} />
				<StaffTicketDetail
					ticket={selected}
					messages={messages}
					userId={user.id}
					reply={reply}
					onReplyChange={setReply}
					replySending={replySending}
					onSend={send}
					onStatusChange={updateStatus}
				/>
			</div>

			{orders.length > 0 && (
				<section className="portal-card">
					<h2>Recent orders</h2>
					<div className="portal-list">
						{orders.map((order) => (
							<article key={order.id}>
								<div>
									<strong>{order.customer_email}</strong>
									<p>{order.status}</p>
								</div>
								<strong>{(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}</strong>
							</article>
						))}
					</div>
				</section>
			)}

			{access && (
				<section className="portal-card">
					<h2>Staff security</h2>
					<p>
						Role: {access.role}. MFA assurance: {access.mfa}. Active sessions: {access.sessions?.length || 0}. Revoke other sessions from the customer account Security tab.
					</p>
				</section>
			)}
		</div>
	);
}
