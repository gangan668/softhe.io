import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Portal.css';

export default function ResetPassword() {
	const { supabase, configured, loading } = useAuth();
	const [password, setPassword] = useState('');
	const [status, setStatus] = useState('');
	const submit = async (event) => { event.preventDefault(); if (!configured || !supabase) return setStatus(configured ? 'Authentication is still loading. Please try again.' : 'Customer portal is not configured.'); const { error } = await supabase.auth.updateUser({ password }); setStatus(error?.message || 'Password updated. You can now return to your account.'); };
	return <div className="portal-page auth-page"><section className="portal-card auth-card"><h1>Choose a new password</h1><form className="portal-form" onSubmit={submit}><label>New password<input type="password" minLength="8" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><button className="btn btn-primary" disabled={loading}>Update password</button>{status && <div role="status">{status}</div>}</form><Link to="/account">Return to account</Link></section></div>;
}
