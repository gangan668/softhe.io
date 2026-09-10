import { describe, expect, it } from 'vitest';
import { getAuthCallbackError } from './authCallback';

describe('authentication callback errors', () => {
	it('turns expired OTP fragments into an actionable recovery message', () => {
		expect(getAuthCallbackError('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid')).toMatch(/invalid or has expired/i);
	});

	it('does not interfere with successful callback fragments', () => {
		expect(getAuthCallbackError('#access_token=token&type=recovery')).toBe('');
	});
});
