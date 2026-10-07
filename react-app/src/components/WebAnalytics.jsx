import { lazy, Suspense, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { ANALYTICS_CONSENT_EVENT, getAnalyticsConsent } from '../utils/analytics';
import { publicAnalyticsPath } from '../utils/vercelAnalytics';

// A blocked or unavailable optional chunk must not replace the website with an error page.
const VercelAnalyticsClient = lazy(() => import('./VercelAnalyticsClient').catch(() => ({ default: () => null })));

const subscribe = (notify) => {
	window.addEventListener(ANALYTICS_CONSENT_EVENT, notify);
	window.addEventListener('storage', notify);
	return () => {
		window.removeEventListener(ANALYTICS_CONSENT_EVENT, notify);
		window.removeEventListener('storage', notify);
	};
};

export default function WebAnalytics() {
	const consented = useSyncExternalStore(subscribe, getAnalyticsConsent, () => false);
	const { pathname } = useLocation();
	const path = publicAnalyticsPath(pathname);
	if (!import.meta.env.PROD || !consented || !path) return null;
	return <Suspense fallback={null}><VercelAnalyticsClient path={path} /></Suspense>;
}
