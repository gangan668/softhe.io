const EMAIL_RATE_LIMIT = /(?:email.*rate limit|over_email_send_rate_limit)/i;
const CAPTCHA_ERROR = /captcha/i;

export const getAuthErrorMessage = (error) => {
	const message = String(error?.message || '');
	const code = String(error?.code || '');

	if (EMAIL_RATE_LIMIT.test(`${code} ${message}`)) {
		return 'Verification emails are temporarily at capacity. Please wait before trying again, or contact support@softhe.io for help.';
	}
	if (CAPTCHA_ERROR.test(`${code} ${message}`)) return 'Complete the security check and try again.';

	return 'Sign-in could not be completed. Check your details and try again.';
};
