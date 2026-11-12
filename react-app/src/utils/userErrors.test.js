import { describe, expect, it } from 'vitest';
import { readCaptchaConfig } from './captcha';
import {
	CAPTCHA_FAILED_MESSAGE,
	GENERIC_ERROR_MESSAGE,
	INVALID_INPUT_MESSAGE,
	MAX_SERVER_MESSAGE_LENGTH,
	NETWORK_ERROR_MESSAGE,
	PERMISSION_DENIED_MESSAGE,
	RATE_LIMITED_MESSAGE,
	REAUTH_INVALID_MESSAGE,
	REAUTH_REQUIRED_MESSAGE,
	SAME_PASSWORD_MESSAGE,
	SESSION_EXPIRED_MESSAGE,
	SafeMessageError,
	capServerMessage,
	getUserErrorMessage,
} from './userErrors';

describe('getUserErrorMessage', () => {
	it('maps known Supabase auth codes to friendly copy', () => {
		expect(getUserErrorMessage({ code: 'session_expired', message: 'JWT expired' })).toBe(SESSION_EXPIRED_MESSAGE);
		expect(getUserErrorMessage({ code: 'insufficient_aal' })).toBe(PERMISSION_DENIED_MESSAGE);
		expect(getUserErrorMessage({ code: 'over_request_rate_limit' })).toBe(RATE_LIMITED_MESSAGE);
		expect(getUserErrorMessage({ code: 'reauthentication_not_valid', status: 401 })).toBe(REAUTH_INVALID_MESSAGE);
		expect(getUserErrorMessage({ code: 'reauth_nonce_missing' })).toBe(REAUTH_REQUIRED_MESSAGE);
		expect(getUserErrorMessage({ code: 'same_password', status: 422 })).toBe(SAME_PASSWORD_MESSAGE);
		expect(getUserErrorMessage({ code: 'captcha_failed' })).toBe(CAPTCHA_FAILED_MESSAGE);
	});

	it('maps HTTP status codes when the code is unknown', () => {
		expect(getUserErrorMessage({ status: 401, message: 'invalid JWT: token is expired' })).toBe(SESSION_EXPIRED_MESSAGE);
		expect(getUserErrorMessage({ status: 403, message: 'User not allowed' })).toBe(PERMISSION_DENIED_MESSAGE);
		expect(getUserErrorMessage({ status: 429 })).toBe(RATE_LIMITED_MESSAGE);
		expect(getUserErrorMessage({ status: 422, message: 'Unprocessable' })).toBe(INVALID_INPUT_MESSAGE);
	});

	it('maps PostgREST and PostgreSQL codes without leaking database details', () => {
		const rls = { code: '42501', message: 'new row violates row-level security policy for table "profiles"' };
		expect(getUserErrorMessage(rls)).toBe(PERMISSION_DENIED_MESSAGE);
		expect(getUserErrorMessage({ code: 'PGRST301', message: 'JWT expired' })).toBe(SESSION_EXPIRED_MESSAGE);
		expect(getUserErrorMessage({ code: '23514', message: 'violates check constraint "profiles_country_check"' })).toBe(INVALID_INPUT_MESSAGE);
	});

	it('falls back to a generic message for anything else', () => {
		expect(getUserErrorMessage(new Error('relation "secret_table" does not exist'))).toBe(GENERIC_ERROR_MESSAGE);
		expect(getUserErrorMessage({ status: 500, message: 'Database error saving new user' })).toBe(GENERIC_ERROR_MESSAGE);
		expect(getUserErrorMessage(null)).toBe(GENERIC_ERROR_MESSAGE);
		expect(getUserErrorMessage(undefined, 'Custom fallback.')).toBe('Custom fallback.');
		expect(getUserErrorMessage('a raw string')).toBe(GENERIC_ERROR_MESSAGE);
	});

	it('recognises network failures and timeouts', () => {
		expect(getUserErrorMessage(new TypeError('Failed to fetch'))).toBe(NETWORK_ERROR_MESSAGE);
		expect(getUserErrorMessage(Object.assign(new Error('aborted'), { name: 'AbortError' }))).toMatch(/timed out/i);
	});

	it('passes through messages from our sanitized API boundary', () => {
		expect(getUserErrorMessage(new SafeMessageError('Ticket is closed.'))).toBe('Ticket is closed.');
		expect(getUserErrorMessage(new SafeMessageError(undefined, 'Ticket could not be saved'))).toBe('Ticket could not be saved');
	});
});

describe('capServerMessage', () => {
	it('rejects non-string and empty values', () => {
		expect(capServerMessage({ error: 'x' })).toBe(GENERIC_ERROR_MESSAGE);
		expect(capServerMessage(42, 'Fallback')).toBe('Fallback');
		expect(capServerMessage('   ')).toBe(GENERIC_ERROR_MESSAGE);
	});

	it('caps length and strips control characters', () => {
		const capped = capServerMessage('a'.repeat(1000));
		expect(capped.length).toBeLessThanOrEqual(MAX_SERVER_MESSAGE_LENGTH);
		expect(capped.endsWith('…')).toBe(true);
		expect(capServerMessage('Line one\n\u0000Line two')).toBe('Line one Line two');
	});

	it('caps SafeMessageError messages at construction', () => {
		expect(new SafeMessageError('b'.repeat(500)).message.length).toBeLessThanOrEqual(MAX_SERVER_MESSAGE_LENGTH);
	});
});

describe('readCaptchaConfig', () => {
	it('enables Turnstile only when explicitly requested', () => {
		expect(readCaptchaConfig({})).toEqual({ enabled: false, siteKey: '', configured: false });
		expect(readCaptchaConfig({ VITE_CAPTCHA_ENABLED: 'true', VITE_TURNSTILE_SITE_KEY: ' key ' })).toEqual({ enabled: true, siteKey: 'key', configured: true });
		expect(readCaptchaConfig({ VITE_CAPTCHA_ENABLED: 'true' }).configured).toBe(false);
	});
});
