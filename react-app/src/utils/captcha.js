// Turnstile is active only when explicitly enabled. When enabled without a site
// key the forms fail closed (the widget reports that verification is not configured).
export const readCaptchaConfig = (environment = {}) => {
	const enabled = environment.VITE_CAPTCHA_ENABLED === 'true';
	const siteKey = String(environment.VITE_TURNSTILE_SITE_KEY || '').trim();
	return { enabled, siteKey, configured: enabled && Boolean(siteKey) };
};

export const captchaConfig = readCaptchaConfig(import.meta.env);

export const CAPTCHA_REQUIRED_MESSAGE = 'Complete the security check and try again.';
export const CAPTCHA_NOT_CONFIGURED_MESSAGE = 'Security verification is not configured.';
