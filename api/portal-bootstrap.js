const { adminRequest, getBearerToken, getConfig, verifyActiveUser, verifyUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, enforceSameOrigin, jsonOnly, sendPublicError } = require('./_lib/portal-security');
const { fetchWithTimeout } = require('./_lib/fetch');
const staffHandler = require('./_lib/staff-handler');

const revokeOtherSessions = async (req, res) => {
	const user = await verifyUser(req);
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
		const user = await verifyActiveUser(req);
		if (!user.email_confirmed_at) return res.status(403).json({ error: 'Verify your email before using the portal' });
		await Promise.all([
			enforceRateLimit('bootstrap:user', user.id, 10, 60),
			enforceRateLimit('bootstrap:ip', clientIp(req), 30, 60),
		]);
		// Bootstrap is deliberately incapable of granting or renewing privileged roles.
		const claimed = await adminRequest('rpc/claim_verified_orders', { method: 'POST', body: { claim_user: user.id, claim_email: user.email } });
		if (claimed?.length) await adminRequest('activity_events', { method: 'POST', body: claimed.map((order) => ({
			user_id: user.id, actor_id: user.id, event_type: 'order.claimed', resource_type: 'order', resource_id: order.id,
		})) });
		return res.status(200).json({ ready: true, claimedOrders: claimed?.length || 0 });
	} catch (error) {
		return sendPublicError(res, error, 'Customer portal is temporarily unavailable');
	}
}

module.exports = portalBootstrap;
