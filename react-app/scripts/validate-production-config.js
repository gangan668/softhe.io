import process from 'node:process';

const isStrict = process.env.VITE_REQUIRE_PRODUCTION_CONFIG === 'true';

if (isStrict) {
	const required = [
		'VITE_APP_URL',
		'VITE_LEGAL_NAME',
		'VITE_LEGAL_ADDRESS',
		'VITE_COMMERCE_ENABLED',
		'VITE_CONTACT_FORM_ENABLED',
	];
	const missing = required.filter((key) => !process.env[key]?.trim());
	const invalidFlags = ['VITE_COMMERCE_ENABLED', 'VITE_CONTACT_FORM_ENABLED']
		.filter((key) => process.env[key] !== 'true');

	if (missing.length || invalidFlags.length) {
		const problems = [
			missing.length ? `missing: ${missing.join(', ')}` : '',
			invalidFlags.length ? `must be true: ${invalidFlags.join(', ')}` : '',
		].filter(Boolean).join('; ');
		throw new Error(`Production configuration is incomplete (${problems})`);
	}
}

console.log(isStrict
	? 'Production client configuration is complete.'
	: 'Strict production configuration validation is disabled.');
