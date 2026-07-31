const { adminRequest, verifyActiveUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, jsonOnly, sendPublicError } = require('./_lib/portal-security');

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function ticketWrite(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		const user = await verifyActiveUser(req);
		await Promise.all([
			enforceRateLimit('ticket-write:user', user.id, 20, 3600),
			enforceRateLimit('ticket-write:ip', clientIp(req), 40, 3600),
		]);
		const action = String(req.body?.action || '');
		if (action === 'create') {
			const subject = String(req.body?.subject || '').trim();
			const category = String(req.body?.category || '').trim().toLowerCase();
			const message = String(req.body?.message || '').trim();
			if (subject.length < 3 || subject.length > 160 || message.length < 3 || message.length > 5000 || !['general','order','technical','billing'].includes(category)) return res.status(400).json({ error: 'Invalid ticket details' });
			const id = await adminRequest('rpc/create_ticket_for_user', { method: 'POST', body: { ticket_user: user.id, ticket_subject: subject, ticket_category: category, first_message: message } });
			return res.status(201).json({ id });
		}
		if (action === 'message') {
			const ticketId = String(req.body?.ticketId || '');
			const body = String(req.body?.message || '').trim();
			if (!uuid.test(ticketId) || body.length < 1 || body.length > 5000) return res.status(400).json({ error: 'Invalid ticket reply' });
			const ticket = (await adminRequest(`tickets?id=eq.${encodeURIComponent(ticketId)}&select=id,user_id,status`))?.[0];
			const role = (await adminRequest(`user_roles?user_id=eq.${encodeURIComponent(user.id)}&select=role,expires_at,revoked_at`))?.[0];
			const staff = ['staff','admin'].includes(role?.role) && !role.revoked_at && new Date(role.expires_at) > new Date();
			if (!ticket || (!staff && ticket.user_id !== user.id) || ticket.status === 'closed') return res.status(403).json({ error: 'Ticket reply is not permitted' });
			const message = await adminRequest('ticket_messages?select=id', { method: 'POST', body: { ticket_id: ticket.id, author_id: user.id, body }, headers: { Prefer: 'return=representation' } });
			return res.status(201).json({ id: message?.[0]?.id });
		}
		return res.status(400).json({ error: 'Invalid ticket action' });
	} catch (error) { return sendPublicError(res, error, 'Ticket could not be saved'); }
}

module.exports = ticketWrite;
