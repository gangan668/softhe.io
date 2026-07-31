export const readRuntimeConfig = (environment = {}) => {
	const nonProductionDefault = Boolean(environment.DEV || environment.MODE === 'test');
	const requested = (name) => environment[name] === 'true' || nonProductionDefault;
	const vatStatus = environment.VITE_VAT_STATUS?.trim();
	const legalIdentityConfigured = Boolean(
		environment.VITE_LEGAL_NAME?.trim()
		&& environment.VITE_LEGAL_ADDRESS?.trim()
		&& environment.VITE_BUSINESS_REGISTRATION_ID?.trim()
		&& environment.VITE_LEGAL_JURISDICTION?.trim()
		&& environment.VITE_SUPPORT_EMAIL?.trim()
		&& ['registered', 'not-registered', 'exempt'].includes(vatStatus)
		&& (vatStatus !== 'registered' || environment.VITE_VAT_ID?.trim()),
	);
	const productionFeaturesAllowed = nonProductionDefault || legalIdentityConfigured;

	return {
		commerceEnabled: requested('VITE_COMMERCE_ENABLED') && productionFeaturesAllowed,
		// Contact delivery is independently guarded by the server-side operator,
		// provider, and rate-limit configuration. Do not require browser-visible
		// business identifiers just to expose the support form.
		contactFormEnabled: requested('VITE_CONTACT_FORM_ENABLED'),
		legalIdentityConfigured,
	};
};

const runtimeConfig = readRuntimeConfig(import.meta.env);

export const { commerceEnabled, contactFormEnabled, legalIdentityConfigured } = runtimeConfig;

export const productionReadiness = {
	commerceEnabled,
	contactFormEnabled,
	legalIdentityConfigured,
};
