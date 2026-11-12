import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as analytics from './analytics';

describe('analytics consent and retired Google Analytics', () => {
 beforeEach(() => { localStorage.clear(); delete window.gtag; delete window.dataLayer; window.history.replaceState(null, '', '/'); vi.restoreAllMocks(); });
 it('stores, reads, and clears consent decisions', () => {
  expect(analytics.hasConsentDecision()).toBe(false); expect(analytics.getAnalyticsConsent()).toBe(false);
  expect(analytics.setAnalyticsConsent(false)).toBe(true); expect(analytics.hasConsentDecision()).toBe(true);
  expect(analytics.setAnalyticsConsent(true)).toBe(true); expect(analytics.getAnalyticsConsent()).toBe(true);
  expect(analytics.clearConsent()).toBe(true); expect(analytics.hasConsentDecision()).toBe(false);
 });
 it('broadcasts consent withdrawal so the active Vercel collector can drop subsequent events', () => {
  const listener = vi.fn(); window.addEventListener(analytics.ANALYTICS_CONSENT_EVENT, listener);
  analytics.setAnalyticsConsent(true); analytics.setAnalyticsConsent(false); analytics.clearConsent();
  expect(listener).toHaveBeenCalledTimes(3); window.removeEventListener(analytics.ANALYTICS_CONSENT_EVENT, listener);
 });
 it.each(['/', '/store?code=private#access_token=secret', '/account', '/admin', '/reset-password?token_hash=private', '/checkout'])('never loads or invokes Google Analytics at %s even when configured and consented', (path) => {
  window.history.replaceState(null, '', path); window.gtag = vi.fn();
  analytics.setAnalyticsConsent(true); analytics.initGA('G-ABC123'); analytics.trackPageView(path);
  analytics.trackEvent('faq_search', { search_term: 'private user data' }); analytics.trackPurchase('private', 'private', 50);
  analytics.trackTiming('load', 1); analytics.setCustomDimensions({ private: true }); analytics.setUserProperties({ private: true });
  analytics.setAnalyticsConsent(false); analytics.trackEvent('after_revocation');
  expect(window.gtag).not.toHaveBeenCalled(); expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull(); expect(window.dataLayer).toBeUndefined();
 });
});
