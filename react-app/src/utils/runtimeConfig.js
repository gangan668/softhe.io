export const readRuntimeConfig = (environment = {}) => {
	const nonProductionDefault = Boolean(environment.DEV || environment.MODE === 'test');
	const enabled = (name) => environment[name] === 'true' || nonProductionDefault;

	return {
		commerceEnabled: enabled('VITE_COMMERCE_ENABLED'),
		contactFormEnabled: enabled('VITE_CONTACT_FORM_ENABLED'),
		legalIdentityConfigured: Boolean(
			environment.VITE_LEGAL_NAME?.trim() && environment.VITE_LEGAL_ADDRESS?.trim(),
		),
	};
};

const runtimeConfig = readRuntimeConfig(import.meta.env);

export const { commerceEnabled, contactFormEnabled, legalIdentityConfigured } = runtimeConfig;

export const productionReadiness = {
	commerceEnabled,
	contactFormEnabled,
	legalIdentityConfigured,
};
