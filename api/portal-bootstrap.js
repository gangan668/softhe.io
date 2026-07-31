const { adminRequest, isAdminEmail, verifyUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, jsonOnly, sendPublicError } = require('./_lib/portal-security');

async function portalBootstrap(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
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
