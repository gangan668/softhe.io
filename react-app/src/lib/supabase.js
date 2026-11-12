const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const portalConfigured = Boolean(url && key);

// The portal only uses auth and table queries. Building those two clients directly keeps
// realtime, storage and functions out of the bundle; the wiring mirrors supabase-js createClient.
function createPortalClient({ AuthClient }, { PostgrestClient }) {
	const baseUrl = new URL(url.endsWith('/') ? url : `${url}/`);
	const auth = new AuthClient({
		url: new URL('auth/v1', baseUrl).href,
		headers: { Authorization: `Bearer ${key}`, apikey: key },
		storageKey: `sb-${baseUrl.hostname.split('.')[0]}-auth-token`,
		flowType: 'pkce',
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
	});
	const authenticatedFetch = async (input, init) => {
		const { data } = await auth.getSession();
		const headers = new Headers(init?.headers);
		if (!headers.has('apikey')) headers.set('apikey', key);
		if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${data.session?.access_token ?? key}`);
		return fetch(input, { ...init, headers });
	};
	const rest = new PostgrestClient(new URL('rest/v1', baseUrl).href, { schema: 'public', fetch: authenticatedFetch });
	return { auth, from: (table) => rest.from(table) };
}

let clientPromise;
export const getSupabase = () => {
	if (!portalConfigured) return Promise.resolve(null);
	if (!clientPromise) clientPromise = Promise.all([import('@supabase/auth-js'), import('@supabase/postgrest-js')])
		.then(([authModule, restModule]) => createPortalClient(authModule, restModule))
		.catch((error) => { clientPromise = undefined; throw error; });
	return clientPromise;
};
