import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../context/useAuth';
import { notifyTicketReply } from '../utils/portal';
import './Portal.css';

const tabs = ['overview', 'orders', 'tickets', 'history', 'security'];
const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function Account() {
	const { user, session, staff, supabase } = useAuth();
	const navigate = useNavigate();
	const [tab, setTab] = useState('overview');
	const [data, setData] = useState({ profile: null, orders: [], tickets: [], activity: [] });
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [messages, setMessages] = useState([]);
	const [status, setStatus] = useState({ loading: true, error: '', message: '' });
	const [newTicket, setNewTicket] = useState({ subject: '', category: 'general', message: '' });
	const [reply, setReply] = useState('');

	const load = useCallback(async () => {
		setStatus((s) => ({ ...s, loading: true, error: '' }));
		const [profile, orders, tickets, activity] = await Promise.all([
			supabase.from('profiles').select('*').eq('id', user.id).single(),
			supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
			supabase.from('tickets').select('*').order('updated_at', { ascending: false }),
			supabase.from('activity_events').select('*').order('created_at', { ascending: false }).limit(100),
		]);
		const error = [profile, orders, tickets, activity].find((result) => result.error)?.error;
		setData({ profile: profile.data, orders: orders.data || [], tickets: tickets.data || [], activity: activity.data || [] });
		setStatus({ loading: false, error: error?.message || '', message: '' });
	}, [supabase, user.id]);
	useEffect(() => { load(); }, [load]);

	const openTicket = async (ticket) => {
		setSelectedTicket(ticket);
		const result = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticket.id).order('created_at');
		setMessages(result.data || []);
	};
	const saveProfile = async (event) => {
		event.preventDefault(); const form = new FormData(event.currentTarget);
		const billing_address = { line1: form.get('line1'), line2: form.get('line2'), city: form.get('city'), postal_code: form.get('postal_code'), country: form.get('country') };
		const { error } = await supabase.from('profiles').update({ full_name: form.get('full_name'), phone: form.get('phone'), locale: form.get('locale'), billing_address }).eq('id', user.id);
		setStatus((s) => ({ ...s, error: error?.message || '', message: error ? '' : 'Profile saved.' })); if (!error) load();
	};
	const createTicket = async (event) => {
		event.preventDefault(); const { data: id, error } = await supabase.rpc('create_ticket', { ticket_subject: newTicket.subject, ticket_category: newTicket.category, first_message: newTicket.message });
		if (error) return setStatus((s) => ({ ...s, error: error.message }));
		setNewTicket({ subject: '', category: 'general', message: '' }); const notified = await notifyTicketReply(session, { ticketId: id }); await load(); setTab('tickets'); setStatus((s) => ({ ...s, error: notified ? '' : 'Ticket saved, but the email notification could not be sent.', message: `Ticket ${String(id).slice(0, 8)} created.` }));
	};
	const sendReply = async (event) => {
		event.preventDefault(); if (!selectedTicket || !reply.trim()) return;
		const { data: message, error } = await supabase.from('ticket_messages').insert({ ticket_id: selectedTicket.id, author_id: user.id, body: reply.trim() }).select('id').single();
		if (error) return setStatus((s) => ({ ...s, error: error.message })); setReply(''); const notified = await notifyTicketReply(session, { messageId: message.id }); await openTicket(selectedTicket); await load(); setStatus((s) => ({ ...s, error: notified ? '' : 'Reply saved, but the email notification could not be sent.' }));
	};
	const signOut = async () => { setData({ profile: null, orders: [], tickets: [], activity: [] }); setMessages([]); setSelectedTicket(null); await supabase.auth.signOut(); navigate('/login', { replace: true }); };
	const updatePassword = async (event) => {
		event.preventDefault();
		const lastSignIn = Date.parse(user.last_sign_in_at || '');
		if (!Number.isFinite(lastSignIn) || Date.now() - lastSignIn > 15 * 60 * 1000) return setStatus((s) => ({ ...s, error: 'Please sign out and sign in again before changing your password.', message: '' }));
		const password = new FormData(event.currentTarget).get('password');
		const { error } = await supabase.auth.updateUser({ password });
		if (!error) {
			const response = await fetch('/api/session-revoke-others', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: '{}' });
			if (!response.ok) return setStatus((s) => ({ ...s, error: 'Password changed, but other sessions could not be revoked. Please sign out of all devices.', message: '' }));
		}
		setStatus((s) => ({ ...s, error: error?.message || '', message: error ? '' : 'Password updated and other sessions revoked.' })); event.currentTarget.reset();
	};

	const profile = data.profile || {}; const address = profile.billing_address || {};
	return <div className="portal-page"><SEO title="Customer account | Softhe.io" description="Manage your Softhe.io profile, orders, support tickets, and account history." />
		<header className="portal-heading"><div><span className="eyebrow">Customer portal</span><h1>Hello, {profile.full_name || user.email}</h1><p>{user.email}</p></div><div className="portal-actions">{staff && <Link className="btn btn-secondary" to="/admin">Staff portal</Link>}<button className="btn btn-secondary" onClick={signOut}>Sign out</button></div></header>
		<nav className="portal-tabs" aria-label="Account sections">{tabs.map((name) => <button key={name} className={tab === name ? 'active' : ''} onClick={() => setTab(name)}>{name}</button>)}</nav>
		{status.loading && <div className="portal-state" role="status">Loading account…</div>}{status.error && <div className="portal-error" role="alert">{status.error}</div>}{status.message && <div className="portal-success" role="status">{status.message}</div>}
		{!status.loading && tab === 'overview' && <div className="portal-grid"><section className="portal-card"><h2>Profile</h2><form className="portal-form" onSubmit={saveProfile}><label>Full name<input name="full_name" defaultValue={profile.full_name} required /></label><label>Phone<input name="phone" defaultValue={profile.phone} autoComplete="tel" /></label><div className="form-row"><label>Address<input name="line1" defaultValue={address.line1} /></label><label>Address line 2<input name="line2" defaultValue={address.line2} /></label></div><div className="form-row"><label>City<input name="city" defaultValue={address.city} /></label><label>Postal code<input name="postal_code" defaultValue={address.postal_code} /></label></div><div className="form-row"><label>Country<input name="country" defaultValue={address.country} maxLength="2" placeholder="SE" /></label><label>Locale<select name="locale" defaultValue={profile.locale || 'en'}><option value="en">English</option><option value="sv">Svenska</option></select></label></div><button className="btn btn-primary">Save profile</button></form></section><section className="portal-card metric-card"><h2>At a glance</h2><strong>{data.orders.length}</strong><span>orders</span><strong>{data.tickets.filter((t) => t.status !== 'closed').length}</strong><span>open tickets</span><button className="btn btn-secondary" onClick={() => setTab('tickets')}>Get support</button></section></div>}
		{tab === 'orders' && <section className="portal-card"><h2>Orders</h2>{!data.orders.length ? <p>No linked orders yet. Guest purchases are claimed after your verified email matches the Stripe receipt.</p> : <div className="portal-list">{data.orders.map((order) => <article key={order.id}><div><strong>Order {order.stripe_session_id.slice(-10)}</strong><p>{formatDate(order.created_at)} · {order.status}</p><small>{order.order_items?.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}</small></div><strong>{new Intl.NumberFormat(undefined, { style: 'currency', currency: order.currency.toUpperCase() }).format(order.amount_total / 100)}</strong></article>)}</div>}</section>}
		{tab === 'tickets' && <div className="portal-grid"><section className="portal-card"><h2>New ticket</h2><form className="portal-form" onSubmit={createTicket}><label>Subject<input value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} minLength="3" maxLength="120" required /></label><label>Category<select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}><option value="general">General</option><option value="technical">Technical</option><option value="sales">Sales</option><option value="billing">Billing</option></select></label><label>Message<textarea value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} maxLength="4000" required /></label><button className="btn btn-primary">Create ticket</button></form></section><section className="portal-card"><h2>Your tickets</h2><div className="ticket-layout"><div className="ticket-list">{data.tickets.map((ticket) => <button key={ticket.id} onClick={() => openTicket(ticket)} className={selectedTicket?.id === ticket.id ? 'active' : ''}><strong>{ticket.subject}</strong><span>{ticket.status.replaceAll('_', ' ')}</span></button>)}</div>{selectedTicket && <div className="conversation"><h3>{selectedTicket.subject}</h3>{messages.map((message) => <div className={message.author_id === user.id ? 'message own' : 'message'} key={message.id}><p>{message.body}</p><small>{formatDate(message.created_at)}</small></div>)}{selectedTicket.status !== 'closed' && <form onSubmit={sendReply}><textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength="4000" aria-label="Reply" required /><button className="btn btn-primary">Send reply</button></form>}</div>}</div></section></div>}
		{tab === 'history' && <section className="portal-card"><h2>Activity history</h2><div className="timeline">{data.activity.map((event) => <article key={event.id}><span></span><div><strong>{event.event_type.replaceAll('.', ' ')}</strong><p>{formatDate(event.created_at)}</p></div></article>)}</div></section>}
		{tab === 'security' && <section className="portal-card narrow-card"><h2>Security</h2><p>Your password is managed securely by Supabase and is never stored by Softhe.io.</p><form className="portal-form" onSubmit={updatePassword}><label>New password<input name="password" type="password" minLength="8" autoComplete="new-password" required /></label><button className="btn btn-primary">Change password</button></form></section>}
	</div>;
}
