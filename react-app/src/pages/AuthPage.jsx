import { useRef, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import { useAuth } from '../context/useAuth';
import { getAuthDeliveryErrorMessage, getAuthErrorMessage } from '../utils/authErrors';
import { passwordRequirements, validateStrongPassword } from '../utils/passwordPolicy';
import './Portal.css';

const copy = {
	login: ['Welcome back', 'Sign in to view orders, tickets, and account history.'],
	register: ['Create your account', 'Keep purchases and support conversations in one secure place.'],
	forgot: ['Reset your password', 'We will email you a secure password-reset link.'],
};

const captchaEnabled = import.meta.env.VITE_CAPTCHA_ENABLED === 'true';
const captchaSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function AuthPage({ mode }) {
	const { configured, loading, user, supabase } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const captchaRef = useRef(null);
	const [form, setForm] = useState({ email: '', password: '', fullName: '' });
	const [captchaToken, setCaptchaToken] = useState('');
	const [status, setStatus] = useState({ loading: false, error: location.state?.authError || '', message: '' });
	if (user && mode !== 'forgot') return <Navigate to="/account" replace />;
	const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

	const submit = async (event) => {
		event.preventDefault();
		if (!configured || !supabase) return setStatus({ loading: false, error: configured ? 'Authentication is still loading. Please try again.' : 'Customer portal is not configured.', message: '' });
		if (captchaEnabled && (!captchaSiteKey || !captchaToken)) return setStatus({ loading: false, error: 'Complete the security check and try again.', message: '' });
		if (mode === 'register' && !validateStrongPassword(form.password)) return setStatus({ loading: false, error: passwordRequirements, message: '' });
		setStatus({ loading: true, error: '', message: '' });
		let result;
		const captchaOptions = captchaEnabled ? { captchaToken } : {};
		if (mode === 'register') result = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.fullName }, emailRedirectTo: absoluteUrl('/login'), ...captchaOptions } });
		else if (mode === 'forgot') result = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: absoluteUrl('/reset-password'), ...captchaOptions });
		else result = await supabase.auth.signInWithPassword({ email: form.email, password: form.password, options: captchaOptions });
		if (captchaEnabled) { captchaRef.current?.reset(); setCaptchaToken(''); }
		if (result.error && mode === 'login') return setStatus({ loading: false, error: getAuthErrorMessage(result.error), message: '' });
		if (result.error) {
			const deliveryError = getAuthDeliveryErrorMessage(result.error);
			return setStatus({ loading: false, error: deliveryError, message: deliveryError ? '' : mode === 'register' ? 'If this address can be registered, a verification email will arrive shortly.' : 'If an account exists for this address, a reset email will arrive shortly.' });
		}
		if (mode === 'login') navigate(location.state?.from || '/account', { replace: true });
		else setStatus({ loading: false, error: '', message: mode === 'register' ? 'If this address can be registered, a verification email will arrive shortly.' : 'If an account exists for this address, a reset email will arrive shortly.' });
	};

	return <div className="portal-page auth-page"><SEO title={`${copy[mode][0]} | Softhe.io`} description={copy[mode][1]} />
		<section className="portal-card auth-card"><h1>{copy[mode][0]}</h1><p>{copy[mode][1]}</p>
			<form onSubmit={submit} className="portal-form">
				{mode === 'register' && <label>Full name<input name="fullName" value={form.fullName} onChange={update} autoComplete="name" required maxLength="100" /></label>}
				<label>Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label>
				{mode !== 'forgot' && <label>Password<input name="password" type="password" value={form.password} onChange={update} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : 8} required />{mode === 'register' && <small>{passwordRequirements}</small>}</label>}
				{captchaEnabled && captchaSiteKey && <div className="captcha-box"><Turnstile ref={captchaRef} siteKey={captchaSiteKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken('')} onError={() => setCaptchaToken('')} options={{ theme: 'dark' }} /></div>}
				{captchaEnabled && !captchaSiteKey && <div className="portal-error" role="alert">Security verification is not configured.</div>}
				{status.error && <div className="portal-error" role="alert">{status.error}</div>}{status.message && <div className="portal-success" role="status">{status.message}</div>}
				<button className="btn btn-primary" disabled={status.loading || loading || (captchaEnabled && (!captchaSiteKey || !captchaToken))}>{status.loading || loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}</button>
			</form>
			<div className="auth-links">{mode !== 'login' && <Link to="/login">Back to login</Link>}{mode === 'login' && <><Link to="/forgot-password">Forgot password?</Link><Link to="/register">Create account</Link></>}</div>
		</section></div>;
}
