import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../context/useAuth';
import { getAuthErrorMessage } from '../utils/authErrors';
import './Portal.css';

const copy = {
	login: ['Welcome back', 'Sign in to view orders, tickets, and account history.'],
	register: ['Create your account', 'Keep purchases and support conversations in one secure place.'],
	forgot: ['Reset your password', 'We will email you a secure password-reset link.'],
};

export default function AuthPage({ mode }) {
	const { configured, loading, user, supabase } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [form, setForm] = useState({ email: '', password: '', fullName: '' });
	const [status, setStatus] = useState({ loading: false, error: location.state?.authError || '', message: '' });
	if (user && mode !== 'forgot') return <Navigate to="/account" replace />;
	const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

	const submit = async (event) => {
		event.preventDefault();
		if (!configured || !supabase) return setStatus({ loading: false, error: configured ? 'Authentication is still loading. Please try again.' : 'Customer portal is not configured.', message: '' });
		setStatus({ loading: true, error: '', message: '' });
		let result;
		if (mode === 'register') result = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.fullName }, emailRedirectTo: `${window.location.origin}/login` } });
		else if (mode === 'forgot') result = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
		else result = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
		if (result.error && mode === 'login') return setStatus({ loading: false, error: getAuthErrorMessage(result.error), message: '' });
		if (result.error) return setStatus({ loading: false, error: '', message: mode === 'register' ? 'If this address can be registered, a verification email will arrive shortly.' : 'If an account exists for this address, a reset email will arrive shortly.' });
		if (mode === 'login') navigate(location.state?.from || '/account', { replace: true });
		else setStatus({ loading: false, error: '', message: mode === 'register' ? 'If this address can be registered, a verification email will arrive shortly.' : 'If an account exists for this address, a reset email will arrive shortly.' });
	};

	return <div className="portal-page auth-page"><SEO title={`${copy[mode][0]} | Softhe.io`} description={copy[mode][1]} />
		<section className="portal-card auth-card"><h1>{copy[mode][0]}</h1><p>{copy[mode][1]}</p>
			<form onSubmit={submit} className="portal-form">
				{mode === 'register' && <label>Full name<input name="fullName" value={form.fullName} onChange={update} autoComplete="name" required maxLength="100" /></label>}
				<label>Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label>
				{mode !== 'forgot' && <label>Password<input name="password" type="password" value={form.password} onChange={update} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength="8" required /></label>}
				{status.error && <div className="portal-error" role="alert">{status.error}</div>}{status.message && <div className="portal-success" role="status">{status.message}</div>}
				<button className="btn btn-primary" disabled={status.loading || loading}>{status.loading || loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}</button>
			</form>
			<div className="auth-links">{mode !== 'login' && <Link to="/login">Back to login</Link>}{mode === 'login' && <><Link to="/forgot-password">Forgot password?</Link><Link to="/register">Create account</Link></>}</div>
		</section></div>;
}
