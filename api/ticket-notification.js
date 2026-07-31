const { sendEmailTemplate } = require('./_lib/emailjs');
const { adminRequest, verifyUser } = require('./_lib/supabase');
const { acquireLock, enforceRateLimit, jsonOnly, sendPublicError } = require('./_lib/portal-security');

async function ticketNotification(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		const user = await verifyUser(req);
		const messageId = typeof req.body?.messageId === 'string' ? req.body.messageId : '';
		const ticketId = typeof req.body?.ticketId === 'string' ? req.body.ticketId : '';
		const messageQuery = messageId
			? `ticket_messages?id=eq.${encodeURIComponent(messageId)}&author_id=eq.${user.id}&select=id,ticket_id,body,created_at`
			: `ticket_messages?ticket_id=eq.${encodeURIComponent(ticketId)}&author_id=eq.${user.id}&select=id,ticket_id,body,created_at&order=created_at.desc&limit=1`;
		const message = (await adminRequest(messageQuery))?.[0];
		if (!message) return res.status(404).json({ error: 'Ticket message not found' });
		const ticket = (await adminRequest(`tickets?id=eq.${message.ticket_id}&select=id,user_id,subject,status`))?.[0];
		if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
		const role = (await adminRequest(`user_roles?user_id=eq.${user.id}&select=role`))?.[0]?.role;
		const isStaff = ['staff', 'admin'].includes(role);
		if (!isStaff && ticket.user_id !== user.id) return res.status(403).json({ error: 'Ticket access denied' });
		const owner = (await adminRequest(`profiles?id=eq.${ticket.user_id}&select=email,full_name`))?.[0];
		const recipient = isStaff ? owner?.email : process.env.SUPPORT_EMAIL;
		if (!recipient) return res.status(502).json({ error: 'Ticket notification recipient is unavailable' });
		if (!process.env.EMAILJS_TICKET_TEMPLATE_ID) return res.status(503).json({ error: 'Ticket notifications are not configured' });
		await Promise.all([
			enforceRateLimit('ticket:user', user.id, 20, 3600),
			enforceRateLimit('ticket:thread', ticket.id, 5, 600),
		]);
		if (!(await acquireLock(`ticket-notification:${message.id}`, 30 * 24 * 3600))) return res.status(200).json({ notified: true, duplicate: true });
		await sendEmailTemplate(process.env.EMAILJS_TICKET_TEMPLATE_ID, {
			to_email: recipient, customer_name: owner?.full_name || owner?.email || 'Customer', ticket_id: ticket.id,
			ticket_subject: ticket.subject, ticket_status: ticket.status, reply_preview: message.body.slice(0, 500),
		});
		return res.status(200).json({ notified: true, duplicate: false });
	} catch (error) { return sendPublicError(res, error, 'Ticket notification could not be sent'); }
}

module.exports = ticketNotification;
