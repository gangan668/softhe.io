const { userRequest, verifyActiveUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, jsonOnly, sendPublicError } = require('./_lib/portal-security');

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TICKET_CATEGORIES = new Set(['general','sales','technical','billing']);

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
			if (subject.length < 3 || subject.length > 160 || message.length < 3 || message.length > 5000 || !TICKET_CATEGORIES.has(category)) return res.status(400).json({ error: 'Invalid ticket details' });
			const id = await userRequest(user, 'rpc/create_customer_ticket', { method: 'POST', body: { ticket_subject: subject, ticket_category: category, first_message: message } });
			return res.status(201).json({ id });
		}
		if (action === 'message') {
			const ticketId = String(req.body?.ticketId || '');
			const body = String(req.body?.message || '').trim();
			if (!uuid.test(ticketId) || body.length < 1 || body.length > 5000) return res.status(400).json({ error: 'Invalid ticket reply' });
			const id = await userRequest(user, 'rpc/add_customer_ticket_message', { method: 'POST', body: { target_ticket: ticketId, message_body: body } });
			return res.status(201).json({ id });
		}
		return res.status(400).json({ error: 'Invalid ticket action' });
	} catch (error) { return sendPublicError(res, error, 'Ticket could not be saved'); }
}

module.exports = ticketWrite;
module.exports.TICKET_CATEGORIES = TICKET_CATEGORIES;
