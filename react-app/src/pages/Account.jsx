import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import ActivityPanel from '../components/portal/ActivityPanel';
import OrdersPanel from '../components/portal/OrdersPanel';
import ProfileForm from '../components/portal/ProfileForm';
import SecurityPanel from '../components/portal/SecurityPanel';
import TicketsPanel from '../components/portal/TicketsPanel';
import { useAuth } from '../context/useAuth';
import { notifyTicketReply, writeTicket } from '../utils/portal';
import { passwordRequirements, validateStrongPassword } from '../utils/passwordPolicy';
import { runPortalQueriesWithSessionRecovery } from '../utils/portalSession';
import { SESSION_EXPIRED_MESSAGE, capServerMessage, getUserErrorMessage } from '../utils/userErrors';
import './Portal.css';

const tabs = ['overview', 'orders', 'tickets', 'history', 'security'];
const emptyData = { profile: null, orders: [], tickets: [], activity: [] };
const emptyTicket = { subject: '', category: 'general', message: '' };
const idlePasswordFlow = { step: 'idle', sending: false, saving: false };
const VERIFICATION_CODE = /^[0-9]{6,10}$/;

const revokeOtherSessions = async (session) => {
	try {
		const response = await fetch('/api/session-revoke-others', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
			body: '{}',
		});
		return response.ok;
	} catch {
		return false;
	}
};

