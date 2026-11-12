import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MfaChallenge from '../components/MfaChallenge';
import { useAuth } from '../context/useAuth';
import { passwordRequirements, validateStrongPassword } from '../utils/passwordPolicy';
import { revokeOtherSessions } from '../utils/portal';
import './Portal.css';

export default function ResetPassword() {
	const { supabase, configured, loading, user, error: authError, retry, passwordRecovery, mfaRequired } = useAuth();
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
		if (error) { setStatusError(true); return setStatus('Password could not be updated. Request a new recovery link and try again.'); }
		setPassword('');
		// Whoever triggered the reset may not be the only holder of a session.
		let revoked;
		try { revoked = await revokeOtherSessions((await supabase.auth.getSession()).data?.session); } catch { revoked = false; }
		setStatusError(!revoked);
		setStatus(revoked ? 'Password updated and other sessions signed out. You can now return to your account.' : 'Password updated, but other sessions could not be signed out. Use "Sign out other devices" in your account Security tab.');
	};
	// A signed-in session alone is not proof of mailbox access; require the recovery link.
	const recoveryReady = verification === 'verified' || passwordRecovery;
	if (recoveryReady && mfaRequired) return <MfaChallenge />;
	const recoveryMessage = status || (recoveryReady ? 'Recovery link verified. Choose a new password.' : verification === 'verifying' || loading ? 'Verifying recovery link…' : user ? 'To change your password while signed in, use the Security tab in your account.' : 'This password reset link is invalid or has expired. Request a new link and use only the newest email.');
	return <div className="portal-page auth-page"><section className="portal-card auth-card"><h1>Choose a new password</h1>{authError && <div className="portal-error" role="alert">{authError}<button className="btn btn-secondary" onClick={retry}>Try again</button></div>}{recoveryReady && <form className="portal-form" onSubmit={submit}><label>New password<input type="password" minLength="12" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><small>{passwordRequirements}</small></label><button className="btn btn-primary" disabled={loading}>Update password</button></form>}<div className={statusError ? 'portal-error' : recoveryReady ? 'portal-success' : verification === 'verifying' || loading || user ? 'portal-state' : 'portal-error'} role={statusError ? 'alert' : recoveryReady || verification === 'verifying' || loading || user ? 'status' : 'alert'}>{recoveryMessage}</div>{recoveryReady || user ? <Link to="/account">Return to account</Link> : verification !== 'verifying' && !loading && <Link to="/forgot-password">Request a new reset link</Link>}</section></div>;
}
