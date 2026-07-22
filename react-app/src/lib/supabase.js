const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const portalConfigured = Boolean(url && key);
let clientPromise;
export const getSupabase = () => {
	if (!portalConfigured) return Promise.resolve(null);
	if (!clientPromise) clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key, {
		auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
	}));
	return clientPromise;
};
