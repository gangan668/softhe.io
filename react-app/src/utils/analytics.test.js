import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearConsent,
	getAnalyticsConsent,
	hasConsentDecision,
	initGA,
	setAnalyticsConsent,
	setCustomDimensions,
	setUserProperties,
	trackButtonClick,
	trackError,
	trackEvent,
	trackFormSubmission,
	trackOutboundLink,
	trackPageView,
	trackPurchase,
	trackScrollDepth,
	trackTiming,
	trackVideo,
} from './analytics';

describe('analytics', () => {
	beforeEach(() => {
		localStorage.clear();
		delete window.gtag;
		delete window.dataLayer;
		document.head.querySelectorAll('script[src*="googletagmanager"]').forEach((node) => node.remove());
		vi.restoreAllMocks();
	});

	it('stores, reads, and clears consent decisions', () => {
		expect(hasConsentDecision()).toBe(false);
		expect(getAnalyticsConsent()).toBe(false);
		expect(setAnalyticsConsent(false)).toBe(true);
		expect(hasConsentDecision()).toBe(true);
		expect(getAnalyticsConsent()).toBe(false);
		expect(clearConsent()).toBe(true);
		expect(hasConsentDecision()).toBe(false);
	});

	it('initializes GA only after consent with a valid measurement id', () => {
		localStorage.setItem('softhe_analytics_consent', 'true');
		initGA('invalid');
		expect(window.gtag).toBeUndefined();

		initGA('G-ABC123');
		expect(document.head.querySelector('script[src*="G-ABC123"]')).toBeTruthy();
		expect(window.gtag).toBeTypeOf('function');
		expect(window.dataLayer).toHaveLength(2);

		initGA('G-OTHER');
		expect(document.head.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);
	});

	it('does not emit events without consent or a loaded tracker', () => {
		window.gtag = vi.fn();
		trackEvent('blocked');
		expect(window.gtag).not.toHaveBeenCalled();
	});

	it('emits page views and all event helper payloads after consent', () => {
		localStorage.setItem('softhe_analytics_consent', 'true');
		window.gtag = vi.fn();
		vi.spyOn(Date, 'now').mockReturnValue(1234);

		trackPageView('/store', 'Store');
		trackEvent('custom', { source: 'test' });
		trackFormSubmission('support');
		trackButtonClick('buy', 'store');
		trackPurchase('windows-10', 'Windows 10', 65);
		trackOutboundLink('https://example.com', 'Example');
		trackError('failed', 'checkout', true);
		trackScrollDepth(75);
		trackVideo('play', 'Demo');
		trackTiming('load', 120);
		setCustomDimensions({ customer_type: 'new' });
		setUserProperties({ plan: 'standard' });

		expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({ page_path: '/store' }));
		expect(window.gtag).toHaveBeenCalledWith('event', 'purchase', expect.objectContaining({ transaction_id: '1234-windows-10' }));
		expect(window.gtag).toHaveBeenCalledWith('event', 'timing_complete', expect.objectContaining({ value: 120 }));
		expect(window.gtag).toHaveBeenCalledWith('set', { customer_type: 'new' });
		expect(window.gtag).toHaveBeenCalledWith('set', 'user_properties', { plan: 'standard' });
		expect(window.gtag).toHaveBeenCalledTimes(12);
	});

	it('updates Google consent when permission is revoked', () => {
		window.gtag = vi.fn();
		setAnalyticsConsent(false);
		expect(window.gtag).toHaveBeenCalledWith('consent', 'update', {
			analytics_storage: 'denied',
			ad_storage: 'denied',
		});
	});
});
