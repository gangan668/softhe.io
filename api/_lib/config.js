const OPERATOR_IDENTITY_KEYS = [
	'LEGAL_NAME',
	'LEGAL_ADDRESS',
	'BUSINESS_REGISTRATION_ID',
	'SUPPORT_EMAIL',
];

const missingKeys = (keys, environment = process.env) => keys
	.filter((key) => !environment[key]?.trim());

const assertOperatorIdentity = (environment = process.env) => {
	if (missingKeys(OPERATOR_IDENTITY_KEYS, environment).length) {
		throw new Error('Operator identity is not configured');
	}
	if (!/^\d{6}-?\d{4}$/.test(environment.BUSINESS_REGISTRATION_ID)) {
		throw new Error('Operator identity is not configured');
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(environment.SUPPORT_EMAIL)) {
		throw new Error('Operator identity is not configured');
	}
};

const assertCommerceConfiguration = (environment = process.env) => {
	assertOperatorIdentity(environment);
	if (!['registered', 'not-registered', 'exempt'].includes(environment.VAT_STATUS)) {
		throw new Error('Commerce VAT status is not configured');
	}
	if (environment.VAT_STATUS === 'registered' && !/^SE\d{12}$/.test(environment.VAT_ID || '')) {
		throw new Error('Commerce VAT identity is not configured');
	}
	let publicUrl;
	try {
		publicUrl = new URL(environment.PUBLIC_SITE_URL);
	} catch {
		throw new Error('Commerce public URL is not configured');
	}
	if (publicUrl.protocol !== 'https:') throw new Error('Commerce public URL is not configured');
};

module.exports = {
	OPERATOR_IDENTITY_KEYS,
	assertCommerceConfiguration,
	assertOperatorIdentity,
	missingKeys,
};