export default function Account() {
	const { user, session, staff, supabase } = useAuth();
	const navigate = useNavigate();
	const [tab, setTab] = useState('overview');
	const [data, setData] = useState(emptyData);
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [showTicketComposer, setShowTicketComposer] = useState(false);
	const [messages, setMessages] = useState([]);
	const [status, setStatus] = useState({ loading: true, error: '', message: '' });
	const [newTicket, setNewTicket] = useState(emptyTicket);
	const [reply, setReply] = useState('');
	const [replySending, setReplySending] = useState(false);
	const replyInFlight = useRef(false);
	const [mfa, setMfa] = useState({ factorId: '', qr: '', code: '', message: '', error: '' });
	const [passwordFlow, setPasswordFlow] = useState(idlePasswordFlow);

	const showError = (error, fallback) => setStatus((s) => ({ ...s, error: getUserErrorMessage(error, fallback), message: '' }));

	const load = useCallback(async () => {
		setStatus((s) => ({ ...s, loading: true, error: '' }));
		const runQueries = () => Promise.all([
			supabase.from('profiles').select('*').eq('id', user.id).single(),
			supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
			supabase.from('tickets').select('*').order('updated_at', { ascending: false }),
			supabase.from('activity_events').select('*').order('created_at', { ascending: false }).limit(100),
		]);
		const recovered = await runPortalQueriesWithSessionRecovery(supabase, runQueries);
		const [profile, orders, tickets, activity] = recovered.results;
		const error = recovered.error;
		if (recovered.sessionInvalid) {
			setData(emptyData);
			setMessages([]);
			setSelectedTicket(null);
			await supabase.auth.signOut({ scope: 'local' });
			// The session-recovery helper builds this message locally; cap it anyway.
			navigate('/login', { replace: true, state: { authError: capServerMessage(error?.message, SESSION_EXPIRED_MESSAGE) } });
			return;
		}
		setData({ profile: profile.data, orders: orders.data || [], tickets: tickets.data || [], activity: activity.data || [] });
		setStatus({
			loading: false,
			error: error ? getUserErrorMessage(error, 'Some account details could not be loaded. Please try again.') : '',
			message: '',
		});
	}, [navigate, supabase, user.id]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void load();
		}, 0);
		return () => window.clearTimeout(timer);
	}, [load]);

	const openTicket = async (ticket) => {
		setSelectedTicket(ticket);
		const result = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticket.id).order('created_at');
		setMessages(result.data || []);
	};

	const saveProfile = async (event) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const billing_address = {
			line1: form.get('line1'),
			line2: form.get('line2'),
			city: form.get('city'),
			postal_code: form.get('postal_code'),
			country: form.get('country'),
		};
		const { error } = await supabase
			.from('profiles')
			.update({ full_name: form.get('full_name'), phone: form.get('phone'), locale: form.get('locale'), billing_address })
			.eq('id', user.id);
		setStatus((s) => ({
			...s,
			error: error ? getUserErrorMessage(error, 'Your profile could not be saved. Please try again.') : '',
			message: error ? '' : 'Profile saved.',
		}));
		if (!error) load();
	};

	const createTicket = async (event) => {
		event.preventDefault();
		let id;
		try {
			({ id } = await writeTicket(session, {
				action: 'create',
				subject: newTicket.subject,
				category: newTicket.category,
				message: newTicket.message,
			}));
		} catch (error) {
			return setStatus((s) => ({ ...s, error: getUserErrorMessage(error) }));
		}
		setNewTicket(emptyTicket);
		setShowTicketComposer(false);
		const notified = await notifyTicketReply(session, { ticketId: id });
		await load();
		setTab('tickets');
		setStatus((s) => ({
			...s,
			error: notified ? '' : 'Ticket saved, but the email notification could not be sent.',
			message: `Ticket ${String(id).slice(0, 8)} created.`,
		}));
	};

	const sendReply = async (event) => {
		event.preventDefault();
		if (!selectedTicket || !reply.trim() || replyInFlight.current) return;
		replyInFlight.current = true;
		setReplySending(true);
		try {
			const message = await writeTicket(session, { action: 'message', ticketId: selectedTicket.id, message: reply.trim() });
			setReply('');
			const notified = await notifyTicketReply(session, { messageId: message.id });
			await openTicket(selectedTicket);
			await load();
			setStatus((s) => ({ ...s, error: notified ? '' : 'Reply saved, but the email notification could not be sent.' }));
		} catch (error) {
			setStatus((s) => ({ ...s, error: getUserErrorMessage(error) }));
		} finally {
			replyInFlight.current = false;
			setReplySending(false);
		}
	};

	const signOut = async () => {
		setData(emptyData);
		setMessages([]);
		setSelectedTicket(null);
		await supabase.auth.signOut();
		navigate('/login', { replace: true });
	};

	// Secure password change, step 1: Supabase emails a one-time code (nonce).
	const requestPasswordCode = async () => {
		setPasswordFlow((flow) => ({ ...flow, sending: true }));
		const { error } = await supabase.auth.reauthenticate();
		if (error) {
			setPasswordFlow((flow) => ({ ...flow, sending: false }));
			return showError(error, 'The verification code could not be sent. Please try again.');
		}
		setPasswordFlow({ step: 'code-sent', sending: false, saving: false });
		setStatus((s) => ({ ...s, error: '', message: 'We emailed you a verification code. Enter it below with your new password.' }));
	};

	// Step 2: the Supabase Auth server verifies the nonce before accepting the new password.
	const updatePassword = async (event) => {
		event.preventDefault();
		const formElement = event.currentTarget;
		const form = new FormData(formElement);
		const code = String(form.get('code') || '').trim();
		const password = form.get('password');
		if (!VERIFICATION_CODE.test(code)) {
			return setStatus((s) => ({ ...s, error: 'Enter the verification code from your email.', message: '' }));
		}
		if (!validateStrongPassword(password)) return setStatus((s) => ({ ...s, error: passwordRequirements, message: '' }));
		setPasswordFlow((flow) => ({ ...flow, saving: true }));
		const { error } = await supabase.auth.updateUser({ password, nonce: code });
		if (error) {
			setPasswordFlow((flow) => ({ ...flow, saving: false }));
			return showError(error, 'Password could not be updated. Request a new code and try again.');
		}
		formElement.reset();
		setPasswordFlow(idlePasswordFlow);
		const revoked = await revokeOtherSessions(session);
		if (!revoked) {
			return setStatus((s) => ({ ...s, error: 'Password changed, but other sessions could not be revoked. Please sign out of all devices.', message: '' }));
		}
		setStatus((s) => ({ ...s, error: '', message: 'Password updated and other sessions revoked.' }));
	};

	const beginMfa = async () => {
		const factors = await supabase.auth.mfa.listFactors();
		const verified = factors.data?.totp?.find((factor) => factor.status === 'verified');
		if (verified) {
			return setMfa((value) => ({ ...value, factorId: verified.id, qr: '', message: 'Enter a current authenticator code to elevate this session.', error: '' }));
		}
		const { data: enrollment, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Softhe.io staff access' });
		setMfa((value) => (error
			? { ...value, error: 'MFA enrollment could not be started.' }
			: { ...value, factorId: enrollment.id, qr: enrollment.totp.qr_code, message: 'Scan this QR code, then enter the six-digit code.', error: '' }));
	};

	const verifyMfa = async (event) => {
		event.preventDefault();
		const challenge = await supabase.auth.mfa.challenge({ factorId: mfa.factorId });
		if (challenge.error) return setMfa((value) => ({ ...value, error: 'MFA challenge could not be created.' }));
		const verified = await supabase.auth.mfa.verify({ factorId: mfa.factorId, challengeId: challenge.data.id, code: mfa.code });
		if (verified.error) return setMfa((value) => ({ ...value, error: 'That authenticator code was not accepted.' }));
		await supabase.auth.refreshSession();
		setMfa((value) => ({ ...value, code: '', qr: '', message: 'MFA verified. This session now has AAL2 assurance.', error: '' }));
	};

	const profile = data.profile || {};

	return (
		<div className="portal-page">
			<SEO title="Customer account | Softhe.io" description="Manage your Softhe.io profile, orders, support tickets, and account history." />
			<header className="portal-heading">
				<div>
					<span className="eyebrow">Customer portal</span>
					<h1>Hello, {profile.full_name || user.email}</h1>
					<p>{user.email}</p>
				</div>
				<div className="portal-actions">
					{staff && <Link className="btn btn-secondary" to="/admin">Staff portal</Link>}
					<button className="btn btn-secondary" onClick={signOut}>Sign out</button>
				</div>
			</header>
			<nav className="portal-tabs" aria-label="Account sections">
				{tabs.map((name) => (
					<button key={name} className={tab === name ? 'active' : ''} onClick={() => setTab(name)}>{name}</button>
				))}
			</nav>
			{status.loading && <div className="portal-state" role="status">Loading account…</div>}
			{status.error && <div className="portal-error" role="alert">{status.error}</div>}
			{status.message && <div className="portal-success" role="status">{status.message}</div>}

			{!status.loading && tab === 'overview' && (
				<div className="portal-grid">
					<ProfileForm profile={profile} onSubmit={saveProfile} />
					<section className="portal-card metric-card">
						<h2>At a glance</h2>
						<strong>{data.orders.length}</strong>
						<span>orders</span>
						<strong>{data.tickets.filter((t) => t.status !== 'closed').length}</strong>
						<span>open tickets</span>
						<button className="btn btn-secondary" onClick={() => setTab('tickets')}>Get support</button>
					</section>
				</div>
			)}
			{tab === 'orders' && <OrdersPanel orders={data.orders} />}
			{tab === 'tickets' && (
				<TicketsPanel
					tickets={data.tickets}
					selectedTicket={selectedTicket}
					messages={messages}
					userId={user.id}
					showComposer={showTicketComposer}
					onToggleComposer={() => setShowTicketComposer((visible) => !visible)}
					newTicket={newTicket}
					onNewTicketChange={setNewTicket}
					onCreateTicket={createTicket}
					onOpenTicket={openTicket}
					reply={reply}
					onReplyChange={setReply}
					replySending={replySending}
					onSendReply={sendReply}
				/>
			)}
			{tab === 'history' && <ActivityPanel activity={data.activity} />}
			{tab === 'security' && (
				<SecurityPanel
					passwordFlow={passwordFlow}
					onRequestPasswordCode={requestPasswordCode}
					onUpdatePassword={updatePassword}
					mfa={mfa}
					onBeginMfa={beginMfa}
					onVerifyMfa={verifyMfa}
					onMfaCodeChange={(code) => setMfa((value) => ({ ...value, code }))}
				/>
			)}
		</div>
	);
}
