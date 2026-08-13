const { adminRequest, verifyStaff } = require('./supabase');
const { clientIp, enforceRateLimit, jsonOnly, sendPublicError } = require('./portal-security');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(['open', 'in_progress', 'waiting_for_customer', 'closed']);
const safePage = (value) => Math.min(100, Math.max(1, Number.parseInt(value, 10) || 1));
const sameOrigin = (req) => {
	const origin = String(req.headers?.origin || '');
	if (!origin) return;
	let host;
	try { host = new URL(origin).host; } catch { throw Object.assign(new Error('Forbidden'), { statusCode: 403 }); }
	if (host !== String(req.headers?.host || '')) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
};
const audit = (actor, eventType, resourceType, resourceId, metadata = {}) => adminRequest('staff_audit_events', {
	method: 'POST', body: { actor_id: actor.id, event_type: eventType, resource_type: resourceType, resource_id: resourceId || null, metadata },
});

async function staffApi(req, res) {
	res.setHeader('Cache-Control', 'no-store, private');
	res.setHeader('Vary', 'Authorization');
	try {
		const action = String(req.query?.action || 'status');
		const adminOnly = ['orders', 'customers', 'grant', 'revoke'].includes(action);
		const actor = await verifyStaff(req, { adminOnly });
		await Promise.all([
			enforceRateLimit('staff:user', actor.id, 120, 60),
			enforceRateLimit('staff:ip', clientIp(req), 180, 60),
		]);

		if (req.method === 'GET' && action === 'status') {
			const sessions = await adminRequest('rpc/staff_session_summary', { method: 'POST', body: { target_user: actor.id } });
			return res.status(200).json({ authorized: true, role: actor.staffRole, expiresAt: actor.staffExpiresAt, mfa: 'aal2', sessions: sessions || [] });
		}
		if (req.method === 'GET' && action === 'queue') {
			const page = safePage(req.query?.page); const from = (page - 1) * 25;
			const tickets = await adminRequest(`tickets?select=id,user_id,subject,category,status,created_at,updated_at&order=updated_at.desc&offset=${from}&limit=25`);
			const ids = [...new Set((tickets || []).map((t) => t.user_id))].filter(UUID.test);
			const profiles = ids.length ? await adminRequest(`profiles?id=in.(${ids.join(',')})&select=id,email,full_name`) : [];
			const owners = Object.fromEntries((profiles || []).map((p) => [p.id, { email: p.email, fullName: p.full_name }]));
			await audit(actor, 'staff.ticket_queue_read', 'ticket', null, { page, returned: tickets?.length || 0 });
			return res.status(200).json({ page, tickets: (tickets || []).map((t) => ({ ...t, owner: owners[t.user_id] || null })) });
		}
		if (req.method === 'GET' && action === 'ticket') {
			const id = String(req.query?.id || ''); if (!UUID.test(id)) return res.status(404).json({ error: 'Not found' });
			const ticket = (await adminRequest(`tickets?id=eq.${id}&select=id,user_id,subject,category,status,created_at,updated_at`))?.[0];
			if (!ticket) return res.status(404).json({ error: 'Not found' });
			const messages = await adminRequest(`ticket_messages?ticket_id=eq.${id}&select=id,author_id,body,created_at&order=created_at.asc&limit=200`);
			await audit(actor, 'staff.ticket_read', 'ticket', id);
			return res.status(200).json({ ticket, messages: messages || [] });
		}
		if (req.method === 'GET' && action === 'orders') {
			const orders = await adminRequest('orders?select=id,customer_email,status,amount_total,currency,created_at&order=created_at.desc&limit=50');
			await audit(actor, 'staff.orders_read', 'order', null, { returned: orders?.length || 0 });
			return res.status(200).json({ orders: orders || [] });
		}
		if (req.method === 'GET' && action === 'customers') {
			const customers = await adminRequest('profiles?select=id,email,full_name,account_status,created_at&order=created_at.desc&limit=50');
			await audit(actor, 'staff.customers_read', 'profile', null, { returned: customers?.length || 0 });
			return res.status(200).json({ customers: customers || [] });
		}
		if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
		jsonOnly(req); sameOrigin(req);
		if (action === 'reply') {
			const ticketId = String(req.body?.ticketId || ''); const body = String(req.body?.message || '').trim();
			if (!UUID.test(ticketId) || body.length < 1 || body.length > 4000) return res.status(400).json({ error: 'Invalid request' });
			const ticket = (await adminRequest(`tickets?id=eq.${ticketId}&select=id,status`))?.[0];
			if (!ticket || ticket.status === 'closed') return res.status(404).json({ error: 'Not found' });
			const message = await adminRequest('ticket_messages', { method: 'POST', body: { ticket_id: ticketId, author_id: actor.id, body }, headers: { Prefer: 'return=representation' } });
			await adminRequest(`tickets?id=eq.${ticketId}`, { method: 'PATCH', body: { status: 'waiting_for_customer', updated_at: new Date().toISOString() } });
			await audit(actor, 'staff.ticket_replied', 'ticket', ticketId, { messageId: message?.[0]?.id });
			return res.status(201).json({ id: message?.[0]?.id });
		}
		if (action === 'status') {
			const ticketId = String(req.body?.ticketId || ''); const status = String(req.body?.status || '');
			if (!UUID.test(ticketId) || !STATUSES.has(status)) return res.status(400).json({ error: 'Invalid request' });
			const updated = await adminRequest(`tickets?id=eq.${ticketId}`, { method: 'PATCH', body: { status, updated_at: new Date().toISOString() }, headers: { Prefer: 'return=representation' } });
			if (!updated?.length) return res.status(404).json({ error: 'Not found' });
			await audit(actor, 'staff.ticket_status_changed', 'ticket', ticketId, { status });
			return res.status(200).json({ updated: true });
		}
		if (action === 'grant') {
			const targetUser = String(req.body?.targetUser || ''); const role = String(req.body?.role || ''); const reason = String(req.body?.reason || '').trim(); const expiresAt = String(req.body?.expiresAt || '');
			if (!UUID.test(targetUser) || !['staff','admin'].includes(role) || reason.length < 3 || !Number.isFinite(Date.parse(expiresAt))) return res.status(400).json({ error: 'Invalid request' });
			await adminRequest('rpc/grant_staff_access', { method: 'POST', body: { target_user: targetUser, actor_user: actor.id, target_role: role, valid_until: expiresAt, reason } });
			return res.status(200).json({ granted: true });
		}
		if (action === 'revoke') {
			const targetUser = String(req.body?.targetUser || ''); const reason = String(req.body?.reason || '').trim();
			if (!UUID.test(targetUser) || targetUser === actor.id || reason.length < 3) return res.status(400).json({ error: 'Invalid request' });
			await adminRequest('rpc/revoke_staff_access', { method: 'POST', body: { target_user: targetUser, revoker: actor.id, revoke_reason: reason } });
			await audit(actor, 'staff.revoked', 'user_role', targetUser, { reason: reason.slice(0, 500) });
			return res.status(200).json({ revoked: true });
		}
		return res.status(404).json({ error: 'Not found' });
	} catch (error) { return sendPublicError(res, error, 'Request could not be completed'); }
}

module.exports = staffApi;
