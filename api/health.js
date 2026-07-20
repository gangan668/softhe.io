const { OPERATOR_IDENTITY_KEYS } = require('./_lib/config');

const REQUIRED_CONFIGURATION = [
	'PUBLIC_SITE_URL',
	'LEGAL_NAME',
	'LEGAL_ADDRESS',
	'BUSINESS_REGISTRATION_ID',
	'VAT_STATUS',
	'SUPPORT_EMAIL',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'UPSTASH_REDIS_REST_URL',
	'UPSTASH_REDIS_REST_TOKEN',
	'CONTACT_RATE_LIMIT_SECRET',
	'EMAILJS_SERVICE_ID',
	'EMAILJS_TEMPLATE_ID',
	'EMAILJS_PUBLIC_KEY',
	'EMAILJS_ORDER_TEMPLATE_ID',
	'EMAILJS_WITHDRAWAL_TEMPLATE_ID',
	'EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID',
	'ORDER_FULFILLMENT_WEBHOOK_URL',
	'ORDER_FULFILLMENT_WEBHOOK_SECRET',
];

const getConfigurationStatus = (environment = process.env) => {
	const missing = REQUIRED_CONFIGURATION.filter((key) => !environment[key]?.trim());
	const invalid = [];
	if (environment.VAT_STATUS && !['registered', 'not-registered', 'exempt'].includes(environment.VAT_STATUS)) {
		invalid.push('VAT_STATUS');
	}
	if (environment.VAT_STATUS === 'registered' && !/^SE\d{12}$/.test(environment.VAT_ID || '')) {
		invalid.push('VAT_ID');
	}
	if (environment.BUSINESS_REGISTRATION_ID && !/^\d{6}-?\d{4}$/.test(environment.BUSINESS_REGISTRATION_ID)) {
		invalid.push('BUSINESS_REGISTRATION_ID');
	}
	if (environment.SUPPORT_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(environment.SUPPORT_EMAIL)) {
		invalid.push('SUPPORT_EMAIL');
	}
	try {
		if (environment.PUBLIC_SITE_URL && new URL(environment.PUBLIC_SITE_URL).protocol !== 'https:') invalid.push('PUBLIC_SITE_URL');
	} catch {
		invalid.push('PUBLIC_SITE_URL');
	}
	return { ready: missing.length === 0 && invalid.length === 0, missing, invalid };
};

async function health(req, res) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const configuration = getConfigurationStatus();
	const readyFor = (keys) => !keys.some((key) => configuration.missing.includes(key) || configuration.invalid.includes(key));
	const storageKeys = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
	res.setHeader('Cache-Control', 'no-store');
	return res.status(configuration.ready ? 200 : 503).json({
		status: configuration.ready ? 'ready' : 'configuration-required',
		release: {
			sourceCommit: process.env.RELEASE_SOURCE_COMMIT || null,
			fingerprint: process.env.RELEASE_FINGERPRINT || null,
		},
		checks: {
			checkout: readyFor([...OPERATOR_IDENTITY_KEYS, 'PUBLIC_SITE_URL', 'VAT_STATUS', ...(process.env.VAT_STATUS === 'registered' ? ['VAT_ID'] : []), 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']),
			contact: readyFor([...OPERATOR_IDENTITY_KEYS, ...storageKeys, 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'CONTACT_RATE_LIMIT_SECRET']),
			withdrawal: readyFor([...OPERATOR_IDENTITY_KEYS, ...storageKeys, 'EMAILJS_SERVICE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_WITHDRAWAL_TEMPLATE_ID', 'EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID', 'CONTACT_RATE_LIMIT_SECRET']),
			storage: readyFor(storageKeys),
			fulfillment: readyFor([...OPERATOR_IDENTITY_KEYS, ...storageKeys, 'ORDER_FULFILLMENT_WEBHOOK_URL', 'ORDER_FULFILLMENT_WEBHOOK_SECRET', 'EMAILJS_ORDER_TEMPLATE_ID']),
		},
		missing: configuration.missing,
		invalid: configuration.invalid,
	});
}

module.exports = health;
module.exports.REQUIRED_CONFIGURATION = REQUIRED_CONFIGURATION;
module.exports.getConfigurationStatus = getConfigurationStatus;
