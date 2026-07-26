const EMAIL_RATE_LIMIT = /(?:email.*rate limit|over_email_send_rate_limit)/i;

export const getAuthErrorMessage = (error) => {
	const message = String(error?.message || '');
	const code = String(error?.code || '');

	if (EMAIL_RATE_LIMIT.test(`${code} ${message}`)) {
		return 'Verification emails are temporarily at capacity. Please wait before trying again, or contact support@softhe.io for help.';
	}

	return message || 'Authentication could not be completed. Please try again.';
};
