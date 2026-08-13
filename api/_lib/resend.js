const { fetchWithTimeout } = require('./fetch');

const sendTransactionalEmail = async ({ to, subject, text, html, replyTo, idempotencyKey }, fetchImpl = fetch) => {
	const apiKey = process.env.RESEND_API_KEY;
	const supportEmail = process.env.SUPPORT_EMAIL;
	const from = process.env.EMAIL_FROM || (supportEmail ? `Softhe.io Support <${supportEmail}>` : '');
	if (!apiKey || !from) throw new Error('Resend delivery is not configured');

	const response = await fetchWithTimeout('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'Idempotency-Key': idempotencyKey,
		},
		body: JSON.stringify({
			from,
			to: [to],
			subject,
			text,
			html,
			...(replyTo ? { reply_to: [replyTo] } : {}),
		}),
	}, fetchImpl);

	if (!response.ok) {
		const detail = await response.json().catch(() => ({}));
		const error = new Error('Resend delivery failed');
		error.statusCode = response.status;
		error.providerCode = detail.name || detail.code || '';
		throw error;
	}
	return response.json();
};

module.exports = { sendTransactionalEmail };
