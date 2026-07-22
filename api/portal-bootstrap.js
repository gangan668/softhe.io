const { adminRequest, isAdminEmail, verifyUser } = require('./_lib/supabase');

async function portalBootstrap(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		const user = await verifyUser(req);
		if (!user.email_confirmed_at) return res.status(403).json({ error: 'Verify your email before using the portal' });
		const staff = isAdminEmail(user.email);
		await adminRequest('user_roles?on_conflict=user_id', {
			method: 'POST', body: { user_id: user.id, role: staff ? 'admin' : 'customer' }, headers: { Prefer: 'resolution=merge-duplicates' },
		});
		const claimed = await adminRequest(`orders?user_id=is.null&customer_email=ilike.${encodeURIComponent(user.email)}`, {
			method: 'PATCH', body: { user_id: user.id, updated_at: new Date().toISOString() }, headers: { Prefer: 'return=representation' },
		});
		if (claimed?.length) await adminRequest('activity_events', { method: 'POST', body: claimed.map((order) => ({
			user_id: user.id, actor_id: user.id, event_type: 'order.claimed', resource_type: 'order', resource_id: order.id,
		})) });
		return res.status(200).json({ ready: true, claimedOrders: claimed?.length || 0, staff });
	} catch (error) {
		return res.status(error.statusCode || 503).json({ error: error.message });
	}
}

module.exports = portalBootstrap;
