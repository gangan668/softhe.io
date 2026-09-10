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
	const authorization = serviceKey.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${serviceKey}` };
	const response = await fetchWithTimeout(`${url}/rest/v1/${path}`, {
		method,
		headers: { apikey: serviceKey, ...authorization, 'Content-Type': 'application/json', ...headers },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.message || data.error || `Customer data request failed (${response.status})`);
	}
	if (response.status === 204) return null;
	return response.json().catch(() => null);
};

const userRequest = async (user, path, { method = 'GET', body, headers = {} } = {}) => {
	const { url, publishableKey } = getConfig();
	if (!user?.token) throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
	const response = await fetchWithTimeout(`${url}/rest/v1/${path}`, {
		method,
		headers: { apikey: publishableKey, Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json', ...headers },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw Object.assign(new Error(data.message || data.error || `Customer data request failed (${response.status})`), { statusCode: response.status });
	}
	if (response.status === 204) return null;
	return response.json().catch(() => null);
};

const verifyActiveUser = async (req, options) => {
	const user = await verifyUser(req, options);
	if (!user) return null;
	const profile = (await userRequest(user, `profiles?id=eq.${encodeURIComponent(user.id)}&select=account_status`))?.[0];
	if (!profile || profile.account_status !== 'active') {
		throw Object.assign(new Error('Account is unavailable'), { statusCode: 403, publicMessage: 'This account is not active.' });
	}
	return user;
};

const authAdminRequest = async (path, { method = 'POST', body } = {}) => {
	const { url, serviceKey } = getConfig();
	if (!serviceKey) throw new Error('Customer portal server access is not configured');
	const authorization = serviceKey.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${serviceKey}` };
	const response = await fetchWithTimeout(`${url}/auth/v1/admin/${path}`, {
		method, headers: { apikey: serviceKey, ...authorization, 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) throw new Error(`Authentication administration failed (${response.status})`);
	return response.status === 204 ? null : response.json().catch(() => null);
};

const jwtClaims = (token) => {
	try { return JSON.parse(Buffer.from(String(token).split('.')[1] || '', 'base64url').toString('utf8')); }
	catch { return {}; }
};

const staffPortalEnabled = () => process.env.STAFF_PORTAL_ENABLED === 'true';

const verifyStaff = async (req, { adminOnly = false } = {}) => {
	if (!staffPortalEnabled()) throw Object.assign(new Error('Not found'), { statusCode: 404, publicMessage: 'Not found' });
	const user = await verifyActiveUser(req);
	if (!user.email_confirmed_at) throw Object.assign(new Error('Forbidden'), { statusCode: 403, publicMessage: 'Forbidden' });
	const claims = jwtClaims(user.token);
	if (claims.sub !== user.id || claims.aal !== 'aal2' || !/^[0-9a-f-]{36}$/i.test(String(claims.session_id || ''))) {
		throw Object.assign(new Error('MFA required'), { statusCode: 403, publicMessage: 'Multi-factor authentication is required.' });
	}
	const access = (await adminRequest('rpc/verify_staff_access', { method: 'POST', body: { target_user: user.id, target_session: claims.session_id } }))?.[0];
	if (!access || (adminOnly && access.role !== 'admin')) throw Object.assign(new Error('Forbidden'), { statusCode: 403, publicMessage: 'Forbidden' });
	return { ...user, staffRole: access.role, staffExpiresAt: access.expires_at, sessionId: claims.session_id };
};

const portalServerConfigured = () => Boolean(
	(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
	&& (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
	&& process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { adminRequest, authAdminRequest, getBearerToken, getConfig, portalServerConfigured, staffPortalEnabled, userRequest, verifyActiveUser, verifyStaff, verifyUser };
