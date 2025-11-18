/**
 * Analytics Utility
 * Handles Google Analytics integration with consent management
 * and privacy-focused tracking
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Check if Google Analytics is loaded
const isGALoaded = () => {
	return typeof window.gtag === 'function';
};

/**
 * Initialize Google Analytics
 * @param {string} measurementId - GA4 Measurement ID
 */
export const initGA = (measurementId = GA_MEASUREMENT_ID) => {
	// Check if already initialized
	if (isGALoaded()) {
		console.log('Google Analytics already initialized');
		return;
	}

	// Check consent
	const consent = getAnalyticsConsent();
	if (!consent) {
		console.log('Analytics consent not granted');
		return;
	}

	// Load GA script
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
	document.head.appendChild(script);

	// Initialize gtag
	window.dataLayer = window.dataLayer || [];
	window.gtag = function () {
		window.dataLayer.push(arguments);
	};
	window.gtag('js', new Date());
	window.gtag('config', measurementId, {
		anonymize_ip: true, // Anonymize IP addresses
		cookie_flags: 'SameSite=None;Secure', // Cookie security
		send_page_view: true
	});

	console.log('Google Analytics initialized');
};

/**
 * Track page views
 * @param {string} path - Page path
 * @param {string} title - Page title
 */
export const trackPageView = (path, title = document.title) => {
	if (!isGALoaded() || !getAnalyticsConsent()) return;

	window.gtag('event', 'page_view', {
		page_path: path,
		page_title: title,
		page_location: window.location.href
	});
};

/**
 * Track custom events
 * @param {string} action - Event action
 * @param {object} params - Event parameters
 */
export const trackEvent = (action, params = {}) => {
	if (!isGALoaded() || !getAnalyticsConsent()) return;

	window.gtag('event', action, params);
};

/**
 * Track form submissions
 * @param {string} formName - Name of the form
 * @param {string} formType - Type of form (contact, newsletter, etc.)
 */
export const trackFormSubmission = (formName, formType = 'contact') => {
	trackEvent('form_submission', {
		form_name: formName,
		form_type: formType
	});
};

/**
 * Track button clicks
 * @param {string} buttonName - Name/ID of the button
 * @param {string} location - Where the button is located
 */
export const trackButtonClick = (buttonName, location = 'unknown') => {
	trackEvent('button_click', {
		button_name: buttonName,
		button_location: location
	});
};

/**
 * Track product purchases
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 * @param {number} value - Product price
 */
export const trackPurchase = (productId, productName, value) => {
	trackEvent('purchase', {
		transaction_id: `${Date.now()}-${productId}`,
		value: value,
		currency: 'EUR',
		items: [
			{
				item_id: productId,
				item_name: productName,
				price: value,
				quantity: 1
			}
		]
	});
};

/**
 * Track outbound links
 * @param {string} url - The external URL
 * @param {string} linkText - Text of the link
 */
export const trackOutboundLink = (url, linkText = '') => {
	trackEvent('outbound_link', {
		link_url: url,
		link_text: linkText
	});
};

/**
 * Track errors
 * @param {string} errorMessage - Error message
 * @param {string} errorLocation - Where the error occurred
 * @param {boolean} fatal - Whether the error is fatal
 */
export const trackError = (errorMessage, errorLocation = 'unknown', fatal = false) => {
	trackEvent('exception', {
		description: errorMessage,
		fatal: fatal,
		location: errorLocation
	});
};

/**
 * Track scroll depth
 * @param {number} percentage - Scroll percentage (25, 50, 75, 100)
 */
export const trackScrollDepth = (percentage) => {
	trackEvent('scroll', {
		percent_scrolled: percentage
	});
};

/**
 * Track video interactions
 * @param {string} action - play, pause, complete
 * @param {string} videoTitle - Title of the video
 */
export const trackVideo = (action, videoTitle) => {
	trackEvent(`video_${action}`, {
		video_title: videoTitle
	});
};

/**
 * Consent Management
 */
const CONSENT_KEY = 'softhe_analytics_consent';

/**
 * Get analytics consent status
 * @returns {boolean} Whether consent is granted
 */
export const getAnalyticsConsent = () => {
	try {
		const consent = localStorage.getItem(CONSENT_KEY);
		return consent === 'true';
	} catch (e) {
		console.warn('Unable to read consent from localStorage:', e);
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

		if (granted) {
			// Initialize GA if consent is granted
			initGA();
		} else {
			// Disable GA if consent is revoked
			if (isGALoaded()) {
				window.gtag('consent', 'update', {
					analytics_storage: 'denied',
					ad_storage: 'denied'
				});
			}
		}

		return true;
	} catch (e) {
		console.warn('Unable to save consent to localStorage:', e);
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
		return true;
	} catch (e) {
		console.warn('Unable to clear consent from localStorage:', e);
		return false;
	}
};

/**
 * User Timing - Track performance metrics
 * @param {string} name - Metric name
 * @param {number} value - Metric value in milliseconds
 * @param {string} category - Metric category
 */
export const trackTiming = (name, value, category = 'Performance') => {
	if (!isGALoaded() || !getAnalyticsConsent()) return;

	window.gtag('event', 'timing_complete', {
		name: name,
		value: value,
		event_category: category
	});
};

/**
 * Track custom dimensions
 * @param {object} dimensions - Custom dimensions object
 */
export const setCustomDimensions = (dimensions) => {
	if (!isGALoaded() || !getAnalyticsConsent()) return;

	window.gtag('set', dimensions);
};

/**
 * Track user properties
 * @param {object} properties - User properties
 */
export const setUserProperties = (properties) => {
	if (!isGALoaded() || !getAnalyticsConsent()) return;

	window.gtag('set', 'user_properties', properties);
};

// Default export
export default {
	initGA,
	trackPageView,
	trackEvent,
	trackFormSubmission,
	trackButtonClick,
	trackPurchase,
	trackOutboundLink,
	trackError,
	trackScrollDepth,
	trackVideo,
	trackTiming,
	getAnalyticsConsent,
	setAnalyticsConsent,
	hasConsentDecision,
	clearConsent,
	setCustomDimensions,
	setUserProperties
};
