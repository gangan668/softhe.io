import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WebAnalytics from './WebAnalytics';
import { clearConsent, setAnalyticsConsent } from '../utils/analytics';
import { beforeSendAnalytics, publicAnalyticsPath } from '../utils/vercelAnalytics';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const analyticsScript = () => document.querySelector('script[src$="/_vercel/insights/script.js"]');
const mount = (path = '/') => render(<MemoryRouter initialEntries={[path]}><WebAnalytics /></MemoryRouter>);
beforeEach(() => {
	vi.stubEnv('PROD', true);
	vi.stubEnv('DEV', false);
	localStorage.clear();
	window.history.replaceState(null, '', '/');
	delete window.va;
	delete window.vaq;
	analyticsScript()?.remove();
});
afterEach(() => { analyticsScript()?.remove(); vi.unstubAllEnvs(); });

describe('consented Vercel Web Analytics', () => {
	it('excludes obsolete guides routes and dynamic guide identifiers', () => {
		expect(publicAnalyticsPath('/guides')).toBeNull();
		expect(publicAnalyticsPath('/guides/private-person')).toBeNull();
	});
	it('loads nothing before consent or after decline', () => {
		mount();
		expect(analyticsScript()).toBeNull();
		act(() => setAnalyticsConsent(false));
		expect(analyticsScript()).toBeNull();
	});
	it('loads same-origin analytics on consent and emits only a fixed public path', async () => {
		mount('/store?token=secret#fragment');
		act(() => setAnalyticsConsent(true));
		await waitFor(() => expect(analyticsScript()).toBeTruthy());
		expect(analyticsScript().dataset.disableAutoTrack).toBe('1');
		expect(analyticsScript().dataset.endpoint).toBe('/_vercel/insights');
		expect(window.vaq).toContainEqual(['pageview', { route: '/store', path: '/store' }]);
		expect(JSON.stringify(window.vaq.filter(([kind]) => kind === 'pageview'))).not.toContain('secret');
	});
	it.each(['/login', '/register', '/reset-password', '/account', '/admin', '/checkout', '/account/private-id', '/unknown-private-id'])('does not initialize on excluded %s', (path) => {
		localStorage.setItem('softhe_analytics_consent', 'true');
		mount(path);
		expect(analyticsScript()).toBeNull();
		expect(publicAnalyticsPath(path)).toBeNull();
	});
	it('stops already loaded analytics on revocation and reset', async () => {
		mount();
		act(() => setAnalyticsConsent(true));
		await waitFor(() => expect(analyticsScript()).toBeTruthy());
		expect(beforeSendAnalytics({ type: 'pageview', url: window.location.href })).toBeTruthy();
		act(() => setAnalyticsConsent(false));
		expect(beforeSendAnalytics({ type: 'pageview', url: window.location.href })).toBeNull();
		act(() => setAnalyticsConsent(true));
		act(() => clearConsent());
		expect(beforeSendAnalytics({ type: 'pageview', url: window.location.href })).toBeNull();
	});
	it('reacts to a consent revocation from another tab', async () => {
		mount();
		act(() => setAnalyticsConsent(true));
		await waitFor(() => expect(analyticsScript()).toBeTruthy());
		act(() => { localStorage.setItem('softhe_analytics_consent', 'false'); window.dispatchEvent(new StorageEvent('storage', { key: 'softhe_analytics_consent' })); });
		expect(beforeSendAnalytics({ type: 'pageview', url: window.location.href })).toBeNull();
	});
	it('removes query, fragment, credentials, and additional event properties', () => {
		localStorage.setItem('softhe_analytics_consent', 'true');
		const origin = window.location.origin;
		expect(beforeSendAnalytics({ type: 'pageview', url: `${origin}/store?session_id=private#access_token=secret`, properties: { customer: 'private' } })).toEqual({ type: 'pageview', url: `${origin}/store` });
		expect(beforeSendAnalytics({ type: 'pageview', url: `http://user:secret@${window.location.host}/store` })).toEqual({ type: 'pageview', url: `${origin}/store` });
	});
	it('drops custom events, private URLs, unknown paths, external origins, and malformed URLs', () => {
		localStorage.setItem('softhe_analytics_consent', 'true');
		for (const event of [{ type: 'event', url: window.location.href }, { type: 'pageview', url: `${window.location.origin}/account/secret` }, { type: 'pageview', url: `${window.location.origin}/unknown-user` }, { type: 'pageview', url: 'https://other.example/store' }, { type: 'pageview', url: 'broken' }]) expect(beforeSendAnalytics(event)).toBeNull();
		window.history.replaceState(null, '', '/reset-password?token_hash=secret');
		expect(beforeSendAnalytics({ type: 'pageview', url: `${window.location.origin}/store` })).toBeNull();
	});
	it('keeps analytics disabled in local development', () => {
		vi.stubEnv('PROD', false);
		localStorage.setItem('softhe_analytics_consent', 'true');
		mount();
		expect(analyticsScript()).toBeNull();
	});
	it('uses existing same-origin CSP allowances without adding analytics domains', () => {
		const config = require('../../../vercel.json');
		const csp = config.headers[0].headers.find(({ key }) => key === 'Content-Security-Policy').value;
		expect(csp).toContain("script-src 'self'");
		expect(csp).toContain("connect-src 'self'");
		expect(csp).not.toContain('va.vercel-scripts.com');
	});
});
