import { describe, expect, it } from 'vitest';
import { getAuthDeliveryErrorMessage, getAuthErrorMessage } from './authErrors';

describe('authentication error messages', () => {
	it('replaces the Supabase email quota error with actionable customer copy', () => {
		expect(getAuthErrorMessage({ message: 'email rate limit exceeded' })).toMatch(
			/temporarily at capacity.*support@softhe\.io/i,
		);
		expect(getAuthErrorMessage({ code: 'over_email_send_rate_limit' })).toMatch(
			/wait before trying again/i,
		);
	});

	it('does not expose provider details or account existence', () => {
		expect(getAuthErrorMessage({ message: 'Invalid login credentials' })).toBe('Sign-in could not be completed. Check your details and try again.');
		expect(getAuthErrorMessage()).toBe('Sign-in could not be completed. Check your details and try again.');
	});

	it('uses a safe CAPTCHA prompt', () => {
		expect(getAuthErrorMessage({ message: 'captcha verification process failed' })).toBe('Complete the security check and try again.');
	});
});

describe('authentication email delivery errors', () => {
	it('surfaces provider, authorization, and capacity failures', () => {
		expect(getAuthDeliveryErrorMessage({ code: 'email_address_not_authorized' })).toMatch(/could not be sent/i);
		expect(getAuthDeliveryErrorMessage({ message: 'Error sending confirmation email through SMTP' })).toMatch(/support@softhe\.io/i);
		expect(getAuthDeliveryErrorMessage({ code: 'over_email_send_rate_limit' })).toMatch(/temporarily at capacity/i);
	});

	it('keeps identity-sensitive signup responses private', () => {
		expect(getAuthDeliveryErrorMessage({ code: 'user_already_exists' })).toBe('');
		expect(getAuthDeliveryErrorMessage({ message: 'User already registered' })).toBe('');
	});
});
