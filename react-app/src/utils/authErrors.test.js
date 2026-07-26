import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './authErrors';

describe('authentication error messages', () => {
	it('replaces the Supabase email quota error with actionable customer copy', () => {
		expect(getAuthErrorMessage({ message: 'email rate limit exceeded' })).toMatch(
			/temporarily at capacity.*support@softhe\.io/i,
		);
		expect(getAuthErrorMessage({ code: 'over_email_send_rate_limit' })).toMatch(
			/wait before trying again/i,
		);
	});

	it('preserves useful provider errors and handles an empty error', () => {
		expect(getAuthErrorMessage({ message: 'Invalid login credentials' })).toBe('Invalid login credentials');
		expect(getAuthErrorMessage()).toMatch(/could not be completed/i);
	});
});
