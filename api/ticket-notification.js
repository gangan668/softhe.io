const { sendEmailTemplate } = require('./_lib/emailjs');
const { sendTransactionalEmail } = require('./_lib/resend');
const { userRequest, verifyActiveUser } = require('./_lib/supabase');
const { acquireLock, enforceRateLimit, jsonOnly, releaseLock, sendPublicError } = require('./_lib/portal-security');

async function ticketNotification(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
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
		const role = (await userRequest(user, `user_roles?user_id=eq.${user.id}&select=role`))?.[0]?.role;
		const isStaff = ['staff', 'admin'].includes(role);
		if (!isStaff && ticket.user_id !== user.id) return res.status(403).json({ error: 'Ticket access denied' });
		const owner = (await userRequest(user, `profiles?id=eq.${ticket.user_id}&select=email,full_name`))?.[0];
		const recipient = isStaff ? owner?.email : process.env.SUPPORT_EMAIL;
		if (!recipient) return res.status(502).json({ error: 'Ticket notification recipient is unavailable' });
		if (!process.env.EMAILJS_TICKET_TEMPLATE_ID && !process.env.RESEND_API_KEY) {
			console.error('ticket_delivery_failed', { message: 'Ticket notifications are not configured' });
			return res.status(503).json({ error: 'Ticket notifications are not configured' });
		}
		await Promise.all([
			enforceRateLimit('ticket:user', user.id, 20, 3600),
			enforceRateLimit('ticket:thread', ticket.id, 5, 600),
		]);
		const lockName = `ticket-notification:${message.id}`;
		if (!(await acquireLock(lockName, 30 * 24 * 3600))) return res.status(200).json({ notified: true, duplicate: true });
		try {
			const params = {
				to_email: recipient, customer_name: owner?.full_name || owner?.email || 'Customer', ticket_id: ticket.id,
				ticket_subject: ticket.subject, ticket_status: ticket.status, reply_preview: message.body.slice(0, 500),
			};
			try {
				if (!process.env.EMAILJS_TICKET_TEMPLATE_ID) throw new Error('EmailJS ticket delivery is not configured');
				await sendEmailTemplate(process.env.EMAILJS_TICKET_TEMPLATE_ID, params);
			} catch (emailJsError) {
				if (!process.env.RESEND_API_KEY) throw emailJsError;
				const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
				const body = message.body.slice(0, 500);
				await sendTransactionalEmail({
					to: recipient,
					replyTo: isStaff ? undefined : owner?.email,
					subject: `[Softhe.io ticket] ${ticket.subject}`,
					text: `Ticket: ${ticket.id}\nStatus: ${ticket.status}\n\n${body}`,
					html: `<h1>Softhe.io support ticket</h1><p><strong>Ticket:</strong> ${escapeHtml(ticket.id)}</p><p><strong>Status:</strong> ${escapeHtml(ticket.status)}</p><p>${escapeHtml(body).replace(/\n/g, '<br>')}</p>`,
					idempotencyKey: `ticket-notification/${message.id}`,
				});
			}
		} catch (error) { await releaseLock(lockName).catch(() => {}); throw error; }
		return res.status(200).json({ notified: true, duplicate: false });
	} catch (error) {
		console.error('ticket_delivery_failed', {
			message: error instanceof Error ? error.message : 'Unknown ticket notification error',
		});
		return sendPublicError(res, error, 'Ticket notification could not be sent');
	}
}

module.exports = ticketNotification;
