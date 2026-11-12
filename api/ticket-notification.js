const { withHttp } = require('./_lib/http');
const { userRequest, verifyActiveUser } = require('./_lib/supabase');
const { enforceRateLimit, enforceSameOrigin, jsonOnly, sendPublicError } = require('./_lib/portal-security');
const { sendTicketEmail, ticketEmailConfigured } = require('./_lib/ticket-email');

// Customer-authored messages notify support. Staff replies notify the customer
// from the staff API, so this endpoint never needs to resolve staff roles.
async function ticketNotification(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		enforceSameOrigin(req);
		const user = await verifyActiveUser(req);
		const messageId = typeof req.body?.messageId === 'string' ? req.body.messageId : '';
		const ticketId = typeof req.body?.ticketId === 'string' ? req.body.ticketId : '';
		const messageQuery = messageId
			? `ticket_messages?id=eq.${encodeURIComponent(messageId)}&author_id=eq.${user.id}&select=id,ticket_id,body,created_at`
			: `ticket_messages?ticket_id=eq.${encodeURIComponent(ticketId)}&author_id=eq.${user.id}&select=id,ticket_id,body,created_at&order=created_at.desc&limit=1`;
		const message = (await userRequest(user, messageQuery))?.[0];
		if (!message) return res.status(404).json({ error: 'Ticket message not found' });
		const ticket = (await userRequest(user, `tickets?id=eq.${message.ticket_id}&select=id,user_id,subject,status`))?.[0];
		if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
		if (ticket.user_id !== user.id) return res.status(403).json({ error: 'Ticket access denied' });
		const owner = (await userRequest(user, `profiles?id=eq.${user.id}&select=email,full_name`))?.[0];
		const recipient = process.env.SUPPORT_EMAIL;
		if (!recipient) return res.status(502).json({ error: 'Ticket notification recipient is unavailable' });
		if (!ticketEmailConfigured()) {
			console.error('ticket_delivery_failed', { message: 'Ticket notifications are not configured' });
			return res.status(503).json({ error: 'Ticket notifications are not configured' });
		}
		await Promise.all([
			enforceRateLimit('ticket:user', user.id, 20, 3600),
			enforceRateLimit('ticket:thread', ticket.id, 5, 600),
		]);
		const { duplicate } = await sendTicketEmail({
			recipient, replyTo: owner?.email, customerName: owner?.full_name || owner?.email || 'Customer', ticket, message,
		});
		return res.status(200).json({ notified: true, duplicate });
	} catch (error) {
		console.error('ticket_delivery_failed', {
			message: error instanceof Error ? error.message : 'Unknown ticket notification error',
		});
		return sendPublicError(res, error, 'Ticket notification could not be sent');
	}
}

module.exports = withHttp(ticketNotification);
