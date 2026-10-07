import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { getSupabase, portalConfigured } from '../lib/supabase';

function hasStoredSession() {
	try {
		const url = import.meta.env.VITE_SUPABASE_URL;
		const project = new URL(url).hostname.split('.')[0];
		return Boolean(window.localStorage.getItem(`sb-${project}-auth-token`));
	} catch { return true; }
}

export function AuthProvider({ children }) {
	const location = useLocation();
	const required = portalConfigured && (/^\/(login|register|forgot-password|resend-confirmation|reset-password|account|admin|checkout)(\/|$)/.test(location.pathname)
		|| /[?&](code|token_hash)=/.test(location.search) || /(?:access_token|refresh_token|type=recovery)=?/.test(window.location.hash) || hasStoredSession());
	const [started, setStarted] = useState(required);
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(required);
	const [error, setError] = useState('');
	const [attempt, setAttempt] = useState(0);
	const [staff, setStaff] = useState(false);
	const [staffCheckedUserId, setStaffCheckedUserId] = useState(null);
	const [staffCheckedToken, setStaffCheckedToken] = useState(null);
	const [supabase, setSupabase] = useState(null);
	const sessionUserId = session?.user?.id;
	const enabled = required || started;
	const retry = useCallback(() => { setError(''); setLoading(true); setAttempt((value) => value + 1); }, []);

	useEffect(() => {
		if (!portalConfigured || !enabled) return;
		let active = true;
		let subscription;
		let authChanged = false;
		const initialize = async () => {
			setStarted(true);
			setLoading(true);
			try {
				const client = await getSupabase();
				if (!active) return;
				if (!client) throw new Error('Authentication client unavailable');
				setSupabase(client);
			subscription = client.auth.onAuthStateChange((_event, nextSession) => {
					if (!active) return;
					authChanged = true;
					if (!nextSession) { setStaff(false); setStaffCheckedUserId(null); setStaffCheckedToken(null); }
					setSession(nextSession); setError(''); setLoading(false);
				}).data.subscription;
				const result = await client.auth.getSession();
				if (!active) return;
				if (result.error) throw result.error;
				setSupabase(client);
				if (!authChanged) setSession(result.data.session);
				setError('');
			} catch {
				if (!active) return;
				subscription?.unsubscribe();
				subscription = undefined;
				setSupabase(null); setSession(null);
				setError('Authentication could not be loaded. Please try again.');
			} finally { if (active) setLoading(false); }
		};
		void initialize();
		return () => { active = false; subscription?.unsubscribe(); };
	}, [enabled, attempt]);

	useEffect(() => {
		if (!session?.access_token) return;
		let active = true;
		const bootstrap = () => fetch('/api/staff?action=status', { headers: { Authorization: `Bearer ${session.access_token}` } })
			.then((response) => response.ok ? response.json() : null)
			.then((data) => { if (active) setStaff(Boolean(data?.authorized && data?.mfa === 'aal2')); })
			.catch(() => { if (active) setStaff(false); })
			.finally(() => { if (active) { setStaffCheckedUserId(sessionUserId); setStaffCheckedToken(session.access_token); } });
		void bootstrap();
		const refresh = window.setInterval(bootstrap, 10 * 60 * 1000);
		return () => { active = false; window.clearInterval(refresh); };
	}, [session?.access_token, sessionUserId]);

	const value = useMemo(() => ({ configured: portalConfigured, session, user: session?.user || null, loading: loading || (required && !started), error, retry, staff: Boolean(sessionUserId && staffCheckedUserId === sessionUserId && staffCheckedToken === session?.access_token && staff), staffCheckedUserId: staffCheckedToken === session?.access_token ? staffCheckedUserId : null, supabase }), [session, loading, required, started, error, retry, staff, staffCheckedUserId, staffCheckedToken, sessionUserId, supabase]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
