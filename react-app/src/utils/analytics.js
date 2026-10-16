// Google Analytics is retired. Vercel Web Analytics owns consented public page views.
// Keep legacy helper exports inert until their existing callers are removed.
const logDevWarning = (...args) => { if (import.meta.env?.DEV) console.warn(...args); };

export const initGA = () => {};
export const trackPageView = () => {};
export const trackEvent = () => {};
export const trackFormSubmission = () => {};
export const trackButtonClick = () => {};
export const trackPurchase = () => {};
export const trackOutboundLink = () => {};
export const trackError = () => {};
export const trackScrollDepth = () => {};
export const trackVideo = () => {};
export const trackTiming = () => {};
export const setCustomDimensions = () => {};
export const setUserProperties = () => {};

const CONSENT_KEY = 'softhe_analytics_consent';
export const ANALYTICS_CONSENT_EVENT = 'softhe:analytics-consent-change';

/**
 * Get analytics consent status
 * @returns {boolean} Whether consent is granted
 */
export const getAnalyticsConsent = () => {
	try {
		const consent = localStorage.getItem(CONSENT_KEY);
		return consent === 'true';
	} catch (e) {
		logDevWarning('Unable to read consent from localStorage:', e);
		return false;
	}
};

/**
 * Set analytics consent
 * @param {boolean} granted - Whether consent is granted
 */
export const setAnalyticsConsent = (granted) => {
	try {
		localStorage.setItem(CONSENT_KEY, granted.toString());
		window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));

		return true;
	} catch (e) {
		logDevWarning('Unable to save consent to localStorage:', e);
		return false;
	}
};

/**
 * Check if user has made a consent decision
 * @returns {boolean} Whether consent decision exists
 */
export const hasConsentDecision = () => {
	try {
		return localStorage.getItem(CONSENT_KEY) !== null;
	} catch {
		return false;
	}
};

/**
 * Clear consent decision
 */
export const clearConsent = () => {
	try {
		localStorage.removeItem(CONSENT_KEY);
		window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
		return true;
	} catch (e) {
		logDevWarning('Unable to clear consent from localStorage:', e);
		return false;
	}
};
