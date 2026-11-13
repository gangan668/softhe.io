import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Captcha from '../components/Captcha';
import useCaptcha from '../components/useCaptcha';
import { absoluteUrl } from '../config/site';
import { useAuth } from '../context/useAuth';
import { getAuthDeliveryErrorMessage, getAuthErrorMessage } from '../utils/authErrors';
import { CAPTCHA_REQUIRED_MESSAGE } from '../utils/captcha';
import { passwordRequirements, validateStrongPassword } from '../utils/passwordPolicy';
import { peekPostAuthDestination, rememberPostAuthDestination } from '../utils/postAuthRedirect';
import './Portal.css';

const copy = {
	login: ['Welcome back', 'Sign in to view orders, tickets, and account history.'],
	register: ['Create your account', 'Keep purchases and support conversations in one secure place.'],
	forgot: ['Reset your password', 'We will email you a secure password-reset link.'],
	resend: ['Resend confirmation', 'Request a new confirmation link for an account that has not been verified.'],
};

export default function AuthPage({ mode }) {
	const { configured, loading, user, supabase, error: authError, retry } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const captcha = useCaptcha();
	const [form, setForm] = useState({ email: '', password: '', fullName: '' });
	const [status, setStatus] = useState({ loading: false, error: location.state?.authError || '', message: '' });
	const from = location.state?.from;
	const destination = from || peekPostAuthDestination() || '/account';
	if (user && mode !== 'forgot') return <Navigate to={destination} replace />;
	const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

	const submit = async (event) => {
		event.preventDefault();
		if (!configured || !supabase) return setStatus({ loading: false, error: configured ? 'Authentication is still loading. Please try again.' : 'Customer portal is not configured.', message: '' });
		if (captcha.blocking) return setStatus({ loading: false, error: CAPTCHA_REQUIRED_MESSAGE, message: '' });
		if (mode === 'register' && !validateStrongPassword(form.password)) return setStatus({ loading: false, error: passwordRequirements, message: '' });
		setStatus({ loading: true, error: '', message: '' });
		let result;
		try {
		const captchaOptions = captcha.enabled ? { captchaToken: captcha.token } : {};
		if (mode === 'register') rememberPostAuthDestination(from);
		if (mode === 'register') result = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.fullName }, emailRedirectTo: absoluteUrl('/login'), ...captchaOptions } });
		else if (mode === 'forgot') result = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: absoluteUrl('/reset-password'), ...captchaOptions });
		else if (mode === 'resend') result = await supabase.auth.resend({ type: 'signup', email: form.email, options: { emailRedirectTo: absoluteUrl('/login'), ...captchaOptions } });
		else result = await supabase.auth.signInWithPassword({ email: form.email, password: form.password, options: captchaOptions });
		} catch { result = { error: { message: 'Authentication request failed. Please try again.' } }; }
		if (captcha.enabled) captcha.reset();
		if (result.error && mode === 'login') return setStatus({ loading: false, error: getAuthErrorMessage(result.error), message: '' });
		if (result.error) {
			const deliveryError = getAuthDeliveryErrorMessage(result.error);
			return setStatus({ loading: false, error: deliveryError, message: deliveryError ? '' : mode === 'forgot' ? 'If an account exists for this address, a reset email will arrive shortly.' : 'If this address is awaiting verification, a confirmation email will arrive shortly.' });
		}
		if (mode === 'login') navigate(destination, { replace: true });
		else setStatus({ loading: false, error: '', message: mode === 'forgot' ? 'If an account exists for this address, a reset email will arrive shortly.' : 'If this address is awaiting verification, a confirmation email will arrive shortly.' });
	};

	return <div className="portal-page auth-page">
		<section className="portal-card auth-card"><h1>{copy[mode][0]}</h1><p>{copy[mode][1]}</p>{from === '/checkout' && <div className="portal-state" role="status">Sign in or create an account to complete your purchase. Your cart is saved.</div>}
			<>{authError && <div className="portal-error" role="alert">{authError}<button className="btn btn-secondary" onClick={retry}>Try again</button></div>}</><form onSubmit={submit} className="portal-form">
				{mode === 'register' && <label>Full name<input name="fullName" value={form.fullName} onChange={update} autoComplete="name" required maxLength="100" /></label>}
				<label>Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label>
				{!['forgot', 'resend'].includes(mode) && <label>Password<input name="password" type="password" value={form.password} onChange={update} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : 8} required />{mode === 'register' && <small>{passwordRequirements}</small>}</label>}
				<Captcha captcha={captcha} className="captcha-box" errorClassName="portal-error" />
				{status.error && <div className="portal-error" role="alert">{status.error}</div>}{status.message && <div className="portal-success" role="status">{status.message}</div>}
				<button className="btn btn-primary" disabled={status.loading || loading || captcha.blocking}>{status.loading || loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'resend' ? 'Resend confirmation' : 'Send reset link'}</button>
			</form>
			<div className="auth-links">{mode !== 'login' && <Link to="/login" state={from ? { from } : undefined}>Back to login</Link>}{mode === 'login' && <><Link to="/forgot-password">Forgot password?</Link><Link to="/register" state={from ? { from } : undefined}>Create account</Link><Link to="/resend-confirmation">Resend confirmation</Link></>}</div>
		</section></div>;
}
