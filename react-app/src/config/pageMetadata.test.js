import { describe, expect, it } from 'vitest';
import appSource from '../App.jsx?raw';
import { benchmarkResults } from '../data/benchmark';
import { buildPageMetadata, socialCopy } from './pageMetadata';
import { isPrivateRoute } from './routePolicy';

// The route table in App.jsx is the list every metadata entry must match.
const appRoutes = [...appSource.matchAll(/<Route path="([^"*]+)"/g)].map(([, path]) => path);

describe('page metadata table', () => {
	const entries = buildPageMetadata({ commerceEnabled: true });

	it('covers every application route exactly once', () => {
		expect(appRoutes.length).toBeGreaterThan(10);
		expect(entries.map((entry) => entry.path).sort()).toEqual([...appRoutes].sort());
	});

	it('keeps static robots in step with the runtime private-route policy', () => {
		for (const entry of entries) {
			expect(entry.robots === 'noindex, nofollow', entry.path).toBe(isPrivateRoute(entry.path));
		}
	});

	it('gives every route a distinct, branded title and a description', () => {
		expect(new Set(entries.map((entry) => entry.title)).size).toBe(entries.length);
		for (const entry of entries) {
			expect(entry.title, entry.path).toMatch(/\| Softhe\.io$|^Softhe\.io/);
			expect(entry.description.length, entry.path).toBeGreaterThan(20);
			expect(entry.description.length, entry.path).toBeLessThanOrEqual(200);
		}
	});

	it('derives benchmark copy from the published evidence', () => {
		const performance = entries.find((entry) => entry.path === '/performance');
		expect(performance.ogDescription).toContain(`${benchmarkResults.averageFps.stock} and ${benchmarkResults.averageFps.optimized} average FPS`);
	});

	it('only says ordering is unavailable when commerce is disabled', () => {
		const ordering = /ordering is currently unavailable/i;
		const disabled = buildPageMetadata({ commerceEnabled: false });
		for (const path of ['/store', '/checkout']) {
			expect(entries.find((entry) => entry.path === path).description).not.toMatch(ordering);
			expect(disabled.find((entry) => entry.path === path).description).toMatch(ordering);
		}
	});

	it('falls back to page copy for social previews', () => {
		const terms = entries.find((entry) => entry.path === '/terms');
		expect(socialCopy(terms)).toEqual({ ogTitle: terms.title, ogDescription: terms.description });
	});
});
