const { fetchWithTimeout } = require('./fetch');

const getConfig = () => {
	const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
	const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !publishableKey) throw new Error('Customer portal is not configured');
	return { url: url.replace(/\/$/, ''), publishableKey, serviceKey };
};

const getBearerToken = (req) => {
	const value = req.headers?.authorization;
	return typeof value === 'string' && value.startsWith('Bearer ') ? value.slice(7).trim() : null;
};

const verifyUser = async (req, { required = true } = {}) => {
	const token = getBearerToken(req);
	if (!token) {
		if (required) throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
		return null;
	}
	const { url, publishableKey } = getConfig();
	const response = await fetchWithTimeout(`${url}/auth/v1/user`, {
		headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
	});
	if (!response.ok) throw Object.assign(new Error('Invalid or expired session'), { statusCode: 401 });
	const user = await response.json();
	if (!user?.id || !user?.email) throw Object.assign(new Error('Invalid user session'), { statusCode: 401 });
	return { ...user, token };
};

const adminRequest = async (path, { method = 'GET', body, headers = {} } = {}) => {
	const { url, serviceKey } = getConfig();
	if (!serviceKey) throw new Error('Customer portal server access is not configured');
	const response = await fetchWithTimeout(`${url}/rest/v1/${path}`, {
		method,
		headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', ...headers },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.message || data.error || `Customer data request failed (${response.status})`);
	}
	if (response.status === 204) return null;
	return response.json().catch(() => null);
};

const authAdminRequest = async (path, { method = 'POST', body } = {}) => {
	const { url, serviceKey } = getConfig();
	if (!serviceKey) throw new Error('Customer portal server access is not configured');
	const response = await fetchWithTimeout(`${url}/auth/v1/admin/${path}`, {
		method, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) throw new Error(`Authentication administration failed (${response.status})`);
	return response.status === 204 ? null : response.json().catch(() => null);
};

const isAdminEmail = (email) => new Set((process.env.ADMIN_EMAIL_ALLOWLIST || '')
	.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)).has(String(email).toLowerCase());

const portalServerConfigured = () => Boolean(
	(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
	&& (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
	&& process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { adminRequest, authAdminRequest, getBearerToken, getConfig, isAdminEmail, portalServerConfigured, verifyUser };
