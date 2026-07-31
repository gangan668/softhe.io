const { adminRequest, isAdminEmail, verifyUser } = require('./_lib/supabase');
const { enforceRateLimit, jsonOnly, sendPublicError } = require('./_lib/portal-security');

module.exports = async function staffRevoke(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
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
	} catch (error) { return sendPublicError(res, error, 'Staff access could not be revoked'); }
};
