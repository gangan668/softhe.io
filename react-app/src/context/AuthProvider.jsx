import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { getSupabase, portalConfigured } from '../lib/supabase';

export function AuthProvider({ children }) {
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(portalConfigured);
	const [staff, setStaff] = useState(false);
	const [staffCheckedUserId, setStaffCheckedUserId] = useState(null);
	const [supabase, setSupabase] = useState(null);
	const sessionUserId = session?.user?.id;

	useEffect(() => {
		let subscription;
		getSupabase().then((client) => {
			if (!client) return;
			setSupabase(client);
			client.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
			const result = client.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false); if (!nextSession) { setStaff(false); setStaffCheckedUserId(null); } });
			subscription = result.data.subscription;
		});
		return () => subscription?.unsubscribe();
	}, []);

	useEffect(() => {
		if (!session?.access_token) return;
		let active = true;
		const bootstrap = () => fetch('/api/portal-bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: '{}' })
			.then((response) => response.ok ? response.json() : null)
			.then((data) => { if (active) setStaff(Boolean(data?.staff)); })
			.catch(() => { if (active) setStaff(false); })
			.finally(() => { if (active) setStaffCheckedUserId(sessionUserId); });
		bootstrap();
		const refresh = window.setInterval(bootstrap, 10 * 60 * 1000);
		return () => { active = false; window.clearInterval(refresh); };
	}, [session?.access_token, sessionUserId]);

	const value = useMemo(() => ({ configured: portalConfigured, session, user: session?.user || null, loading, staff, staffCheckedUserId, supabase }), [session, loading, staff, staffCheckedUserId, supabase]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
