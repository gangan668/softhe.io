const { fetchWithTimeout } = require('./fetch');

const sendEmailTemplate = async (templateId, templateParams, fetchImpl = fetch) => {
	const serviceId = process.env.EMAILJS_SERVICE_ID;
	const publicKey = process.env.EMAILJS_PUBLIC_KEY;
	if (!serviceId || !templateId || !publicKey) {
		throw new Error('Email delivery is not configured');
	}

	const payload = {
		service_id: serviceId,
		template_id: templateId,
		user_id: publicKey,
		template_params: templateParams,
	};
	if (process.env.EMAILJS_PRIVATE_KEY) payload.accessToken = process.env.EMAILJS_PRIVATE_KEY;

	const response = await fetchWithTimeout('https://api.emailjs.com/api/v1.0/email/send', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	}, fetchImpl);
	if (!response.ok) throw new Error('Email delivery failed');
};

module.exports = { sendEmailTemplate };
