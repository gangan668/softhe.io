const { fetchWithTimeout } = require('./fetch');
const { clientIp } = require('./portal-security');

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CAPTCHA_FAILED_MESSAGE = 'Security verification failed. Please try again.';
const CAPTCHA_UNAVAILABLE_MESSAGE = 'Security verification is temporarily unavailable. Please try again shortly.';
const MAX_TOKEN_LENGTH = 2048;

const turnstileRequired = (environment = process.env) => Boolean(environment.TURNSTILE_SECRET_KEY?.trim());

// Returns { ok: true } when the request may proceed, otherwise { ok: false, status, error }.
// Verification is enforced only when TURNSTILE_SECRET_KEY is configured.
const verifyTurnstile = async (req, fetchImpl = fetch) => {
	const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
	if (!secret) return { ok: true, skipped: true };

	const token = typeof req.body?.captchaToken === 'string' ? req.body.captchaToken.trim() : '';
	if (!token || token.length > MAX_TOKEN_LENGTH) {
		return { ok: false, status: 400, error: CAPTCHA_FAILED_MESSAGE };
	}

	const form = new URLSearchParams();
	form.append('secret', secret);
	form.append('response', token);
	const ip = clientIp(req);
	if (ip && ip !== 'unknown') form.append('remoteip', ip);

	let result;
	try {
		const response = await fetchWithTimeout(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: form,
		}, fetchImpl);
		if (!response.ok) throw new Error(`Turnstile siteverify returned ${response.status}`);
		result = await response.json();
	} catch (error) {
		console.error('turnstile_verification_unavailable', { message: error.message });
		return { ok: false, status: 503, error: CAPTCHA_UNAVAILABLE_MESSAGE };
	}

	if (result?.success !== true) {
		return { ok: false, status: 400, error: CAPTCHA_FAILED_MESSAGE };
	}
	return { ok: true };
};

module.exports = {
	CAPTCHA_FAILED_MESSAGE,
	CAPTCHA_UNAVAILABLE_MESSAGE,
	SITEVERIFY_URL,
	turnstileRequired,
	verifyTurnstile,
};
