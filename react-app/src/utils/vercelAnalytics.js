import { getAnalyticsConsent } from './analytics';

import { publicAnalyticsPath } from '../config/routePolicy';
export { publicAnalyticsPath } from '../config/routePolicy';

export function beforeSendAnalytics(event) {
	if (!getAnalyticsConsent() || event?.type !== 'pageview' || !publicAnalyticsPath(window.location.pathname)) return null;
	try {
		const url = new URL(event.url);
		if (url.origin !== window.location.origin || !publicAnalyticsPath(url.pathname)) return null;
		// Rebuild the allowed fields instead of forwarding properties, query strings, or fragments.
		return { type: 'pageview', url: `${url.origin}${url.pathname}` };
	} catch { return null; }
}
