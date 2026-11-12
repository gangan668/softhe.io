// Maps backend, Supabase auth and PostgREST errors to short, user-safe copy.
// Raw provider messages can leak implementation details (table names, policy
// names, SQL, account existence), so they are never shown directly. Only
// messages from our own sanitized /api/* endpoints (wrapped in SafeMessageError)
// are passed through, and even those are length-capped.

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const MAX_SERVER_MESSAGE_LENGTH = 200;

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';
export const PERMISSION_DENIED_MESSAGE = 'You do not have permission to do that.';
export const RATE_LIMITED_MESSAGE = 'Too many attempts. Please wait a moment and try again.';
export const INVALID_INPUT_MESSAGE = 'Some details could not be accepted. Check the form and try again.';
export const NETWORK_ERROR_MESSAGE = 'We could not reach the server. Check your connection and try again.';
export const CAPTCHA_FAILED_MESSAGE = 'Security verification failed. Please try again.';
export const REAUTH_INVALID_MESSAGE = 'The verification code is invalid or has expired. Request a new code and try again.';
export const REAUTH_REQUIRED_MESSAGE = 'Enter the verification code we emailed you to confirm this change.';
export const SAME_PASSWORD_MESSAGE = 'Choose a password that is different from your current one.';
export const WEAK_PASSWORD_MESSAGE = 'That password is not strong enough. Use at least 12 characters with uppercase, lowercase, a number, and a symbol.';

const CODE_MESSAGES = {
	// Supabase auth
	bad_jwt: SESSION_EXPIRED_MESSAGE,
	no_authorization: SESSION_EXPIRED_MESSAGE,
	session_not_found: SESSION_EXPIRED_MESSAGE,
	session_expired: SESSION_EXPIRED_MESSAGE,
	refresh_token_not_found: SESSION_EXPIRED_MESSAGE,
	refresh_token_already_used: SESSION_EXPIRED_MESSAGE,
	insufficient_aal: PERMISSION_DENIED_MESSAGE,
	not_admin: PERMISSION_DENIED_MESSAGE,
	over_request_rate_limit: RATE_LIMITED_MESSAGE,
	over_email_send_rate_limit: RATE_LIMITED_MESSAGE,
	over_sms_send_rate_limit: RATE_LIMITED_MESSAGE,
	captcha_failed: CAPTCHA_FAILED_MESSAGE,
	reauthentication_needed: REAUTH_REQUIRED_MESSAGE,
	reauth_nonce_missing: REAUTH_REQUIRED_MESSAGE,
	reauthentication_not_valid: REAUTH_INVALID_MESSAGE,
	otp_expired: REAUTH_INVALID_MESSAGE,
	same_password: SAME_PASSWORD_MESSAGE,
	weak_password: WEAK_PASSWORD_MESSAGE,
	validation_failed: INVALID_INPUT_MESSAGE,
	request_timeout: 'The request timed out. Please try again.',
	// PostgREST / PostgreSQL
	PGRST301: SESSION_EXPIRED_MESSAGE,
	PGRST302: SESSION_EXPIRED_MESSAGE,
	'42501': PERMISSION_DENIED_MESSAGE,
	'23502': INVALID_INPUT_MESSAGE,
	'23505': 'That record already exists.',
	'23514': INVALID_INPUT_MESSAGE,
	'22001': INVALID_INPUT_MESSAGE,
	'22P02': INVALID_INPUT_MESSAGE,
};

const STATUS_MESSAGES = {
	401: SESSION_EXPIRED_MESSAGE,
	403: PERMISSION_DENIED_MESSAGE,
	408: 'The request timed out. Please try again.',
	422: INVALID_INPUT_MESSAGE,
	429: RATE_LIMITED_MESSAGE,
};

// Strips control characters and caps length so a server message cannot flood the UI.
export const capServerMessage = (message, fallback = GENERIC_ERROR_MESSAGE) => {
	if (typeof message !== 'string') return fallback;
	// eslint-disable-next-line no-control-regex
	const cleaned = message.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
	if (!cleaned) return fallback;
	if (cleaned.length <= MAX_SERVER_MESSAGE_LENGTH) return cleaned;
	return `${cleaned.slice(0, MAX_SERVER_MESSAGE_LENGTH - 1).trimEnd()}…`;
};

// An error whose message has already been sanitized by our own server and may be displayed.
export class SafeMessageError extends Error {
	constructor(message, fallback = GENERIC_ERROR_MESSAGE, options) {
		super(capServerMessage(message, fallback), options);
		this.name = 'SafeMessageError';
		this.safeMessage = true;
	}
}

const isNetworkError = (error) => error?.name === 'TypeError' && /fetch|network|load failed/i.test(String(error?.message || ''));

export const getUserErrorMessage = (error, fallback = GENERIC_ERROR_MESSAGE) => {
	if (!error) return fallback;
	if (error.safeMessage === true) return capServerMessage(error.message, fallback);
	if (error.name === 'AbortError') return 'The request timed out. Please try again.';
	if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;

	const code = error.code === undefined || error.code === null ? '' : String(error.code);
	if (code && Object.hasOwn(CODE_MESSAGES, code)) return CODE_MESSAGES[code];

	const status = Number(error.status);
	if (Object.hasOwn(STATUS_MESSAGES, status)) return STATUS_MESSAGES[status];

	return fallback;
};
