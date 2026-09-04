const { adminRequest, verifyStaff } = require('./supabase');
const { clientIp, enforceRateLimit, enforceSameOrigin, jsonOnly, sendPublicError } = require('./portal-security');
const { claimKey, deleteKey, redisCommand, setKey } = require('./redis');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(['open', 'in_progress', 'waiting_for_customer', 'closed']);
const safePage = (value) => Math.min(100, Math.max(1, Number.parseInt(value, 10) || 1));
const audit = (actor, eventType, resourceType, resourceId, metadata = {}) => adminRequest('staff_audit_events', {
	method: 'POST', body: { actor_id: actor.id, event_type: eventType, resource_type: resourceType, resource_id: resourceId || null, metadata },
});

async function staffApi(req, res) {
	res.setHeader('Cache-Control', 'no-store, private');
	res.setHeader('Vary', 'Authorization');
	let activeLock = null;
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
		jsonOnly(req); enforceSameOrigin(req);
		const idempotencyKey = String(req.headers?.['idempotency-key'] || '').trim();
		if (!/^[A-Za-z0-9_-]{20,100}$/.test(idempotencyKey)) return res.status(400).json({ error: 'A valid idempotency key is required' });
		const replayKey = `portal:staff-write:${actor.id}:${idempotencyKey}`;
		const cached = await redisCommand(['GET', replayKey]);
		if (cached) {
			const replay = JSON.parse(cached);
			return res.status(200).json({ ...replay, duplicate: true });
		}
		activeLock = `${replayKey}:lock`;
		if (!(await claimKey(activeLock, '1', 60))) return res.status(409).json({ error: 'Request already in progress' });
		const complete = async (status, payload) => {
			await setKey(replayKey, JSON.stringify(payload), 24 * 3600);
			activeLock = null;
			return res.status(status).json(payload);
		};
		const fail = async (status, payload) => {
			await deleteKey(activeLock).catch(() => {});
			activeLock = null;
			return res.status(status).json(payload);
		};
		if (action === 'reply') {
			const ticketId = String(req.body?.ticketId || ''); const body = String(req.body?.message || '').trim();
			if (!UUID.test(ticketId) || body.length < 1 || body.length > 4000) return fail(400, { error: 'Invalid request' });
			const ticket = (await adminRequest(`tickets?id=eq.${ticketId}&select=id,status`))?.[0];
			if (!ticket || ticket.status === 'closed') return fail(404, { error: 'Not found' });
			const message = await adminRequest('ticket_messages', { method: 'POST', body: { ticket_id: ticketId, author_id: actor.id, body }, headers: { Prefer: 'return=representation' } });
			await adminRequest(`tickets?id=eq.${ticketId}`, { method: 'PATCH', body: { status: 'waiting_for_customer', updated_at: new Date().toISOString() } });
			await audit(actor, 'staff.ticket_replied', 'ticket', ticketId, { messageId: message?.[0]?.id });
			return complete(201, { id: message?.[0]?.id });
		}
		if (action === 'status') {
			const ticketId = String(req.body?.ticketId || ''); const status = String(req.body?.status || '');
			if (!UUID.test(ticketId) || !STATUSES.has(status)) return fail(400, { error: 'Invalid request' });
			const updated = await adminRequest(`tickets?id=eq.${ticketId}`, { method: 'PATCH', body: { status, updated_at: new Date().toISOString() }, headers: { Prefer: 'return=representation' } });
			if (!updated?.length) return fail(404, { error: 'Not found' });
			await audit(actor, 'staff.ticket_status_changed', 'ticket', ticketId, { status });
			return complete(200, { updated: true });
		}
		if (action === 'grant') {
			const targetUser = String(req.body?.targetUser || ''); const role = String(req.body?.role || ''); const reason = String(req.body?.reason || '').trim(); const expiresAt = String(req.body?.expiresAt || '');
			if (!UUID.test(targetUser) || !['staff','admin'].includes(role) || reason.length < 3 || !Number.isFinite(Date.parse(expiresAt))) return fail(400, { error: 'Invalid request' });
			await adminRequest('rpc/grant_staff_access', { method: 'POST', body: { target_user: targetUser, actor_user: actor.id, target_role: role, valid_until: expiresAt, reason } });
			return complete(200, { granted: true });
		}
		if (action === 'revoke') {
			const targetUser = String(req.body?.targetUser || ''); const reason = String(req.body?.reason || '').trim();
			if (!UUID.test(targetUser) || targetUser === actor.id || reason.length < 3) return fail(400, { error: 'Invalid request' });
			await adminRequest('rpc/revoke_staff_access', { method: 'POST', body: { target_user: targetUser, revoker: actor.id, revoke_reason: reason } });
			return complete(200, { revoked: true });
		}
		return fail(404, { error: 'Not found' });
	} catch (error) {
		if (activeLock) await deleteKey(activeLock).catch(() => {});
		return sendPublicError(res, error, 'Request could not be completed');
	}
}

module.exports = staffApi;
