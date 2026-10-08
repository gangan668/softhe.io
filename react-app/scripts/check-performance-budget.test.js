import { describe, expect, it } from 'vitest';
import { collectAssets, measureScenario, assertBudget, portalBudgets, sdkBudgets } from './check-performance-budget.js';

const manifest = {
	entry: { file: 'entry.js', css: ['entry.css'], imports: ['shared'], dynamicImports: ['sdk'] },
	shared: { file: 'shared.js', css: ['shared.css'], imports: ['transitive'] },
	transitive: { file: 'transitive.js', imports: ['shared'] },
	sdk: { file: 'sdk.js', imports: ['shared'] },
};

describe('performance budget', () => {
	it('counts static transitive imports and styles once, including cyclic/shared dependencies', () => {
		expect(collectAssets(manifest, ['entry', 'sdk'])).toEqual(['entry.js', 'entry.css', 'shared.js', 'shared.css', 'transitive.js', 'sdk.js']);
		expect(collectAssets(manifest, ['entry'])).not.toContain('sdk.js');
	});
	it('adds the SDK only to authenticated scenarios', () => {
		const read = () => Buffer.from('some asset bytes');
		const anonymous = measureScenario(manifest, ['entry'], read);
		const authenticated = measureScenario(manifest, ['entry', 'sdk'], read);
		expect(authenticated.js).toBeGreaterThan(anonymous.js);
		expect(authenticated.css).toBe(anonymous.css);
	});
	it('rejects oversized JavaScript and transitive styles rather than silently raising limits', () => {
		expect(() => assertBudget('authenticated', { js: 122881, css: 0 })).toThrow(/authenticated JS/);
		expect(() => assertBudget('anonymous', { js: 0, css: 24577 })).toThrow(/anonymous CSS/);
	});
	it('fails closed when an import is missing from the manifest', () => {
		expect(() => collectAssets(manifest, ['unknown'])).toThrow(/Missing manifest chunk/);
	});
	it('enforces separate portal and SDK caps without changing the public cap', () => {
		expect(() => assertBudget('portal-account', { js: 143361, css: 0 }, portalBudgets)).toThrow(/portal-account JS/);
		expect(() => assertBudget('authentication-sdk', { js: 61441, css: 0 }, sdkBudgets)).toThrow(/authentication-sdk JS/);
	});
});
