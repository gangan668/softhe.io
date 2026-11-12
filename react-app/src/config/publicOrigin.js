export const PRODUCTION_ORIGIN = 'https://softhe.io';

// Keep the historic hosting alias from leaking into public metadata and email links.
// An isolated deployment can explicitly set VITE_PUBLIC_ORIGIN or its own VITE_APP_URL.
export function resolvePublicOrigin(env = {}) {
	const explicit = env.VITE_PUBLIC_ORIGIN?.trim();
	const value = explicit || env.VITE_APP_URL?.trim() || PRODUCTION_ORIGIN;
	let url;
	try { url = new URL(value); } catch { throw new Error('Public origin must be a valid absolute URL'); }
	const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
	if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
		|| url.username || url.password || url.search || url.hash || url.pathname !== '/') {
		throw new Error('Public origin must be an HTTPS origin without credentials, path, query, or fragment (HTTP is allowed on localhost)');
	}
	if (!explicit && url.origin === 'https://softhe-io.vercel.app') return PRODUCTION_ORIGIN;
	return url.origin;
}
