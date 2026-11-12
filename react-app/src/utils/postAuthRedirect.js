// Remembers where a customer was heading when sign-up interrupted them, so the
// email confirmation link (a fresh page load) can return them there.
const STORAGE_KEY = 'softhe:post-auth-destination';
const TTL_MS = 24 * 60 * 60 * 1000;
// Only fixed internal paths are accepted, so a stored value can never redirect off-site.
const ALLOWED_DESTINATIONS = new Set(['/checkout']);

export const isAllowedDestination = (path) => ALLOWED_DESTINATIONS.has(path);

export const rememberPostAuthDestination = (path, now = Date.now()) => {
	if (!isAllowedDestination(path)) return;
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ path, expiresAt: now + TTL_MS })); } catch { /* storage unavailable: fall back to the account page */ }
};

export const peekPostAuthDestination = (now = Date.now()) => {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
		if (stored && isAllowedDestination(stored.path) && Number(stored.expiresAt) > now) return stored.path;
		if (stored) localStorage.removeItem(STORAGE_KEY);
	} catch { /* malformed or unavailable storage */ }
	return null;
};

export const clearPostAuthDestination = () => {
	try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
};
