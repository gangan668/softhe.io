const { sendEmailTemplate } = require('./_lib/emailjs');
const { adminRequest, verifyUser } = require('./_lib/supabase');

async function ticketNotification(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
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
		if (!recipient || !process.env.EMAILJS_TICKET_TEMPLATE_ID) return res.status(200).json({ notified: false });
		await sendEmailTemplate(process.env.EMAILJS_TICKET_TEMPLATE_ID, {
			to_email: recipient, customer_name: owner?.full_name || owner?.email || 'Customer', ticket_id: ticket.id,
			ticket_subject: ticket.subject, ticket_status: ticket.status, reply_preview: message.body.slice(0, 500),
		});
		return res.status(200).json({ notified: true });
	} catch (error) { return res.status(error.statusCode || 502).json({ error: error.message }); }
}

module.exports = ticketNotification;
