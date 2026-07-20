const REQUIRED_CONFIGURATION = [
	'PUBLIC_SITE_URL',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'UPSTASH_REDIS_REST_URL',
	'UPSTASH_REDIS_REST_TOKEN',
	'CONTACT_RATE_LIMIT_SECRET',
	'EMAILJS_SERVICE_ID',
	'EMAILJS_TEMPLATE_ID',
	'EMAILJS_PUBLIC_KEY',
	'ORDER_FULFILLMENT_WEBHOOK_URL',
	'ORDER_FULFILLMENT_WEBHOOK_SECRET',
];

const getConfigurationStatus = (environment = process.env) => {
	const missing = REQUIRED_CONFIGURATION.filter((key) => !environment[key]?.trim());
	return { ready: missing.length === 0, missing };
};

async function health(req, res) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const configuration = getConfigurationStatus();
	res.setHeader('Cache-Control', 'no-store');
	return res.status(configuration.ready ? 200 : 503).json({
		status: configuration.ready ? 'ready' : 'configuration-required',
		checks: {
			checkout: !configuration.missing.some((key) => key.startsWith('STRIPE_')),
			contact: !configuration.missing.some((key) => key.startsWith('EMAILJS_') || key === 'CONTACT_RATE_LIMIT_SECRET'),
			storage: !configuration.missing.some((key) => key.startsWith('UPSTASH_')),
			fulfillment: !configuration.missing.some((key) => key.startsWith('ORDER_FULFILLMENT_')),
		},
		missing: configuration.missing,
	});
}

module.exports = health;
module.exports.REQUIRED_CONFIGURATION = REQUIRED_CONFIGURATION;
module.exports.getConfigurationStatus = getConfigurationStatus;
