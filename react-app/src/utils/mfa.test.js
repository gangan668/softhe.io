import { describe, expect, it } from 'vitest';
import { mfaStepRequired } from './mfa';

const jwt = (claims) => `header.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.signature`;
const enrolled = { factors: [{ status: 'verified' }] };

describe('mfaStepRequired', () => {
	it('requires AAL2 only for accounts with a verified factor', () => {
		expect(mfaStepRequired({ user: enrolled, access_token: jwt({ aal: 'aal1' }) })).toBe(true);
		expect(mfaStepRequired({ user: enrolled, access_token: jwt({ aal: 'aal2' }) })).toBe(false);
		expect(mfaStepRequired({ user: { factors: [{ status: 'unverified' }] }, access_token: jwt({ aal: 'aal1' }) })).toBe(false);
		expect(mfaStepRequired({ user: {}, access_token: jwt({ aal: 'aal1' }) })).toBe(false);
		expect(mfaStepRequired(null)).toBe(false);
	});
	it('treats an unreadable token on an enrolled account as unverified', () => {
		expect(mfaStepRequired({ user: enrolled, access_token: 'not-a-jwt' })).toBe(true);
	});
});
