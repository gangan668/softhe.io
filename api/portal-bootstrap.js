const { adminRequest, getBearerToken, getConfig, isAdminEmail, verifyUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, jsonOnly, sendPublicError } = require('./_lib/portal-security');
const { fetchWithTimeout } = require('./_lib/fetch');

const revokeOtherSessions = async (req, res) => {
	const user = await verifyUser(req);
	const { url, publishableKey } = getConfig();
	const response = await fetchWithTimeout(`${url}/auth/v1/logout?scope=others`, { method: 'POST', headers: { apikey: publishableKey, Authorization: `Bearer ${getBearerToken(req)}` } });
	if (!response.ok) throw new Error('Session revocation failed');
	return res.status(200).json({ revoked: true, userId: user.id });
};

const revokeStaff = async (req, res) => {
	const actor = await verifyUser(req);
	if (!actor.email_confirmed_at || !isAdminEmail(actor.email)) return res.status(403).json({ error: 'Staff access required' });
	const role = (await adminRequest(`user_roles?user_id=eq.${encodeURIComponent(actor.id)}&select=role,expires_at,revoked_at`))?.[0];
	if (!['staff','admin'].includes(role?.role) || role.revoked_at || new Date(role.expires_at) <= new Date()) return res.status(403).json({ error: 'Staff access required' });
	await enforceRateLimit('staff:revoke', actor.id, 10, 3600);
	const targetUser = String(req.body?.targetUser || '');
	const reason = String(req.body?.reason || '').trim();
	if (!/^[0-9a-f-]{36}$/i.test(targetUser) || reason.length < 3 || reason.length > 500) return res.status(400).json({ error: 'Valid target user and reason are required' });
	if (targetUser === actor.id) return res.status(400).json({ error: 'Use another administrator to revoke this account' });
	await adminRequest('rpc/revoke_staff_access', { method: 'POST', body: { target_user: targetUser, revoker: actor.id, revoke_reason: reason } });
	return res.status(200).json({ revoked: true });
};

async function portalBootstrap(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		if (req.query?.action === 'revoke-others') return await revokeOtherSessions(req, res);
		if (req.query?.action === 'revoke-staff') return await revokeStaff(req, res);
		const user = await verifyUser(req);
		if (!user.email_confirmed_at) return res.status(403).json({ error: 'Verify your email before using the portal' });
		await Promise.all([
			enforceRateLimit('bootstrap:user', user.id, 10, 60),
			enforceRateLimit('bootstrap:ip', clientIp(req), 30, 60),
		]);
		const staff = isAdminEmail(user.email);
		await adminRequest('user_roles?on_conflict=user_id', {
			method: 'POST', body: { user_id: user.id, role: staff ? 'admin' : 'customer', expires_at: staff ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null, revoked_at: null }, headers: { Prefer: 'resolution=merge-duplicates' },
		});
		const claimed = await adminRequest('rpc/claim_verified_orders', { method: 'POST', body: { claim_user: user.id, claim_email: user.email } });
		if (claimed?.length) await adminRequest('activity_events', { method: 'POST', body: claimed.map((order) => ({
			user_id: user.id, actor_id: user.id, event_type: 'order.claimed', resource_type: 'order', resource_id: order.id,
		})) });
		return res.status(200).json({ ready: true, claimedOrders: claimed?.length || 0, staff });
	} catch (error) {
		return sendPublicError(res, error, 'Customer portal is temporarily unavailable');
	}
}

module.exports = portalBootstrap;
