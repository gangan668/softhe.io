const RECOVERY_LINK_ERROR = 'This password reset link is invalid or has expired. Request a new link and use only the newest email.';

export const getAuthCallbackError = (hash = '') => {
	const params = new URLSearchParams(String(hash).replace(/^#/, ''));
	const code = params.get('error_code');
	if (code === 'otp_expired') return RECOVERY_LINK_ERROR;
	if (params.get('error') === 'access_denied') return 'The authentication link could not be used. Request a new link and try again.';
	return '';
};

export { RECOVERY_LINK_ERROR };
