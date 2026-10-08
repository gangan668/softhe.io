import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { passwordRequirements, validateStrongPassword } from '../utils/passwordPolicy';
import './Portal.css';

export default function ResetPassword() {
	const { supabase, configured, loading, user, error: authError, retry } = useAuth();
	const [password, setPassword] = useState('');
	const [status, setStatus] = useState('');
	const [statusError, setStatusError] = useState(false);
	const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
	const [verification, setVerification] = useState(tokenHash ? 'verifying' : 'idle');
	useEffect(() => {
		if (!configured || !supabase || !tokenHash) return;
		let active = true;
		supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
			if (!active) return;
			window.history.replaceState(null, '', '/reset-password');
			setVerification(error ? 'invalid' : 'verified');
		}).catch(() => { if (active) setVerification('invalid'); });
		return () => { active = false; };
	}, [configured, supabase, tokenHash]);
	const submit = async (event) => {
		event.preventDefault();
		if (!configured || !supabase) { setStatusError(true); return setStatus(configured ? 'Authentication is still loading. Please try again.' : 'Customer portal is not configured.'); }
		if (!validateStrongPassword(password)) { setStatusError(true); return setStatus(passwordRequirements); }
		let error;
		try { ({ error } = await supabase.auth.updateUser({ password })); } catch { error = new Error('Password update failed'); }
		setStatusError(Boolean(error));
		setStatus(error ? 'Password could not be updated. Request a new recovery link and try again.' : 'Password updated. You can now return to your account.');
	};
	const recoveryReady = Boolean(user) || verification === 'verified';
	const recoveryMessage = status || (verification === 'verified' ? 'Recovery link verified. Choose a new password.' : verification === 'verifying' || loading ? 'Verifying recovery link…' : 'This password reset link is invalid or has expired. Request a new link and use only the newest email.');
	return <div className="portal-page auth-page"><section className="portal-card auth-card"><h1>Choose a new password</h1>{authError && <div className="portal-error" role="alert">{authError}<button className="btn btn-secondary" onClick={retry}>Try again</button></div>}{recoveryReady && <form className="portal-form" onSubmit={submit}><label>New password<input type="password" minLength="12" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><small>{passwordRequirements}</small></label><button className="btn btn-primary" disabled={loading}>Update password</button></form>}<div className={statusError ? 'portal-error' : recoveryReady ? 'portal-success' : verification === 'verifying' || loading ? 'portal-state' : 'portal-error'} role={statusError ? 'alert' : recoveryReady || verification === 'verifying' || loading ? 'status' : 'alert'}>{recoveryMessage}</div>{recoveryReady ? <Link to="/account">Return to account</Link> : verification !== 'verifying' && !loading && <Link to="/forgot-password">Request a new reset link</Link>}</section></div>;
}
