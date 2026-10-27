import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import '../pages/Portal.css';

// Shown to accounts with a verified authenticator until the session reaches AAL2.
export default function MfaChallenge() {
	const { supabase } = useAuth();
	const [code, setCode] = useState('');
	const [status, setStatus] = useState({ loading: false, error: '' });

	const submit = async (event) => {
		event.preventDefault();
		if (!supabase || status.loading) return;
		setStatus({ loading: true, error: '' });
		try {
			const factors = await supabase.auth.mfa.listFactors();
			const factor = factors.data?.totp?.find((item) => item.status === 'verified');
			if (factors.error || !factor) throw new Error('No verified authenticator');
			const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
			if (challenge.error) throw challenge.error;
			const verified = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.data.id, code });
			if (verified.error) { setCode(''); return setStatus({ loading: false, error: 'That authenticator code was not accepted.' }); }
			// The verified session arrives through the auth state listener.
			setStatus({ loading: false, error: '' });
		} catch { setStatus({ loading: false, error: 'Verification could not be completed. Please try again.' }); }
	};
	const signOut = async () => { try { await supabase?.auth.signOut({ scope: 'local' }); } catch { /* the session is discarded locally either way */ } };

	return <div className="portal-page auth-page"><section className="portal-card auth-card">
		<h1>Two-step verification</h1>
		<p>Enter the six-digit code from your authenticator app to continue.</p>
		<form className="portal-form" onSubmit={submit}>
			<label>Authenticator code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required autoFocus /></label>
			{status.error && <div className="portal-error" role="alert">{status.error}</div>}
			<button className="btn btn-primary" disabled={status.loading}>{status.loading ? 'Verifying…' : 'Verify'}</button>
		</form>
		<div className="auth-links"><button type="button" className="btn btn-secondary" onClick={signOut}>Sign out</button></div>
	</section></div>;
}
