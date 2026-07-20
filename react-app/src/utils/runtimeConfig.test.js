import { describe, expect, it } from 'vitest';
import {
	commerceEnabled,
	contactFormEnabled,
	productionReadiness,
	readRuntimeConfig,
} from './runtimeConfig';

describe('runtime production configuration', () => {
	it('keeps interactive flows available in test mode', () => {
		expect(commerceEnabled).toBe(true);
		expect(contactFormEnabled).toBe(true);
		expect(productionReadiness).toEqual(expect.objectContaining({
			commerceEnabled: true,
			contactFormEnabled: true,
		}));
	});

	it('defaults risky production features to disabled', () => {
		expect(readRuntimeConfig({ MODE: 'production' })).toEqual({
			commerceEnabled: false,
			contactFormEnabled: false,
			legalIdentityConfigured: false,
		});
	});

	it('enables configured production features and recognizes legal identity', () => {
		expect(readRuntimeConfig({
			MODE: 'production',
			VITE_COMMERCE_ENABLED: 'true',
			VITE_CONTACT_FORM_ENABLED: 'true',
			VITE_LEGAL_NAME: 'Softhe GmbH',
			VITE_LEGAL_ADDRESS: 'Example Street 1',
		})).toEqual({
			commerceEnabled: true,
			contactFormEnabled: true,
			legalIdentityConfigured: true,
		});
	});

	it('keeps local development features available', () => {
		expect(readRuntimeConfig({ DEV: true })).toEqual(expect.objectContaining({
			commerceEnabled: true,
			contactFormEnabled: true,
		}));
	});
});
