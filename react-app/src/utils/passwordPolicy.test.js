import { describe, expect, it } from 'vitest';
import { validateStrongPassword } from './passwordPolicy';

describe('password policy', () => {
	it('requires length and four character classes', () => {
		expect(validateStrongPassword('Short1!')).toBe(false);
		expect(validateStrongPassword('alllowercase1!')).toBe(false);
		expect(validateStrongPassword('ALLUPPERCASE1!')).toBe(false);
		expect(validateStrongPassword('NoNumberHere!')).toBe(false);
		expect(validateStrongPassword('NoSymbolHere1')).toBe(false);
		expect(validateStrongPassword('StrongPortal1!')).toBe(true);
	});
});
