import { describe, expect, it } from 'vitest';
import { resolvePublicOrigin } from './publicOrigin';

describe('public origin', () => {
	it('uses the public domain for default and historic production aliases', () => {
		expect(resolvePublicOrigin()).toBe('https://softhe.io');
		expect(resolvePublicOrigin({ VITE_APP_URL: 'https://softhe-io.vercel.app/' })).toBe('https://softhe.io');
	});
	it('preserves explicitly isolated origins and local testing', () => {
		expect(resolvePublicOrigin({ VITE_APP_URL: 'https://candidate.example/' })).toBe('https://candidate.example');
		expect(resolvePublicOrigin({ VITE_PUBLIC_ORIGIN: 'https://test.example', VITE_APP_URL: 'https://softhe.io' })).toBe('https://test.example');
		expect(resolvePublicOrigin({ VITE_APP_URL: 'http://localhost:3000' })).toBe('http://localhost:3000');
	});
	it.each(['garbage', 'http://example.com', 'https://user:password@example.com', 'https://example.com/path', 'https://example.com/?x=1', 'https://example.com/#fragment'])('rejects invalid origin %s', (value) => {
		expect(() => resolvePublicOrigin({ VITE_PUBLIC_ORIGIN: value })).toThrow(/Public origin/);
	});
});
