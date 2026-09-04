const EMAIL_RATE_LIMIT = /(?:email.*rate limit|over_email_send_rate_limit)/i;
const CAPTCHA_ERROR = /captcha/i;
const EMAIL_DELIVERY_ERROR = /(?:email_address_not_authorized|email address not authorized|smtp|error sending.*email|email.*(?:send|delivery).*failed|failed.*email)/i;

export const getAuthErrorMessage = (error) => {
	const message = String(error?.message || '');
	const code = String(error?.code || '');

	if (EMAIL_RATE_LIMIT.test(`${code} ${message}`)) {
		return 'Verification emails are temporarily at capacity. Please wait before trying again, or contact support@softhe.io for help.';
	}
	if (CAPTCHA_ERROR.test(`${code} ${message}`)) return 'Complete the security check and try again.';

	return 'Sign-in could not be completed. Check your details and try again.';
};

export const getAuthDeliveryErrorMessage = (error) => {
	const message = String(error?.message || '');
	const code = String(error?.code || '');
	const details = `${code} ${message}`;

	if (EMAIL_RATE_LIMIT.test(details)) {
		return 'Verification emails are temporarily at capacity. Please wait before trying again, or contact support@softhe.io for help.';
	}
	if (CAPTCHA_ERROR.test(details)) return 'Complete the security check and try again.';
	if (EMAIL_DELIVERY_ERROR.test(details)) {
		return 'The verification email could not be sent. Please try again later or contact support@softhe.io.';
	}

	// Keep duplicate-account and other identity-sensitive responses indistinguishable.
	return '';
};
