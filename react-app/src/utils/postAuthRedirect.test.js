import { beforeEach, describe, expect, it } from 'vitest';
import { clearPostAuthDestination, peekPostAuthDestination, rememberPostAuthDestination } from './postAuthRedirect';

describe('post-authentication destination', () => {
	beforeEach(() => localStorage.clear());
	it('remembers checkout until it is cleared', () => {
		rememberPostAuthDestination('/checkout');
		expect(peekPostAuthDestination()).toBe('/checkout');
		expect(peekPostAuthDestination()).toBe('/checkout');
		clearPostAuthDestination();
		expect(peekPostAuthDestination()).toBeNull();
	});
	it('expires after 24 hours', () => {
		rememberPostAuthDestination('/checkout', 0);
		expect(peekPostAuthDestination(24 * 60 * 60 * 1000 - 1)).toBe('/checkout');
		expect(peekPostAuthDestination(24 * 60 * 60 * 1000)).toBeNull();
		expect(localStorage.length).toBe(0);
	});
	it.each(['/admin', 'https://evil.example', '//evil.example', undefined])('never stores or returns %s', (path) => {
		rememberPostAuthDestination(path);
		expect(localStorage.length).toBe(0);
		localStorage.setItem('softhe:post-auth-destination', JSON.stringify({ path, expiresAt: Date.now() + 60000 }));
		expect(peekPostAuthDestination()).toBeNull();
	});
	it('ignores malformed storage', () => {
		localStorage.setItem('softhe:post-auth-destination', '{not json');
		expect(peekPostAuthDestination()).toBeNull();
	});
});
