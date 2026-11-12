import { describe, expect, it } from 'vitest';

// Every stylesheet the app ships, as text.
const stylesheets = import.meta.glob('./**/*.css', { query: '?raw', import: 'default', eager: true });
const appCss = stylesheets['./App.css'];
const rootBlock = appCss.match(/:root\s*\{[\s\S]*?\n\}/)[0];
const definedTokens = new Set([...rootBlock.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name));

describe('design tokens', () => {
	it('scan every stylesheet', () => {
		expect(Object.keys(stylesheets).length).toBeGreaterThan(15);
	});

	it('keep raw hex colours inside the App.css token block', () => {
		const offenders = Object.entries(stylesheets).flatMap(([file, css]) => {
			const source = file === './App.css' ? css.replace(rootBlock, '') : css;
			return source.split(/\r?\n/).flatMap((line, index) => (/#[0-9a-fA-F]{3,8}\b/.test(line) ? [`${file}:${index + 1} ${line.trim()}`] : []));
		});
		expect(offenders).toEqual([]);
	});

	it('only reference tokens that App.css defines', () => {
		// A misspelt custom property fails silently in CSS and leaves the declaration unset.
		const missing = Object.entries(stylesheets).flatMap(([file, css]) => [...css.matchAll(/var\((--[\w-]+)/g)]
			.map(([, name]) => name)
			.filter((name) => !definedTokens.has(name) && !new RegExp(`${name}\\s*:`).test(css))
			.map((name) => `${file} ${name}`));
		expect([...new Set(missing)]).toEqual([]);
	});
});
