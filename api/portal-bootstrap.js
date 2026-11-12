const { withHttp } = require('./_lib/http');
const { getBearerToken, getConfig, verifyUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, enforceSameOrigin, jsonOnly, sendPublicError } = require('./_lib/portal-security');
const { fetchWithTimeout } = require('./_lib/fetch');
const staffHandler = require('./_lib/staff-handler');

const revokeOtherSessions = async (req, res) => {
	const user = await verifyUser(req);
	await Promise.all([
		enforceRateLimit('revoke-others:user', user.id, 5, 600),
		enforceRateLimit('revoke-others:ip', clientIp(req), 20, 600),
	]);
	const { url, publishableKey } = getConfig();
	const response = await fetchWithTimeout(`${url}/auth/v1/logout?scope=others`, { method: 'POST', headers: { apikey: publishableKey, Authorization: `Bearer ${getBearerToken(req)}` } });
	if (!response.ok) throw new Error('Session revocation failed');
	return res.status(200).json({ revoked: true, userId: user.id });
};

async function portalBootstrap(req, res) {
	if (req.query?.staff === '1') return staffHandler(req, res);
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		enforceSameOrigin(req);
		if (req.query?.action === 'revoke-others') return await revokeOtherSessions(req, res);
		if (['revoke-staff', 'account-status'].includes(req.query?.action)) return res.status(410).json({ error: 'Legacy staff operation disabled' });
		// Orders are bound to an account at checkout; email-based order claiming is retired.
		return res.status(404).json({ error: 'Not found' });
	} catch (error) {
		return sendPublicError(res, error, 'Customer portal is temporarily unavailable');
	}
}

module.exports = withHttp(portalBootstrap);
