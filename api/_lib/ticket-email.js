const { sendEmailTemplate } = require('./emailjs');
const { sendTransactionalEmail } = require('./resend');
const { acquireLock, releaseLock } = require('./portal-security');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

const ticketEmailConfigured = () => Boolean(process.env.EMAILJS_TICKET_TEMPLATE_ID || process.env.RESEND_API_KEY);

// Sends one notification per message. EmailJS is preferred; Resend is the fallback.
const sendTicketEmail = async ({ recipient, replyTo, customerName, ticket, message }) => {
	const lockName = `ticket-notification:${message.id}`;
	if (!(await acquireLock(lockName, 30 * 24 * 3600))) return { duplicate: true };
	try {
		const body = message.body.slice(0, 500);
		try {
			if (!process.env.EMAILJS_TICKET_TEMPLATE_ID) throw new Error('EmailJS ticket delivery is not configured');
			await sendEmailTemplate(process.env.EMAILJS_TICKET_TEMPLATE_ID, {
				to_email: recipient, customer_name: customerName, ticket_id: ticket.id,
				ticket_subject: ticket.subject, ticket_status: ticket.status, reply_preview: body,
			});
		} catch (emailJsError) {
			if (!process.env.RESEND_API_KEY) throw emailJsError;
			await sendTransactionalEmail({
				to: recipient,
				replyTo,
				subject: `[Softhe.io ticket] ${ticket.subject}`,
				text: `Ticket: ${ticket.id}\nStatus: ${ticket.status}\n\n${body}`,
				html: `<h1>Softhe.io support ticket</h1><p><strong>Ticket:</strong> ${escapeHtml(ticket.id)}</p><p><strong>Status:</strong> ${escapeHtml(ticket.status)}</p><p>${escapeHtml(body).replace(/\n/g, '<br>')}</p>`,
				idempotencyKey: `ticket-notification/${message.id}`,
			});
		}
	} catch (error) { await releaseLock(lockName).catch(() => {}); throw error; }
	return { duplicate: false };
};

module.exports = { sendTicketEmail, ticketEmailConfigured };
