import { getAnalyticsConsent } from './analytics';

// Only fixed public routes are measured; auth, checkout, account, and unknown paths are excluded.
const publicPaths = new Set(['/', '/services', '/store', '/performance', '/contact', '/faq', '/privacy-policy', '/cookie-policy', '/terms', '/legal-notice', '/withdrawal']);

export function publicAnalyticsPath(pathname) {
	return publicPaths.has(pathname) ? pathname : null;
}

export function beforeSendAnalytics(event) {
	if (!getAnalyticsConsent() || event?.type !== 'pageview' || !publicAnalyticsPath(window.location.pathname)) return null;
	try {
		const url = new URL(event.url);
		if (url.origin !== window.location.origin || !publicAnalyticsPath(url.pathname)) return null;
		// Rebuild the allowed fields instead of forwarding properties, query strings, or fragments.
		return { type: 'pageview', url: `${url.origin}${url.pathname}` };
	} catch { return null; }
}
